import { html } from '../lib/html.js';
import { pageHead, toast, formData } from '../lib/ui.js';
import { auth, sendMagicLink, signOut, isAdmin } from '../lib/auth.js';
import { supabase } from '../lib/supabase.js';
import { fmtDate } from '../lib/format.js';

export default async function account() {
  const { session, profile } = auth();
  if (!session) {
    return {
      html: html`
        ${pageHead('Sign in', 'No password needed — we\'ll email you a secure sign-in link.', 'My account')}
        <section class="section"><div class="wrap narrow">
          <form id="login" class="form card">
            <label>Email address<input type="email" name="email" required autocomplete="email"></label>
            <button class="btn btn-accent" type="submit">Email me a sign-in link</button>
            <p class="muted small">Use the same email you registered with to see your registrations.</p>
          </form>
        </div></section>`,
      mount(root) {
        root.querySelector('#login').addEventListener('submit', async (e) => {
          e.preventDefault();
          const { email } = formData(e.target);
          const { error } = await sendMagicLink(email);
          if (error) toast(error.message, 'error');
          else e.target.outerHTML = String(html`<div class="card success-card"><h2>Check your email</h2><p>We sent a sign-in link to <strong>${email}</strong>.</p></div>`);
        });
      },
    };
  }

  const { data: regs } = await supabase.from('registrations')
    .select('id, status, created_at, season:seasons(name, league:leagues(name))')
    .order('created_at', { ascending: false });

  return {
    html: html`
      ${pageHead(profile?.full_name || 'My account', session.user.email, 'My account')}
      <section class="section"><div class="wrap narrow">
        ${isAdmin() ? html`<p class="notice">You have admin access. <a href="#/admin">Open the admin dashboard →</a></p>` : ''}
        <form id="profile" class="form card">
          <h2>Profile</h2>
          <div class="grid-2">
            <label>Full name<input name="full_name" value="${profile?.full_name || ''}"></label>
            <label>Phone<input name="phone" type="tel" value="${profile?.phone || ''}"></label>
          </div>
          <button class="btn" type="submit">Save</button>
        </form>
        <div class="card">
          <h2>My registrations</h2>
          ${regs?.length ? html`<ul class="plain">${regs.map((r) => html`<li><strong>${r.season?.league?.name} — ${r.season?.name}</strong><br><span class="status s-${r.status}">${r.status}</span> <span class="muted small">submitted ${fmtDate(r.created_at.slice(0, 10), { month: 'short', day: 'numeric', year: 'numeric' })}</span></li>`)}</ul>`
            : html`<p class="muted">No registrations found for ${session.user.email}. <a href="#/register">Register now</a>.</p>`}
        </div>
        <button class="btn btn-outline" id="signout">Sign out</button>
      </div></section>`,
    mount(root) {
      root.querySelector('#profile').addEventListener('submit', async (e) => {
        e.preventDefault();
        const d = formData(e.target);
        const { error } = await supabase.from('profiles').update({ full_name: d.full_name, phone: d.phone }).eq('id', session.user.id);
        toast(error ? error.message : 'Profile saved', error ? 'error' : 'ok');
      });
      root.querySelector('#signout').addEventListener('click', async () => { await signOut(); location.hash = '#/'; });
    },
  };
}
