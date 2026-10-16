-- Seed data gathered from the legacy neseniorsoftball.com site (Oct 2026).
-- Items marked "confirm" in notes came from older pages and should be verified by the board.

insert into public.fields (name, complex, address, map_url, sort) values
  ('LaVista Sports Complex', 'LaVista Sports Complex',
   '7346 S 66th St, La Vista, NE 68128 (about 2 blocks south of 66th & Harrison)',
   'https://maps.google.com/?q=7346+S+66th+St,+La+Vista,+NE+68128', 1);

insert into public.leagues (slug, name, short_name, play_days, start_time, summary, description, contact_email, accent, sort) values
  ('mon-wed', 'Monday/Wednesday Night League', 'Mon/Wed Nights', 'Monday & Wednesday evenings', 'Evenings',
   'Our flagship evening league with a Summer season (April–July) and a Fall season (August–October). Teams are built through a manager draft.',
   'Regular season games are played Monday and Wednesday evenings at the LaVista Sports Complex. Summer seasons begin in April and Fall seasons begin in August. Every new and returning player is selected by the team managers in a draft held the week before the first game. For 48 hours after the draft, managers may trade up to three newly drafted players with managers who agree. Players who register after the deadline become pool players and fill openings as the Director of Player Personnel assigns them.',
   'info@neseniorsoftball.com', '#c8102e', 1),
  ('tuesday', 'Tuesday Morning League', 'Tuesday Mornings', 'Tuesday mornings', 'Mornings',
   'Daytime senior slow pitch for men and women 50+ who would rather play in the morning.',
   'The Tuesday Morning League offers senior slow pitch softball for men and women who are 50 or older by December 31 of the current year. Games are played at the LaVista Sports Complex.',
   'TML@neseniorsoftball.com', '#0b6e4f', 2),
  ('friday', 'Friday Morning League', 'Friday Mornings', 'Friday mornings', '9:00 AM',
   'Friday morning games at 9:00 AM from April through October. Teams are balanced by the board and re-drafted at mid-season.',
   'Regular season games are played Friday mornings starting at 9:00 AM at the LaVista Sports Complex. The playing season begins in April and ends in October. The board assesses skill to keep teams balanced — no pre-selected teams are accepted — and teams are re-drafted halfway through the season. Please honestly assess your physical ability before registering.',
   'FML@neseniorsoftball.com', '#1f4e9c', 3);

-- Seasons
insert into public.seasons (league_id, name, year, term, starts_on, ends_on, reg_opens, reg_closes, late_reg_closes, fee_cents, late_fee_cents, is_current, notes)
select id, 'Summer 2026', 2026, 'summer', '2026-04-13', '2026-07-15', '2026-02-15', '2026-03-13', '2026-03-20', 14500, 29000, false,
  'Fee shown is the 2025 rate ($145); late registration doubles the fee for returning players. Pool registration opened March 21. Confirm 2026 fee.'
from public.leagues where slug = 'mon-wed';

insert into public.seasons (league_id, name, year, term, starts_on, ends_on, fee_cents, is_current, notes)
select id, 'Fall 2026', 2026, 'fall', '2026-08-03', '2026-10-21', 14500, true,
  'Regular registration is closed; new registrants are entered as pool players. Exact Fall dates to be confirmed by the Director of Scheduling.'
from public.leagues where slug = 'mon-wed';

insert into public.seasons (league_id, name, year, term, starts_on, ends_on, is_current, notes)
select id, '2026 Season', 2026, 'full', '2026-04-07', '2026-10-27', true, 'Season dates to be confirmed.'
from public.leagues where slug = 'tuesday';

insert into public.seasons (league_id, name, year, term, starts_on, ends_on, is_current, notes)
select id, '2026 Season', 2026, 'full', '2026-04-10', '2026-10-30', true,
  'Games at 9:00 AM. Teams re-drafted at mid-season. Season dates to be confirmed.'
from public.leagues where slug = 'friday';

