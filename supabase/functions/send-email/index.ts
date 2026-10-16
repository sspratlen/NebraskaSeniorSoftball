// Supabase Edge Function: all outbound email for Nebraska Senior Softball via Resend.
//
// Secrets (Supabase dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY   required
//   EMAIL_FROM       e.g. "Nebraska Senior Softball <noreply@neseniorsoftball.com>" (domain verified in Resend)
//   BOARD_INBOX      fallback inbox for contact-form notifications (default info@neseniorsoftball.com)
//   SITE_URL         public site URL used in email links
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// Message types:
//   registration_confirmation { registration_id }  public; only for a fresh, unconfirmed registration
//   contact_notification      { message_id }       public; only for a fresh, un-notified message
//   broadcast { audience: 'test'|'season'|'all', season_id?, subject, body }  admins only

import { createClient } from 'npm:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Nebraska Senior Softball <onboarding@resend.dev>';
const BOARD_INBOX = Deno.env.get('BOARD_INBOX') ?? 'info@neseniorsoftball.com';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://neseniorsoftball.com';
const FRESH_MS = 15 * 60 * 1000;

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const paragraphs = (text: string) => text.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

function layout(title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f3f0e8;font-family:Arial,Helvetica,sans-serif;color:#16202c">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
    <tr><td style="background:#0f2a4a;border-bottom:4px solid #c8102e;padding:20px 28px;color:#fff;font-size:20px;font-weight:bold;letter-spacing:1px">NEBRASKA SENIOR SOFTBALL</td></tr>
    <tr><td style="padding:28px;font-size:17px;line-height:1.6"><h1 style="font-size:22px;margin:0 0 16px">${esc(title)}</h1>${inner}</td></tr>
    <tr><td style="padding:18px 28px;background:#f3f0e8;font-size:13px;color:#5b6573">Nebraska Senior Softball · P.O. Box 460631, Papillion, NE 68046 · <a href="${SITE_URL}" style="color:#1c4f8f">${SITE_URL.replace(/^https?:\/\//, '')}</a></td></tr>
  </table></td></tr></table></body></html>`;
}

type Mail = { to: string[]; subject: string; html: string; text?: string; reply_to?: string };

async function resend(path: string, payload: unknown) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
  const res = await fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${data?.message ?? JSON.stringify(data)}`);
  return data;
}
const sendOne = (m: Mail) => resend('/emails', { from: EMAIL_FROM, ...m });
async function sendMany(mails: Mail[]) {
  const ids: string[] = [];
  for (let i = 0; i < mails.length; i += 100) {
    const out = await resend('/emails/batch', mails.slice(i, i + 100).map((m) => ({ from: EMAIL_FROM, ...m })));
    (out?.data ?? []).forEach((d: { id: string }) => ids.push(d.id));
  }
  return ids;
}

const isFresh = (ts: string) => Date.now() - new Date(ts).getTime() < FRESH_MS;

async function registrationConfirmation(id: string) {
  const { data: r } = await admin.from('registrations')
    .select('*, season:seasons(name, fee_cents, league:leagues(name, contact_email))').eq('id', id).maybeSingle();
  if (!r) return json({ ok: false, error: 'not found' }, 404);
  if (r.confirmation_sent_at || !isFresh(r.created_at)) return json({ ok: true, skipped: true });
  const fee = r.season?.fee_cents ? `$${(r.season.fee_cents / 100).toFixed(0)}` : null;
  const html = layout(`You're registered, ${r.first_name}!`, `
    <p>Thanks for registering for <strong>${esc(r.season?.league?.name)} — ${esc(r.season?.name)}</strong>.</p>
    ${fee ? `<p>Your registration fee is <strong>${fee}</strong>. Pay by PayPal, Venmo, credit/debit card, or check payable to "NSS". You are not fully registered until your fee is paid, and players not paid by the deadline become pool players.</p>` : ''}
    <p style="background:#f3f0e8;padding:12px 16px;border-radius:8px;font-size:15px">
      Name: ${esc(r.first_name)} ${esc(r.last_name)}<br>Phone: ${esc(r.phone)}<br>Birth year: ${esc(r.birth_year)}<br>
      ${r.returning_player ? `Returning player${r.prior_team ? ` (${esc(r.prior_team)})` : ''}` : 'New player'}</p>
    <p>Questions? Reply to this email or write to <a href="mailto:${esc(r.season?.league?.contact_email ?? BOARD_INBOX)}">${esc(r.season?.league?.contact_email ?? BOARD_INBOX)}</a>.</p>
    <p><a href="${SITE_URL}/#/calendar" style="display:inline-block;background:#c8102e;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">See the season calendar</a></p>`);
  await sendOne({ to: [r.email], subject: `Registration received — ${r.season?.league?.name} ${r.season?.name}`, html, reply_to: r.season?.league?.contact_email ?? BOARD_INBOX });
  await admin.from('registrations').update({ confirmation_sent_at: new Date().toISOString() }).eq('id', id);
  return json({ ok: true });
}

async function contactNotification(id: string) {
  const { data: m } = await admin.from('contact_messages').select('*').eq('id', id).maybeSingle();
  if (!m) return json({ ok: false, error: 'not found' }, 404);
  if (m.notified_at || !isFresh(m.created_at)) return json({ ok: true, skipped: true });
  const { data: league } = await admin.from('leagues').select('contact_email').eq('slug', m.topic).maybeSingle();
  const to = league?.contact_email ?? BOARD_INBOX;
  await sendOne({
    to: [to], reply_to: m.email, subject: `Website message: ${m.topic} — ${m.name}`,
    html: layout('New message from the website', `<p><strong>${esc(m.name)}</strong> &lt;${esc(m.email)}&gt;<br>Topic: ${esc(m.topic)}</p>${paragraphs(m.message)}<p style="font-size:14px;color:#5b6573">Reply to this email to answer ${esc(m.name)} directly.</p>`),
  });
  await admin.from('contact_messages').update({ notified_at: new Date().toISOString() }).eq('id', id);
  return json({ ok: true });
}

async function broadcast(req: Request, body: Record<string, string>) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ ok: false, error: 'Sign in required' }, 401);
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return json({ ok: false, error: 'Admins only' }, 403);
  if (!body.subject?.trim() || !body.body?.trim()) return json({ ok: false, error: 'Subject and message are required' }, 400);

  let emails: string[] = [];
  if (body.audience === 'test') emails = [user.email!];
  else {
    let q = admin.from('registrations').select('email').neq('status', 'withdrawn');
    if (body.audience === 'season') q = q.eq('season_id', body.season_id);
    const { data } = await q;
    emails = [...new Set((data ?? []).map((r: { email: string }) => r.email.toLowerCase()))];
  }
  if (!emails.length) return json({ ok: false, error: 'No recipients for that audience' }, 400);

  const html = layout(body.subject, paragraphs(body.body));
  const ids = await sendMany(emails.map((e) => ({ to: [e], subject: body.subject, html, text: body.body, reply_to: BOARD_INBOX })));
  await admin.from('email_log').insert({ sent_by: user.id, audience: body.audience === 'season' ? `season:${body.season_id}` : body.audience, subject: body.subject, recipient_count: emails.length, resend_ids: ids });
  return json({ ok: true, recipients: emails.length });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
  try {
    const body = await req.json();
    switch (body?.type) {
      case 'registration_confirmation': return await registrationConfirmation(body.registration_id);
      case 'contact_notification': return await contactNotification(body.message_id);
      case 'broadcast': return await broadcast(req, body);
      default: return json({ ok: false, error: 'Unknown type' }, 400);
    }
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
