import { html } from '../lib/html.js';
import { icon, pageHead, empty } from '../lib/ui.js';
import { query } from '../lib/router.js';
import { getLeagues, getLeague, getSeasons, getTeams, getStandings, getGames, getRoster, getEvents, getFields } from '../lib/data.js';
import { fmtDate, fmtTime, fmtMoney, fmtLongDate, pct, todayISO, monthKey, fmtMonth } from '../lib/format.js';

export async function leaguesIndex() {
  const [leagues, seasons] = await Promise.all([getLeagues(), getSeasons()]);
  return html`
    ${pageHead('Leagues', 'Pick the league that fits your week. All games are played at the LaVista Sports Complex.', 'Play ball')}
    <section class="section"><div class="wrap league-grid big">
      ${leagues.map((l) => {
        const cur = seasons.find((s) => s.league_id === l.id && s.is_current);
        return html`
        <article class="league-card static" style="--accent:${l.accent}">
          <span class="league-day">${l.play_days}</span>
          <h2>${l.name}</h2>
          <p>${l.description}</p>
          <ul class="facts">
            ${l.start_time ? html`<li>${icon('clock')} ${l.start_time}</li>` : ''}
            ${cur ? html`<li>${icon('calendar')} ${cur.name}${cur.starts_on ? html` · ${fmtDate(cur.starts_on, { month: 'short', day: 'numeric' })} – ${fmtDate(cur.ends_on, { month: 'short', day: 'numeric' })}` : ''}</li>` : ''}
            ${l.contact_email ? html`<li>${icon('mail')} <a href="mailto:${l.contact_email}">${l.contact_email}</a></li>` : ''}
          </ul>
          <div class="card-actions">
            <a class="btn" href="#/leagues/${l.slug}">League home</a>
            <a class="btn btn-outline" href="#/leagues/${l.slug}/schedule">Schedule</a>
            <a class="btn btn-outline" href="#/leagues/${l.slug}/standings">Standings</a>
          </div>
        </article>`;
      })}
    </div></section>`;
}

const TABS = [
  ['overview', 'Overview'],
  ['schedule', 'Schedule'],
  ['standings', 'Standings'],
  ['teams', 'Teams'],
];

export async function leagueDetail({ slug, tab = 'overview' }) {
  const league = await getLeague(slug);
  if (!league) return html`<div class="wrap section">${empty('League not found')}</div>`;
  const seasons = await getSeasons(league.id);
  const q = query();
  const season = seasons.find((s) => s.id === q.get('season')) || seasons.find((s) => s.is_current) || seasons[0];
  const sq = season && q.get('season') ? `?season=${season.id}` : '';

  let body;
  if (!season) body = empty('No seasons yet', 'Season details will be posted soon.');
  else if (tab === 'schedule') body = await scheduleTab(season);
  else if (tab === 'standings') body = await standingsTab(season);
  else if (tab === 'teams') body = await teamsTab(season);
  else body = await overviewTab(league, season);

  return {
    html: html`
    <section class="page-head league-head" style="--accent:${league.accent}">
      <div class="wrap">
        <p class="eyebrow">${league.play_days}</p>
        <h1>${league.name}</h1>
        <div class="head-row">
          <nav class="tabs" aria-label="League sections">
            ${TABS.map(([k, label]) => html`<a href="#/leagues/${slug}/${k}${sq}" class="${tab === k ? 'active' : ''}" ${tab === k ? 'aria-current="page"' : ''}>${label}</a>`)}
          </nav>
          ${seasons.length > 1 ? html`<label class="season-pick">Season
            <select id="season-select">${seasons.map((s) => html`<option value="${s.id}" ${s.id === season.id ? 'selected' : ''}>${s.name}</option>`)}</select>
          </label>` : season ? html`<span class="pill">${season.name}</span>` : ''}
        </div>
      </div>
    </section>
    <section class="section"><div class="wrap">${body}</div></section>`,
    mount(root) {
      root.querySelector('#season-select')?.addEventListener('change', (e) => {
        location.hash = `#/leagues/${slug}/${tab}?season=${e.target.value}`;
      });
      root.querySelectorAll('[data-roster]').forEach((btn) => btn.addEventListener('click', async () => {
        const box = btn.closest('.team-card').querySelector('.roster');
        if (!box.hidden) { box.hidden = true; btn.textContent = 'Show roster'; return; }
        btn.textContent = 'Loading…';
        const players = await getRoster(btn.dataset.roster);
        box.innerHTML = String(players.length
          ? html`<ol>${players.map((p) => html`<li>${p.first_name} ${p.last_name}${p.is_manager ? html` <span class="pill">Manager</span>` : ''}</li>`)}</ol>`
          : html`<p class="muted">Roster not posted yet.</p>`);
        box.hidden = false;
        btn.textContent = 'Hide roster';
      }));
    },
  };
}

