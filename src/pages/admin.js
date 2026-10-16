import { html } from '../lib/html.js';
import { pageHead, empty, toast, formData } from '../lib/ui.js';
import { auth, isAdmin } from '../lib/auth.js';
import { supabase } from '../lib/supabase.js';
import { getSeasons, getGames, clearCache } from '../lib/data.js';
import { sendEmail } from '../lib/email.js';
import { fmtDate, fmtTime } from '../lib/format.js';
import { query } from '../lib/router.js';

const TABS = [['registrations', 'Registrations'], ['messages', 'Messages'], ['scores', 'Scores'], ['email', 'Email'], ['news', 'Post news']];

export default async function admin({ tab = 'registrations' }) {
  if (!auth().session) { location.hash = '#/account'; return ''; }
  if (!isAdmin()) return html`${pageHead('Admin')}<div class="wrap section">${empty('Admins only', 'Ask the Commissioner to grant your account admin access.')}</div>`;

  const seasons = await getSeasons();
  const seasonId = query().get('season') || seasons.find((s) => s.is_current)?.id;
  const view = await ({ registrations, messages, scores, email, news }[tab] || registrations)(seasons, seasonId);

  return {
    html: html`
      ${pageHead('Admin dashboard', '', 'Board tools')}
      <section class="section"><div class="wrap">
        <nav class="tabs boxed">${TABS.map(([k, l]) => html`<a href="#/admin/${k}" class="${k === tab ? 'active' : ''}">${l}</a>`)}</nav>
        ${view.html}
      </div></section>`,
    mount(root) {
      root.querySelector('#season-filter')?.addEventListener('change', (e) => { location.hash = `#/admin/${tab}?season=${e.target.value}`; });
      view.mount?.(root);
    },
  };
}

const seasonSelect = (seasons, id) => html`<label class="season-pick">Season <select id="season-filter">
  ${seasons.map((s) => html`<option value="${s.id}" ${s.id === id ? 'selected' : ''}>${s.league?.short_name} — ${s.name}</option>`)}</select></label>`;

async function registrations(seasons, seasonId) {
  const { data: rows = [], error } = await supabase.from('registrations').select('*').eq('season_id', seasonId).order('created_at');
  if (error) throw error;
  const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {});
  return {
    html: html`
      <div class="admin-bar">${seasonSelect(seasons, seasonId)}
        <div class="stat-row">${['pending', 'paid', 'pool', 'assigned'].map((s) => html`<span class="stat"><strong>${counts[s] || 0}</strong> ${s}</span>`)}</div>
        <button class="btn btn-outline btn-sm" id="csv">Export CSV</button></div>
      ${rows.length ? html`<div class="table-wrap"><table class="table">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Born</th><th>Returning</th><th>Positions</th><th>Submitted</th><th>Status</th></tr></thead>
        <tbody>${rows.map((r) => html`<tr>
          <td>${r.first_name} ${r.last_name}</td><td><a href="mailto:${r.email}">${r.email}</a></td><td>${r.phone}</td><td>${r.birth_year}</td>
          <td>${r.returning_player ? `Yes${r.prior_team ? ` (${r.prior_team})` : ''}` : 'New'}</td><td>${(r.positions || []).join(', ')}</td>
          <td>${fmtDate(r.created_at.slice(0, 10))}</td>
          <td><select data-reg="${r.id}">${['pending', 'paid', 'pool', 'assigned', 'withdrawn'].map((s) => html`<option ${s === r.status ? 'selected' : ''}>${s}</option>`)}</select></td>
        </tr>`)}</tbody></table></div>` : empty('No registrations for this season yet')}`,
    mount(root) {
      root.querySelectorAll('[data-reg]').forEach((sel) => sel.addEventListener('change', async () => {
        const patch = { status: sel.value, ...(sel.value === 'paid' ? { paid_at: new Date().toISOString() } : {}) };
        const { error: err } = await supabase.from('registrations').update(patch).eq('id', sel.dataset.reg);
        toast(err ? err.message : 'Status updated', err ? 'error' : 'ok');
      }));
      root.querySelector('#csv')?.addEventListener('click', () => {
        const cols = ['first_name', 'last_name', 'email', 'phone', 'birth_year', 'returning_player', 'prior_team', 'shirt_size', 'positions', 'emergency_name', 'emergency_phone', 'status', 'created_at'];
        const q = (v) => `"${String(Array.isArray(v) ? v.join(' ') : v ?? '').replace(/"/g, '""')}"`;
        const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => q(r[c])).join(','))].join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'registrations.csv'; a.click();
      });
    },
  };
}

