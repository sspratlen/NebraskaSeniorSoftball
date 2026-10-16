import { html } from '../lib/html.js';
import { icon, pageHead, empty } from '../lib/ui.js';
import { getEvents, getLeagues } from '../lib/data.js';
import { fmtDate, todayISO, monthKey, fmtMonth, parseDate } from '../lib/format.js';

const CATS = {
  registration: 'Registration', game: 'Games', board: 'Board meetings',
  'no-games': 'No games', weather: 'Weather makeup', social: 'Social', general: 'League',
};

export default async function calendar() {
  const [events, leagues] = await Promise.all([getEvents(), getLeagues()]);
  const state = { league: '', cat: '', past: false };

  const listHtml = () => {
    const today = todayISO();
    const list = events.filter((e) =>
      (state.past || (e.ends_on || e.starts_on) >= today) &&
      (!state.league || !e.league_id || e.league?.slug === state.league) &&
      (!state.cat || e.category === state.cat));
    if (!list.length) return empty('Nothing to show', 'Try a different filter or include past events.');
    const months = new Map();
    list.forEach((e) => { const k = monthKey(e.starts_on); months.set(k, [...(months.get(k) || []), e]); });
    return html`${[...months].map(([k, evs]) => html`
      <h2 class="month">${fmtMonth(k)}</h2>
      <ul class="event-list">${evs.map((e) => html`
        <li class="event cat-${e.category} ${(e.ends_on || e.starts_on) < today ? 'past' : ''}">
          <div class="date-chip"><span>${parseDate(e.starts_on).toLocaleDateString('en-US', { weekday: 'short' })}</span><strong>${parseDate(e.starts_on).getDate()}</strong></div>
          <div>
            <h4>${e.title}</h4>
            <p class="muted">
              ${e.ends_on ? html`${fmtDate(e.starts_on)} – ${fmtDate(e.ends_on)}` : fmtDate(e.starts_on, { weekday: 'long', month: 'long', day: 'numeric' })}
              ${e.start_time ? html` · ${e.start_time}` : ''}${e.location ? html` · ${e.location}` : ''}
            </p>
            ${e.description ? html`<p>${e.description}</p>` : ''}
          </div>
          <div class="event-tags">
            <span class="tag tag-${e.category}">${CATS[e.category] || e.category}</span>
            ${e.league ? html`<span class="tag" style="--accent:${e.league.accent}">${e.league.short_name}</span>` : ''}
          </div>
        </li>`)}
      </ul>`)}`;
  };

  return {
    html: html`
      ${pageHead('Calendar', 'Registration deadlines, opening day, no-game dates, board meetings and more.', 'Season calendar')}
      <section class="section"><div class="wrap">
        <div class="filters">
          <label>League <select id="f-league"><option value="">All leagues</option>${leagues.map((l) => html`<option value="${l.slug}">${l.short_name}</option>`)}</select></label>
          <label>Type <select id="f-cat"><option value="">Everything</option>${Object.entries(CATS).map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select></label>
          <label class="check"><input type="checkbox" id="f-past"> Show past events</label>
          <button class="btn btn-outline btn-sm" id="ics">${icon('calendar')} Add to my calendar</button>
        </div>
        <div id="cal-list">${listHtml()}</div>
      </div></section>`,
    mount(root) {
      const rerender = () => { root.querySelector('#cal-list').innerHTML = String(listHtml()); };
      root.querySelector('#f-league').addEventListener('change', (e) => { state.league = e.target.value; rerender(); });
      root.querySelector('#f-cat').addEventListener('change', (e) => { state.cat = e.target.value; rerender(); });
      root.querySelector('#f-past').addEventListener('change', (e) => { state.past = e.target.checked; rerender(); });
      root.querySelector('#ics').addEventListener('click', () => downloadIcs(events.filter((e) =>
        (!state.league || !e.league_id || e.league?.slug === state.league) && (!state.cat || e.category === state.cat))));
    },
  };
}

function downloadIcs(events) {
  const d = (s) => String(s).replace(/-/g, '');
  const next = (s) => { const x = parseDate(s); x.setDate(x.getDate() + 1); return x.toLocaleDateString('en-CA'); };
  const esc = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nebraska Senior Softball//EN', 'X-WR-CALNAME:Nebraska Senior Softball'];
  events.forEach((e) => lines.push('BEGIN:VEVENT', `UID:${e.id}@neseniorsoftball`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`,
    `DTSTART;VALUE=DATE:${d(e.starts_on)}`, `DTEND;VALUE=DATE:${d(next(e.ends_on || e.starts_on))}`,
    `SUMMARY:${esc(e.title)}${e.start_time ? esc(` (${e.start_time})`) : ''}`, `LOCATION:${esc(e.location)}`, `DESCRIPTION:${esc(e.description)}`, 'END:VEVENT'));
  lines.push('END:VCALENDAR');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  a.download = 'nss-calendar.ics';
  a.click();
}