async function overviewTab(league, season) {
  const [events, fields] = await Promise.all([getEvents({ from: todayISO(), leagueId: league.id }), getFields()]);
  const field = fields[0];
  return html`
    <div class="two-col wide-left">
      <div class="prose">
        <h2>About this league</h2>
        <p>${league.description}</p>
        <h3>${season.name}</h3>
        <dl class="kv">
          ${season.starts_on ? html`<dt>Season</dt><dd>${fmtLongDate(season.starts_on)} – ${fmtLongDate(season.ends_on)}</dd>` : ''}
          ${season.reg_opens ? html`<dt>Registration</dt><dd>${fmtDate(season.reg_opens, { month: 'long', day: 'numeric' })} – ${fmtDate(season.reg_closes, { month: 'long', day: 'numeric' })}${season.late_reg_closes ? html` (late through ${fmtDate(season.late_reg_closes, { month: 'long', day: 'numeric' })})` : ''}</dd>` : ''}
          ${season.fee_cents ? html`<dt>Fee</dt><dd>${fmtMoney(season.fee_cents)}${season.late_fee_cents ? html` · late ${fmtMoney(season.late_fee_cents)}` : ''}</dd>` : ''}
          ${league.start_time ? html`<dt>Game time</dt><dd>${league.start_time}</dd>` : ''}
          ${league.contact_email ? html`<dt>Questions</dt><dd><a href="mailto:${league.contact_email}">${league.contact_email}</a></dd>` : ''}
        </dl>
        ${season.notes ? html`<p class="notice">${season.notes}</p>` : ''}
        <p><a class="btn btn-accent" href="#/register?league=${league.slug}">Register for ${league.short_name}</a></p>
      </div>
      <aside>
        ${field ? html`<div class="card">
          <h3>${icon('pin')} Where we play</h3>
          <p><strong>${field.name}</strong><br>${field.address}</p>
          <a class="link-arrow" href="${field.map_url}" target="_blank" rel="noopener">Open in Maps ${icon('arrow')}</a>
        </div>` : ''}
        <div class="card">
          <h3>${icon('calendar')} Upcoming</h3>
          ${events.length ? html`<ul class="mini-events">${events.slice(0, 6).map((e) => html`<li><strong>${fmtDate(e.starts_on)}</strong> ${e.title}</li>`)}</ul>` : html`<p class="muted">Nothing scheduled yet.</p>`}
          <a class="link-arrow" href="#/calendar">Full calendar ${icon('arrow')}</a>
        </div>
      </aside>
    </div>`;
}

