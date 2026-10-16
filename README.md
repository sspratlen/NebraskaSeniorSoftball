# Nebraska Senior Softball

The new website for Nebraska Senior Softball (NSS), replacing neseniorsoftball.com. One site runs all three leagues:
Monday/Wednesday Nights, Tuesday Mornings and Friday Mornings.

**Stack:** static Vite site (vanilla JS, no framework) · Supabase (Postgres, Auth, Edge Functions) · Resend (email) ·
GitHub Pages today, Cloudflare Pages later.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/
```

Supabase URL and publishable key default to the `NebraskaSeniorSoftball` project (see `src/lib/supabase.js`).
Override with `.env` (copy `.env.example`). The publishable key is safe in the browser; Row Level Security protects data.

## Project layout

```
index.html               app shell
src/main.js              routes
src/layout.js            header / footer
src/pages/*.js           one module per page (home, leagues, calendar, news, register, rules, about, sponsors, contact, account, admin)
src/lib/                 supabase client, data queries, router (hash-based), auth, html escaping, formatting
src/styles.css           design system (tokens at top; light + dark)
supabase/migrations/     database schema + seed data (applied to the live project)
supabase/functions/      Edge Functions (send-email → Resend)
BACKLOG.md               product backlog
```

Routing uses `#/path` URLs so deep links work on GitHub Pages with no server rewrites.

## Database (Supabase)

Tables: `leagues`, `seasons`, `teams`, `games`, `fields`, `players`, `roster`, `registrations`, `events`, `posts`,
`board_members`, `sponsors`, `contact_messages`, `email_log`, `profiles`. View: `standings` (computed from final games).

- Public can read league content (leagues, seasons, teams, games, standings, calendar, news, board, sponsors).
- Public can **insert** registrations and contact messages but cannot read them back.
- Player contact info is never public; `team_roster(team_id)` exposes names only.
- Admins (`profiles.role = 'admin'`) can do everything via the in-site Admin dashboard.

**Make someone an admin:** have them sign in once (My Account → email link), then run in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'person@example.com');
```

## Email (Resend)

All email goes through the `send-email` Edge Function so the Resend key never reaches the browser. It sends
registration confirmations, routes contact-form messages to the right league inbox, and lets admins email a season
or everyone. Set these secrets in Supabase → Edge Functions → Secrets:

| Secret | Value |
| --- | --- |
| `RESEND_API_KEY` | from resend.com → API Keys |
| `EMAIL_FROM` | `Nebraska Senior Softball <noreply@neseniorsoftball.com>` (verify the domain in Resend first) |
| `BOARD_INBOX` | `info@neseniorsoftball.com` |
| `SITE_URL` | the live site URL |

Until `RESEND_API_KEY` is set, forms still save to the database; the email step is skipped quietly.

For sign-in links to come from the league address too, set Supabase → Authentication → SMTP to Resend
(`smtp.resend.com`, port 465, user `resend`, password = API key).

## Deploy

**GitHub Pages (now):** Settings → Pages → Source: *GitHub Actions*. Every push to `main` builds and deploys via
`.github/workflows/deploy.yml`. Add the Pages URL to Supabase → Authentication → URL Configuration (Site URL + Redirect URLs).

**Cloudflare Pages (later):** connect the repo, build command `npm run build`, output `dist`, set the two `VITE_` vars,
point `neseniorsoftball.com` DNS at Cloudflare. No code changes needed (relative asset paths + hash routing).
