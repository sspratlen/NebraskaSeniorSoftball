# Nebraska Senior Softball — Product Backlog

Goal: replace neseniorsoftball.com with one modern site that runs all NSS leagues (Monday/Wednesday Nights,
Tuesday Mornings, Friday Mornings): registration, payments, drafts, schedules, scores, standings, communications
and board administration.

**Stack:** Vite static site · Supabase (Postgres/Auth/Edge Functions/Storage) · Resend · GitHub Pages → Cloudflare Pages

**Status key:** ✅ done · 🟡 partial · ⬜ not started  **Priority:** P0 launch blocker · P1 needed for first season · P2 soon after · P3 nice to have

---

## Phase overview

| Phase | Theme | Outcome |
| --- | --- | --- |
| **1 — Foundation** (this round) | Public site + data model | New site live on GitHub Pages with all content from the old site, online registration, contact form, admin basics |
| **2 — Launch readiness** | Real data + email + payments | Board confirms content, schedules/teams loaded, Resend live, online payments, DNS cutover plan |
| **3 — Run the season** | Operations | Draft tools, score entry by managers, rainouts, rosters, player accounts |
| **4 — Cloudflare & growth** | Platform + engagement | Move to Cloudflare Pages, stats, awards voting, elections, store/trading post |

---

## Epic 1 — Foundation & infrastructure

| ID | Item | Pri | Status |
| --- | --- | --- | --- |
| F-01 | Vite static site scaffold, hash router, design system (large type, high contrast, light/dark) | P0 | ✅ |
| F-02 | Supabase schema: leagues, seasons, teams, games, fields, players, roster, registrations, events, posts, board, sponsors, contact, email log, profiles | P0 | ✅ |
| F-03 | Row Level Security on every table; public read for league content, insert-only for forms, admin-all | P0 | ✅ |
| F-04 | `standings` view computed from final games; `team_roster()` name-only roster function | P0 | ✅ |
| F-05 | GitHub Actions → GitHub Pages deploy workflow | P0 | ✅ |
| F-06 | Enable GitHub Pages (Settings → Pages → GitHub Actions) and merge to `main` | P0 | ⬜ |
| F-07 | Supabase Auth URL config: add Pages URL (and later production domain) to Site URL/Redirect URLs | P0 | ⬜ |
| F-08 | Supabase security advisor clean-up (trigger fn locked down, citext moved out of `public`) | P1 | ✅ |
| F-09 | Lint/format (ESLint + Prettier) and a CI check on PRs | P2 | ⬜ |
| F-10 | Playwright smoke tests (each page renders, register + contact submit) in CI | P2 | ⬜ |
| F-11 | Error monitoring (Sentry or Cloudflare analytics) | P3 | ⬜ |
| F-12 | Supabase TypeScript types generation + move to TS | P3 | ⬜ |
| F-13 | Daily database backup export (PITR or scheduled `pg_dump` to storage) | P2 | ⬜ |

## Epic 2 — Content migration from neseniorsoftball.com

The old site was not directly reachable from the build environment; content was rebuilt from search-index copies of
its pages. Items below need board confirmation or files from the old WordPress install.

| ID | Item | Pri | Status |
| --- | --- | --- | --- |
| C-01 | Leagues (3) with days, times, descriptions, inboxes (info@, TML@, FML@) | P0 | ✅ |
| C-02 | 2026 seasons (Mon/Wed Summer + Fall, Tuesday, Friday) | P0 | 🟡 confirm Tue/Fri/Fall dates & fees |
| C-03 | 2026 calendar: registration windows, open practice, draft night, opening day, no-game dates, makeups, championship, board meetings (2nd Tuesday, Sean O'Casey's) through 2027 | P0 | ✅ |
| C-04 | Board of Directors roles; Commissioner (Mike Marlow) + finance/board inboxes | P0 | 🟡 need current names/emails for all 8 roles |
| C-05 | Sponsors: MDWest One, Makovicka PT, Choice Hotels (code 00228550), Evans Custom Apparel, Seasonal Solutions, ACE Welding, LaVista Keno, Bauer Built Tire, DLR Group | P0 | 🟡 need logos + website links |
| C-06 | Rules summary page (eligibility, safety rules, pitching arc, HR limit, draft/pool) | P0 | 🟡 based on 2021 rule book — confirm current |
| C-07 | Upload current official Rule Book PDF to Supabase Storage and link it | P0 | ⬜ |
| C-08 | News posts migrated (welcome, Fall late reg, elections, awards, store, hotel discount) | P1 | ✅ |
| C-09 | Export old WordPress (Tools → Export) + `wp-content/uploads` so remaining pages/PDFs/photos can be imported | P1 | ⬜ |
| C-10 | Past teams, rosters, schedules and standings (2024–2026) imported from old site/spreadsheets | P1 | ⬜ |
| C-11 | Past champions / award winners history page (Manager of the Year, Spirit Award, season champs) | P2 | ⬜ |
| C-12 | Weather procedures page (old `/weather-procedures/`) | P1 | ⬜ |
| C-13 | Replacement player values / draft round equivalency table | P2 | ⬜ |
| C-14 | Golf tournament page (annual outing at Tara Hills) | P3 | ⬜ |
| C-15 | Links of interest (SSUSA, La Vista Sports Complex, Facebook, YouTube) | P3 | ⬜ |
| C-16 | Photo gallery (Supabase Storage) | P3 | ⬜ |
| C-17 | Legal review of the registration waiver text (drafted placeholder) | P0 | ⬜ |
| C-18 | Real logo / brand assets (replace placeholder softball mark) | P1 | ⬜ |