-- Board of Directors
insert into public.board_members (role, name, email, sort) values
  ('Commissioner', 'Mike Marlow', 'commissioner@neseniorsoftball.com', 1),
  ('Director of Field Operations', null, null, 2),
  ('Director of Finance', null, 'director_finance@neseniorsoftball.com', 3),
  ('Director of Marketing, Publicity & Communications', null, null, 4),
  ('Director of Player Personnel', null, null, 5),
  ('Director of Purchasing & Inventory', null, null, 6),
  ('Director of Rules & Umpires', null, null, 7),
  ('Director of Scheduling', null, null, 8);

-- Sponsors / partners
insert into public.sponsors (name, category, blurb, url, promo_code, sort) values
  ('MDWest One', 'medical', 'Medical partner of Nebraska Senior Softball for all your orthopedic needs.', null, null, 1),
  ('Makovicka Physical Therapy', 'medical', 'Medical partner of Nebraska Senior Softball for all your physical therapy needs.', null, null, 2),
  ('Choice Hotels', 'hotel', 'Reserve a room at any Choice hotel with the NSS discount code. You get a discounted rate and money comes back to the league to help keep costs down.', 'https://www.choicehotels.com', '00228550', 3),
  ('Evans Custom Apparel', 'apparel', 'Official uniform supplier of NSS. Many tournament teams use Evans for their uniforms too. Omaha''s source for screen printing, embroidery and promotional products.', 'https://evansapparel.com', null, 4),
  ('Seasonal Solutions', 'corporate', 'Our newest sponsor — for all your seasonal lighting needs.', null, null, 5),
  ('ACE Welding and Repairing', 'corporate', null, null, null, 6),
  ('LaVista Keno', 'corporate', null, null, null, 7),
  ('Bauer Built Tire', 'corporate', null, null, null, 8),
  ('DLR Group', 'corporate', null, null, null, 9);

-- Calendar of events (from the legacy calendar, last updated 25 Dec 2025)
with mw as (select id from public.leagues where slug = 'mon-wed')
insert into public.events (league_id, title, starts_on, ends_on, start_time, location, category, description)
select (select id from mw), t.title, t.s::date, t.e::date, t.tm, t.loc, t.cat, t.descr from (values
  ('Summer regular registration opens', '2026-02-15', null, null, null, 'registration', 'Register online for the Summer 2026 Monday/Wednesday season.'),
  ('Summer regular registration closes', '2026-03-13', null, null, null, 'registration', null),
  ('Summer late registration', '2026-03-14', '2026-03-20', null, null, 'registration', 'Fees are doubled for returning players during late registration.'),
  ('Summer pool registration opens', '2026-03-21', null, null, null, 'registration', 'Players registering now are entered as pool players.'),
  ('Open practice (returning players)', '2026-04-06', null, null, 'LaVista Sports Complex', 'game', null),
  ('Open practice (returning players)', '2026-04-08', null, null, 'LaVista Sports Complex', 'game', null),
  ('Draft night', '2026-04-09', null, null, null, 'general', 'Managers draft new and returning players.'),
  ('Opening day — Summer 2026', '2026-04-13', null, null, 'LaVista Sports Complex', 'game', null),
  ('Weather makeup date', '2026-05-20', null, null, 'LaVista Sports Complex', 'weather', 'If not needed for makeups, the last regular-season game moves to this date.'),
  ('No games — Memorial Day', '2026-05-25', null, null, null, 'no-games', null),
  ('No games — fields reserved by La Vista', '2026-06-17', null, null, null, 'no-games', null),
  ('No games — fields reserved by La Vista', '2026-06-22', null, null, null, 'no-games', null),
  ('No games — fields reserved by La Vista', '2026-06-24', null, null, null, 'no-games', null),
  ('End of Summer regular season', '2026-07-08', null, null, null, 'game', null),
  ('Weather makeup date', '2026-07-13', null, null, 'LaVista Sports Complex', 'weather', null),
  ('League Championship Game', '2026-07-15', null, null, 'LaVista Sports Complex', 'game', 'Summer 2026 championship.'),
  ('Board election voting', '2026-08-07', '2026-08-29', null, null, 'general', 'Online voting; each player receives a unique link by email.')
) as t(title, s, e, tm, loc, cat, descr);