async function scheduleTab(season) {
  const games = await getGames(season.id);
  if (!games.length) return empty('Schedule coming soon', `The ${season.name} schedule hasn't been published yet. Check back after the draft.`);
  const byMonth = new Map();
  games.forEach((g) => { const k = monthKey(g.game_date); byMonth.set(k, [...(byMonth.get(k) || []), g]); });
  const today = todayISO();
  return html`
    ${[...byMonth].map(([k, list]) => html`
      <h2 class="month">${fmtMonth(k)}</h2>
      <div class="table-wrap"><table class="table schedule">
        <thead><tr><th>Date</th><th>Time</th><th>Away</th><th></th><th>Home</th><th>Field</th><th>Status</th></tr></thead>
        <tbody>${list.map((g) => {
          const final = g.status === 'final' || g.status === 'forfeit';
          const awayWin = final && g.away_score > g.home_score;
          const homeWin = final && g.home_score > g.away_score;
          return html`<tr class="${g.game_date === today ? 'today' : ''}">
            <td>${fmtDate(g.game_date)}</td>
            <td>${fmtTime(g.start_time)}</td>
            <td class="${awayWin ? 'win' : ''}">${g.away?.name || 'TBD'}</td>
            <td class="score">${final ? `${g.away_score} – ${g.home_score}` : '@'}</td>
            <td class="${homeWin ? 'win' : ''}">${g.home?.name || 'TBD'}</td>
            <td>${g.field?.name || ''}</td>
            <td><span class="status s-${g.status}">${g.game_type !== 'regular' ? `${g.game_type} · ` : ''}${g.status}</span></td>
          </tr>`;
        })}</tbody>
      </table></div>`)}`;
}

async function standingsTab(season) {
  const rows = await getStandings(season.id);
  if (!rows.length) return empty('No standings yet', 'Standings appear once teams are drafted and games are played.');
  const divisions = [...new Set(rows.map((r) => r.division || ''))].sort();
  return html`${divisions.map((d) => {
    const list = rows.filter((r) => (r.division || '') === d)
      .sort((a, b) => (b.wins + b.ties / 2) - (a.wins + a.ties / 2) || a.losses - b.losses || (b.runs_for - b.runs_against) - (a.runs_for - a.runs_against));
    const lead = list[0];
    return html`
      ${d ? html`<h2 class="month">${d} Division</h2>` : ''}
      <div class="table-wrap"><table class="table standings">
        <thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>T</th><th>PCT</th><th>GB</th><th>RF</th><th>RA</th><th>DIFF</th></tr></thead>
        <tbody>${list.map((r, i) => {
          const gb = ((lead.wins - r.wins) + (r.losses - lead.losses)) / 2;
          const diff = r.runs_for - r.runs_against;
          return html`<tr><td>${i + 1}</td><td class="team">${r.name}${r.manager_name ? html`<small>${r.manager_name}</small>` : ''}</td>
            <td>${r.wins}</td><td>${r.losses}</td><td>${r.ties}</td><td>${pct(r.wins, r.losses, r.ties)}</td>
            <td>${i === 0 ? '—' : gb}</td><td>${r.runs_for}</td><td>${r.runs_against}</td>
            <td class="${diff > 0 ? 'pos' : diff < 0 ? 'neg' : ''}">${diff > 0 ? '+' : ''}${diff}</td></tr>`;
        })}</tbody>
      </table></div>`;
  })}`;
}

async function teamsTab(season) {
  const teams = await getTeams(season.id);
  if (!teams.length) return empty('Teams not posted yet', 'Teams are set at the draft the week before opening day.');
  return html`<div class="team-grid">${teams.map((t) => html`
    <article class="team-card" style="--team:${t.color || 'var(--navy)'}">
      <h3>${t.name}</h3>
      ${t.division ? html`<span class="pill">${t.division}</span>` : ''}
      ${t.manager_name ? html`<p>Manager: <strong>${t.manager_name}</strong></p>` : ''}
      ${t.sponsor ? html`<p class="muted">Sponsored by ${t.sponsor}</p>` : ''}
      <button class="btn btn-outline btn-sm" data-roster="${t.id}">Show roster</button>
      <div class="roster" hidden></div>
    </article>`)}</div>`;
}