## Epic 3 — Public site

| ID | Item | Pri | Status |
| --- | --- | --- | --- |
| P-01 | Home: hero, league cards, upcoming events, news, promos, sponsor strip | P0 | ✅ |
| P-02 | League pages with Overview / Schedule / Standings / Teams tabs and season picker | P0 | ✅ |
| P-03 | Calendar with league/type filters, past toggle, "Add to my calendar" (.ics download) | P0 | ✅ |
| P-04 | News list + article pages (safe markdown) | P0 | ✅ |
| P-05 | Rules, About (mission, board, field, meetings), Sponsors, Contact pages | P0 | ✅ |
| P-06 | Subscribable live iCal feed per league/team (Edge Function) instead of one-time download | P1 | ⬜ |
| P-07 | "Today" banner: game-day status (on / rained out) set by admins | P1 | ⬜ |
| P-08 | Team pages with schedule + roster + results | P2 | ⬜ |
| P-09 | Printable schedule view (old "how to print your team schedule") | P2 | ⬜ |
| P-10 | SEO: per-page meta, sitemap, Open Graph images; consider pre-rendering on Cloudflare | P2 | ⬜ |
| P-11 | Accessibility audit (WCAG 2.2 AA), font-size toggle for older eyes | P1 | ⬜ |
| P-12 | PWA: installable app icon + offline schedule | P3 | ⬜ |
| P-13 | Field map / directions page with field numbers at LaVista Sports Complex | P3 | ⬜ |

## Epic 4 — Registration & payments

| ID | Item | Pri | Status |
| --- | --- | --- | --- |
| R-01 | Online registration form (league/season, contact, birth year 50+ check, positions, shirt size, emergency contact, waiver) | P0 | ✅ |
| R-02 | Registration window logic (open / late / pool) from season dates | P0 | ✅ |
| R-03 | Online payment via Stripe Checkout (Edge Function + webhook marks `paid`) | P1 | ⬜ |
| R-04 | Late fee automation (doubled for returning players in late window) | P1 | ⬜ |
| R-05 | Duplicate registration detection (same email + season) | P1 | ⬜ |
| R-06 | Link registrations → `players` record (dedupe across seasons) | P1 | ⬜ |
| R-07 | Proof-of-age verification checkbox for board (new players) | P2 | ⬜ |
| R-08 | Returning-player quick re-register (prefill from last season when signed in) | P2 | ⬜ |
| R-09 | Refund / withdrawal workflow | P3 | ⬜ |
| R-10 | Paper registration entry by admins (for players without email) | P2 | ⬜ |

## Epic 5 — Email & communications (Resend)

| ID | Item | Pri | Status |
| --- | --- | --- | --- |
| E-01 | `send-email` Edge Function (Resend) deployed | P0 | ✅ |
| E-02 | Registration confirmation email | P0 | ✅ (needs secrets) |
| E-03 | Contact form → routed to the right league inbox, reply-to the sender | P0 | ✅ (needs secrets) |
| E-04 | Admin broadcast: test / one season / everyone, logged to `email_log` | P0 | ✅ (needs secrets) |
| E-05 | Set Supabase secrets: `RESEND_API_KEY`, `EMAIL_FROM`, `BOARD_INBOX`, `SITE_URL` | P0 | ⬜ |
| E-06 | Verify neseniorsoftball.com domain in Resend (SPF/DKIM/DMARC DNS records) | P0 | ⬜ |
| E-07 | Route Supabase Auth emails (magic links) through Resend SMTP | P1 | ⬜ |
| E-08 | Broadcast audiences: by team, managers only, pool players, unpaid registrants | P1 | ⬜ |
| E-09 | Payment reminder emails before deadline (scheduled Edge Function / pg_cron) | P2 | ⬜ |
| E-10 | Rainout / game-day alerts (email; SMS via Twilio later) | P1 | ⬜ |
| E-11 | Unsubscribe link + preferences (CAN-SPAM) | P1 | ⬜ |
| E-12 | Rate limiting + Turnstile CAPTCHA on public forms | P1 | ⬜ |
| E-13 | Weekly digest (upcoming games, results, news) | P3 | ⬜ |