-- Monthly board meetings: second Tuesday, 6:00 PM, Sean O'Casey's (Omaha). Open to all.
insert into public.events (title, starts_on, start_time, location, category, description)
select 'NSS Board Meeting', d::date, '6:00 PM', 'Sean O''Casey''s, Omaha', 'board',
       'Monthly board meeting. Anyone is welcome to attend.'
from (
  select (date_trunc('month', m) + ((9 - extract(dow from date_trunc('month', m))::int) % 7 + 7) * interval '1 day') as d
  from generate_series('2026-01-01'::date, '2027-12-01'::date, interval '1 month') m
) x;

-- News / announcements
insert into public.posts (slug, title, excerpt, body, pinned, published_at) values
  ('welcome-to-the-new-site', 'Welcome to the new NSS website',
   'A brand-new home for all three Nebraska Senior Softball leagues — schedules, standings, registration and news in one place.',
   E'We have moved to a brand-new website built to run all of our leagues — Monday/Wednesday nights, Tuesday mornings and Friday mornings — from one place.\n\nWhat''s here today:\n- League pages with schedules, standings and teams\n- A season calendar with registration deadlines, board meetings and no-game dates\n- Online registration\n- Board of Directors and contact information\n- Our sponsors and member discounts\n\nMore is on the way, including player accounts, manager score entry and email updates. If something from the old site is missing, please let us know through the Contact page.',
   true, '2026-10-16 08:00:00-05'),
  ('fall-2026-late-registration', 'Fall 2026 late registration — pool players',
   'Regular Fall 2026 registration has closed. New registrants are entered as pool players.',
   E'Regular registration for the Fall 2026 Monday/Wednesday season has closed. Anyone registering now is entered as a pool player.\n\nPool players are evaluated and are not assigned to a team right away. When a team needs a substitute or has an opening, the Director of Player Personnel assigns pool players at or below the needed draft round.\n\nQuestions about the late registration fee can go to the Director of Finance at director_finance@neseniorsoftball.com.',
   false, '2026-07-25 08:00:00-05'),
  ('board-elections', 'NSS Board elections',
   'Nominations go to the board; online voting runs August 7–29 with a unique link for each player.',
   E'Each summer NSS elects directors to the Board. Nominations can be sent to board_of_directors@neseniorsoftball.com.\n\nOnline voting starts August 7 and closes August 29. Every registered player receives a unique voting link by email.',
   false, '2026-07-01 08:00:00-05'),
  ('annual-awards', 'Annual awards and the banquet',
   'Season champions, Manager of the Year and the Spirit Award are presented at the NSS Awards and Recognition Banquet.',
   E'The NSS Awards and Recognition Banquet is our annual celebration where the Summer and Fall season champions receive their team awards, along with individual honors such as the Spirit Award and Manager of the Year.\n\n**Manager of the Year** honors the leader of one of our teams for contributions made to their squad during the season. It is not necessarily the manager with the best win/loss record — it recognizes the manager who gets the most from their players through game readiness, communication and leadership.\n\nPlayers vote online for the annual awards each fall. Watch your email for the voting link. This year''s banquet date and location will be posted on the calendar.',
   false, '2026-09-15 08:00:00-05'),
  ('store-and-uniforms', 'Store: uniforms and the Trading Post',
   'NSS uses Evans Custom Apparel for all uniform needs. The Trading Post lets members buy, sell and trade equipment.',
   E'NSS uses Evans Custom Apparel (ECA) for all of our uniform needs, and many tournament teams use ECA for theirs as well.\n\nThe Trading Post is a place for members to buy, sell or trade softball equipment.',
   false, '2026-03-01 08:00:00-05'),
  ('choice-hotels-discount', 'Save on hotels and help the league',
   'Use NSS discount code 00228550 at any Choice hotel.',
   E'Traveling to a tournament? Reserve a room at any Choice hotel (choicehotels.com) and use the NSS discount code **00228550**. You get a discounted room rate, and money comes back to the league to help keep costs down.',
   false, '2026-02-01 08:00:00-05');