async function messages() {
  const { data: rows = [], error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return {
    html: rows.length ? html`<div class="msg-list">${rows.map((m) => html`
      <article class="card msg ${m.handled ? 'handled' : ''}">
        <header><strong>${m.name}</strong> · <a href="mailto:${m.email}">${m.email}</a> <span class="pill">${m.topic}</span>
          <span class="muted small">${new Date(m.created_at).toLocaleString()}</span></header>
        <p>${m.message}</p>
        <label class="check"><input type="checkbox" data-msg="${m.id}" ${m.handled ? 'checked' : ''}> Handled</label>
      </article>`)}</div>` : empty('No messages yet'),
    mount(root) {
      root.querySelectorAll('[data-msg]').forEach((cb) => cb.addEventListener('change', async () => {
        await supabase.from('contact_messages').update({ handled: cb.checked }).eq('id', cb.dataset.msg);
        cb.closest('.msg').classList.toggle('handled', cb.checked);
      }));
    },
  };
}

async function scores(seasons, seasonId) {
  const games = await getGames(seasonId);
  return {
    html: html`<div class="admin-bar">${seasonSelect(seasons, seasonId)}</div>
      ${games.length ? html`<div class="table-wrap"><table class="table">
        <thead><tr><th>Date</th><th>Time</th><th>Away</th><th>Score</th><th>Home</th><th>Status</th><th></th></tr></thead>
        <tbody>${games.map((g) => html`<tr data-game="${g.id}">
          <td>${fmtDate(g.game_date)}</td><td>${fmtTime(g.start_time)}</td><td>${g.away?.name}</td>
          <td class="score-edit"><input type="number" min="0" name="away_score" value="${g.away_score ?? ''}"> – <input type="number" min="0" name="home_score" value="${g.home_score ?? ''}"></td>
          <td>${g.home?.name}</td>
          <td><select name="status">${['scheduled', 'final', 'postponed', 'cancelled', 'forfeit'].map((s) => html`<option ${s === g.status ? 'selected' : ''}>${s}</option>`)}</select></td>
          <td><button class="btn btn-sm" data-save>Save</button></td></tr>`)}</tbody></table></div>`
        : empty('No games scheduled', 'Schedule import is on the backlog; games can be added in Supabase for now.')}`,
    mount(root) {
      root.querySelectorAll('[data-save]').forEach((btn) => btn.addEventListener('click', async () => {
        const tr = btn.closest('tr');
        const num = (n) => { const v = tr.querySelector(`[name=${n}]`).value; return v === '' ? null : Number(v); };
        const { error } = await supabase.from('games').update({
          away_score: num('away_score'), home_score: num('home_score'), status: tr.querySelector('[name=status]').value,
        }).eq('id', tr.dataset.game);
        clearCache();
        toast(error ? error.message : 'Score saved', error ? 'error' : 'ok');
      }));
    },
  };
}

async function email(seasons, seasonId) {
  return {
    html: html`<form id="email-form" class="form card">
      <h2>Send an email</h2>
      <p class="muted">Sent through Resend from the league address. Recipients are BCC'd in batches.</p>
      <label>Audience<select name="audience">
        <option value="season">Everyone registered for a season</option>
        <option value="all">All registrants (every season)</option>
        <option value="test">Test — send only to me (${auth().session.user.email})</option>
      </select></label>
      ${seasonSelect(seasons, seasonId)}
      <label>Subject<input name="subject" required maxlength="200"></label>
      <label>Message<textarea name="body" rows="10" required></textarea><small>Plain text. Blank lines start new paragraphs.</small></label>
      <button class="btn btn-accent" type="submit">Send email</button>
    </form>`,
    mount(root) {
      root.querySelector('#season-filter').removeAttribute('id');
      root.querySelector('#email-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const d = formData(f);
        const sid = f.querySelector('select:not([name])').value;
        if (d.audience !== 'test' && !confirm('Send this email to the selected audience now?')) return;
        const btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Sending…';
        const res = await sendEmail({ type: 'broadcast', audience: d.audience, season_id: sid, subject: d.subject, body: d.body });
        btn.disabled = false; btn.textContent = 'Send email';
        if (res?.ok) toast(`Sent to ${res.recipients} recipient(s)`); else toast(res?.error || 'Send failed', 'error');
      });
    },
  };
}

async function news() {
  return {
    html: html`<form id="post-form" class="form card">
      <h2>Post an announcement</h2>
      <label>Title<input name="title" required></label>
      <label>Short summary<input name="excerpt" maxlength="240"></label>
      <label>Body<textarea name="body" rows="10" required></textarea><small>Blank line = new paragraph. Lines starting with "- " become a list. **bold** works.</small></label>
      <label class="check"><input type="checkbox" name="pinned" value="true"> Pin to top</label>
      <button class="btn btn-accent" type="submit">Publish</button>
    </form>`,
    mount(root) {
      root.querySelector('#post-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const d = formData(e.target);
        const slug = `${d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
        const { error } = await supabase.from('posts').insert({ slug, title: d.title, excerpt: d.excerpt, body: d.body, pinned: d.pinned === 'true', published_at: new Date().toISOString() });
        if (error) { toast(error.message, 'error'); return; }
        clearCache();
        toast('Published');
        location.hash = `#/news/${slug}`;
      });
    },
  };
}