## Epic 6 — Accounts & roles

| ID | Item | Pri | Status |
| --- | --- | --- | --- |
| A-01 | Passwordless email sign-in (magic link), profile page, "my registrations" | P0 | ✅ |
| A-02 | Roles: member / manager / admin with RLS | P0 | 🟡 manager role defined, no manager permissions yet |
| A-03 | Admin user management page (promote/demote) instead of SQL | P1 | ⬜ |
| A-04 | Board-role permissions (e.g., Finance sees payments, Scheduling edits games) | P2 | ⬜ |
| A-05 | Player profile: link account to `players` row, update contact info | P2 | ⬜ |

## Epic 7 — League operations (admin)

| ID | Item | Pri | Status |
| --- | --- | --- | --- |
| O-01 | Admin dashboard: registrations list with status, CSV export | P0 | ✅ |
| O-02 | Admin: contact message inbox with handled flag | P0 | ✅ |
| O-03 | Admin: score entry → standings update | P0 | ✅ |
| O-04 | Admin: publish news posts | P0 | ✅ |
| O-05 | Admin CRUD: seasons, teams, events, board, sponsors (currently via Supabase dashboard) | P1 | ⬜ |
| O-06 | Schedule builder: generate round-robin for N teams across Mon/Wed slots & fields, skip no-game dates | P1 | ⬜ |
| O-07 | Schedule import from CSV/Excel | P1 | ⬜ |
| O-08 | Draft night tool: player pool with draft rounds, live pick board, 48-hour trade window | P1 | ⬜ |
| O-09 | Pool player management: round equivalency, assign as substitute | P1 | ⬜ |
| O-10 | Friday league mid-season re-draft support | P2 | ⬜ |
| O-11 | Rainout handling: bulk postpone a date, move games to makeup date, notify | P1 | ⬜ |
| O-12 | Manager portal: managers enter their own scores, lineups, sub requests | P2 | ⬜ |
| O-13 | Playoffs / championship bracket | P2 | ⬜ |
| O-14 | Umpire assignments & payments | P3 | ⬜ |
| O-15 | Uniform/equipment inventory (Director of Purchasing & Inventory) | P3 | ⬜ |
| O-16 | Finance: season budget, fee collection report, sponsor revenue | P3 | ⬜ |

## Epic 8 — Engagement

| ID | Item | Pri | Status |
| --- | --- | --- | --- |
| G-01 | Annual awards voting (one vote per player, last vote counts) | P2 | ⬜ |
| G-02 | Board elections: nominations + secure one-time voting links (Aug 7–29) | P2 | ⬜ |
| G-03 | Banquet RSVP + payment | P3 | ⬜ |
| G-04 | Trading Post (buy/sell/trade equipment listings) | P3 | ⬜ |
| G-05 | Store page linking Evans Custom Apparel | P2 | ⬜ |
| G-06 | Player stats (optional per game) | P3 | ⬜ |
| G-07 | Sponsor management with logo upload + click tracking | P3 | ⬜ |

## Epic 9 — Cloudflare migration & cutover

| ID | Item | Pri | Status |
| --- | --- | --- | --- |
| X-01 | Cloudflare Pages project (build `npm run build`, output `dist`, `VITE_` env vars) | P2 | ⬜ |
| X-02 | Move `neseniorsoftball.com` DNS to Cloudflare; keep MX/email records intact | P2 | ⬜ |
| X-03 | Redirect map from old WordPress URLs (`/registration-information/`, `/calendar-of-events/`, `/rules/`, `/sponsors`, `/contact/` …) to new routes via `_redirects` | P1 | ⬜ |
| X-04 | Switch from hash routes to clean URLs (Cloudflare SPA fallback) | P3 | ⬜ |
| X-05 | Optional: move Edge Functions to Cloudflare Workers | P3 | ⬜ |
| X-06 | Decommission old WordPress host after archive export | P2 | ⬜ |

---

## Open questions for the board

1. Current names and emails for all eight board positions?
2. Confirmed 2026–2027 fees and dates for Tuesday and Friday leagues, and next Summer's Mon/Wed window?
3. Which payment processor should we use (Stripe, PayPal, or keep Venmo/check)?
4. Who should be site admins at launch?
5. Can we get a WordPress export + uploads folder from the current host?
6. Which email address should send league email (e.g. `noreply@` vs `info@`)?
