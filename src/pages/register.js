import { html } from '../lib/html.js';
import { icon, pageHead, empty, toast, formData } from '../lib/ui.js';
import { query } from '../lib/router.js';
import { supabase } from '../lib/supabase.js';
import { getLeagues, getSeasons } from '../lib/data.js';
import { sendEmail } from '../lib/email.js';
import { fmtMoney, fmtDate, todayISO } from '../lib/format.js';

function regStatus(season) {
  const t = todayISO();
  if (season.reg_opens && t < season.reg_opens) return { label: `Opens ${fmtDate(season.reg_opens, { month: 'long', day: 'numeric' })}`, kind: 'soon' };
  if (!season.reg_closes) {
    return season.starts_on && season.starts_on <= t
      ? { label: 'Season underway · pool registration', kind: 'pool' }
      : { label: 'Registration open', kind: 'open' };
  }
  if (t <= season.reg_closes) return { label: 'Registration open', kind: 'open' };
  if (season.late_reg_closes && t <= season.late_reg_closes) return { label: 'Late registration', kind: 'late' };
  return { label: 'Pool registration', kind: 'pool' };
}

export default async function register() {
  const [leagues, seasons] = await Promise.all([getLeagues(), getSeasons()]);
  const open = seasons.filter((s) => s.is_current || (s.reg_opens && s.reg_opens <= todayISO() && (s.ends_on || '9999') >= todayISO()));
  if (!open.length) return html`${pageHead('Register')}<div class="wrap section">${empty('Registration is not open right now', 'Check the calendar for the next registration window.')}</div>`;

  const want = query().get('league');
  const pre = open.find((s) => s.league?.slug === want) || open[0];
  const thisYear = new Date().getFullYear();

  return {
    html: html`
      ${pageHead('Register to play', 'Sign up online in a few minutes. You are not fully registered until your fee is paid.', 'Registration')}
      <section class="section"><div class="wrap two-col wide-left">
        <form id="reg-form" class="form card" novalidate>
          <fieldset>
            <legend>League &amp; season</legend>
            <div class="season-options">
              ${open.map((s) => {
                const st = regStatus(s);
                return html`<label class="option-card" style="--accent:${s.league.accent}">
                  <input type="radio" name="season_id" value="${s.id}" ${s.id === pre.id ? 'checked' : ''} required>
                  <span><strong>${s.league.name}</strong><span class="muted">${s.name}${s.fee_cents ? html` · ${fmtMoney(s.fee_cents)}` : ''}</span><span class="status st-${st.kind}">${st.label}</span></span>
                </label>`;
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend>About you</legend>
            <div class="grid-2">
              <label>First name<input name="first_name" required autocomplete="given-name"></label>
              <label>Last name<input name="last_name" required autocomplete="family-name"></label>
              <label>Email<input name="email" type="email" required autocomplete="email"></label>
              <label>Phone<input name="phone" type="tel" autocomplete="tel" required></label>
              <label>Birth year<input name="birth_year" type="number" min="1920" max="${thisYear - 50}" required inputmode="numeric"><small>You must turn 50 by Dec 31, ${thisYear}.</small></label>
              <label>Shirt size<select name="shirt_size"><option value="">Select…</option>${['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map((s) => html`<option>${s}</option>`)}</select></label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Softball</legend>
            <label class="check"><input type="checkbox" name="returning_player" value="true"> I played in this league last season</label>
            <label>Previous team (if returning)<input name="prior_team"></label>
            <div class="positions">
              <span>Positions you can play</span>
              ${['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF'].map((p) => html`<label class="chip"><input type="checkbox" name="positions" value="${p}"> ${p}</label>`)}
            </div>
          </fieldset>
          <fieldset>
            <legend>Emergency contact</legend>
            <div class="grid-2">
              <label>Name<input name="emergency_name" required></label>
              <label>Phone<input name="emergency_phone" type="tel" required></label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Waiver</legend>
            <p class="small muted">I understand softball involves risk of injury. I am physically able to participate, I release Nebraska Senior Softball, its directors, sponsors and the City of La Vista from liability for injuries, and I agree to follow league rules and show respect to players, fans and umpires.</p>
            <label class="check"><input type="checkbox" name="waiver_accepted" value="true" required> I have read and accept the waiver</label>
          </fieldset>
          <p class="form-error" role="alert" hidden></p>
          <button class="btn btn-accent btn-lg" type="submit">Submit registration ${icon('arrow')}</button>
        </form>
        <aside>
          <div class="card">
            <h3>How payment works</h3>
            <p>After you submit, pay your fee by PayPal, Venmo, credit/debit card, or check payable to <strong>"NSS"</strong>. You'll get an email confirmation with details.</p>
            <p class="muted small">Players who aren't paid by the deadline become pool players.</p>
          </div>
          <div class="card">
            <h3>Pool players</h3>
            <p>Late registrants are evaluated and placed in the player pool. The Director of Player Personnel assigns pool players to fill openings and substitute needs during the season.</p>
          </div>
          <div class="card">
            <h3>Questions?</h3>
            <p>Email <a href="mailto:info@neseniorsoftball.com">info@neseniorsoftball.com</a> or use the <a href="#/contact">contact form</a>.</p>
          </div>
        </aside>
      </div></section>`,
    mount(root) {
      const form = root.querySelector('#reg-form');
      const errEl = form.querySelector('.form-error');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errEl.hidden = true;
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const d = formData(form);
        const birthYear = Number(d.birth_year);
        if (thisYear - birthYear < 50) { errEl.textContent = `Players must turn 50 by December 31, ${thisYear}.`; errEl.hidden = false; return; }
        const btn = form.querySelector('button[type=submit]');
        btn.disabled = true; btn.textContent = 'Submitting…';
        const id = crypto.randomUUID();
        const season = open.find((s) => s.id === d.season_id);
        const row = {
          id, season_id: d.season_id,
          first_name: d.first_name.trim(), last_name: d.last_name.trim(), email: d.email.trim().toLowerCase(),
          phone: d.phone, birth_year: birthYear, shirt_size: d.shirt_size || null,
          returning_player: d.returning_player === 'true', prior_team: d.prior_team || null,
          positions: [...form.querySelectorAll('input[name=positions]:checked')].map((i) => i.value),
          emergency_name: d.emergency_name, emergency_phone: d.emergency_phone,
          waiver_accepted: true, amount_cents: season?.fee_cents ?? null,
        };
        const { error } = await supabase.from('registrations').insert(row);
        if (error) {
          errEl.textContent = `We couldn't save your registration: ${error.message}`; errEl.hidden = false;
          btn.disabled = false; btn.textContent = 'Submit registration';
          return;
        }
        sendEmail({ type: 'registration_confirmation', registration_id: id });
        toast('Registration received!');
        root.querySelector('.two-col').innerHTML = String(html`
          <div class="card success-card">
            <h2>You're registered, ${row.first_name}!</h2>
            <p>We received your registration for <strong>${season?.league?.name} — ${season?.name}</strong>. A confirmation is on its way to <strong>${row.email}</strong>.</p>
            ${season?.fee_cents ? html`<p>Your fee is <strong>${fmtMoney(season.fee_cents)}</strong>. Please pay by PayPal, Venmo, card, or check payable to "NSS". Your spot is held once payment is received.</p>` : ''}
            <p><a class="btn" href="#/calendar">See the calendar</a> <a class="btn btn-outline" href="#/">Back home</a></p>
          </div>`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    },
  };
}
