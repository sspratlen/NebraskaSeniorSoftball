import { html } from '../lib/html.js';
import { icon } from '../lib/ui.js';
import { getLeagues, getEvents, getPosts, getSponsors, getSeasons } from '../lib/data.js';
import { fmtDate, todayISO, parseDate } from '../lib/format.js';

export default async function home() {
  const today = todayISO();
  const [leagues, events, posts, sponsors, seasons] = await Promise.all([
    getLeagues(), getEvents({ from: today }), getPosts(4), getSponsors(), getSeasons(),
  ]);
  const upcoming = events.slice(0, 5);
  const current = seasons.filter((s) => s.is_current);

  return html`
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <p class="eyebrow light">Omaha metro · Ages 50+</p>
          <h1>Nebraska's home for senior slow pitch softball.</h1>
          <p class="lede light">Three leagues, one community. We promote softball for seniors, improve physical, mental and spiritual wellness, build new friendships and renew old acquaintances.</p>
          <div class="hero-cta">
            <a class="btn btn-accent btn-lg" href="#/register">Register to play ${icon('arrow')}</a>
            <a class="btn btn-ghost btn-lg" href="#/leagues">Find your league</a>
          </div>
          <ul class="hero-facts">
            <li>${icon('users')} Men &amp; women 50+ by Dec 31</li>
            <li>${icon('pin')} LaVista Sports Complex</li>
            <li>${icon('calendar')} April – October</li>
          </ul>
        </div>
        <div class="hero-card" aria-hidden="true">
          <div class="art art-ballpark diamond">
            <span class="base b1"></span><span class="base b2"></span><span class="base b3"></span><span class="base home"></span>
            <span class="mound"></span>
          </div>
          <div class="art art-scoreboard">
            <div class="lineup-head"><span>NSS</span><span class="led-green">● LIVE</span></div>
            <table class="linescore">
              <tr><th></th>${[1, 2, 3, 4, 5, 6, 7].map((n) => html`<th>${n}</th>`)}<th>R</th></tr>
              <tr><td>FUN</td><td>2</td><td>0</td><td>3</td><td>1</td><td>0</td><td>4</td><td>1</td><td class="runs">11</td></tr>
              <tr><td>FIT</td><td>1</td><td>2</td><td>0</td><td>2</td><td>3</td><td>0</td><td>2</td><td class="runs">10</td></tr>
            </table>
            <div class="count"><span>BALL <b>●●○</b></span><span>STRIKE <b>●○</b></span><span>OUT <b>●●</b></span></div>
          </div>
          <div class="art art-varsity">
            <div class="patch"><span>N</span></div>
            <div class="patch-sub">Senior Softball · Est. Omaha</div>
          </div>
          <div class="art art-cards">
            <div class="tcard">
              <div class="tcard-photo"><span class="tcard-ball"></span></div>
              <div class="tcard-band"><strong>NSS ALL-STAR</strong><span>Utility · 50+</span></div>
              <div class="tcard-pennant">NEBRASKA</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head"><h2>Our leagues</h2><a href="#/leagues" class="link-arrow">All leagues ${icon('arrow')}</a></div>
        <div class="league-grid">
          ${leagues.map((l) => {
            const season = current.find((s) => s.league_id === l.id);
            return html`
            <a class="league-card" href="#/leagues/${l.slug}" style="--accent:${l.accent}">
              <span class="league-day">${l.play_days}</span>
              <h3>${l.name}</h3>
              <p>${l.summary}</p>
              <span class="league-meta">${season ? html`<span class="pill">${season.name}</span>` : ''} ${l.start_time ? html`<span>${icon('clock')} ${l.start_time}</span>` : ''}</span>
            </a>`;
          })}
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="wrap two-col">
        <div>
          <div class="section-head"><h2>Coming up</h2><a href="#/calendar" class="link-arrow">Full calendar ${icon('arrow')}</a></div>
          ${upcoming.length ? html`<ul class="event-list">
            ${upcoming.map((e) => html`
              <li class="event cat-${e.category}">
                <div class="date-chip"><span>${parseDate(e.starts_on).toLocaleDateString('en-US', { month: 'short' })}</span><strong>${parseDate(e.starts_on).getDate()}</strong></div>
                <div><h4>${e.title}</h4><p class="muted">${fmtDate(e.starts_on, { weekday: 'long' })}${e.start_time ? html` · ${e.start_time}` : ''}${e.location ? html` · ${e.location}` : ''}</p></div>
              </li>`)}
          </ul>` : html`<p class="muted">No upcoming events posted yet.</p>`}
        </div>
        <div>
          <div class="section-head"><h2>Latest news</h2><a href="#/news" class="link-arrow">All news ${icon('arrow')}</a></div>
          <div class="news-stack">
            ${posts.map((p) => html`
              <a class="news-card" href="#/news/${p.slug}">
                ${p.pinned ? html`<span class="pill pill-accent">Pinned</span>` : ''}
                <h4>${p.title}</h4>
                <p>${p.excerpt}</p>
                <span class="muted small">${fmtDate(p.published_at, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </a>`)}
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap promo-grid">
        <div class="promo">
          <h3>${icon('tag')} Save on hotels, support the league</h3>
          <p>Book any Choice hotel with NSS discount code <strong class="code">00228550</strong>. You save, and the league gets money back to help keep fees down.</p>
          <a class="link-arrow" href="https://www.choicehotels.com" target="_blank" rel="noopener">choicehotels.com ${icon('arrow')}</a>
        </div>
        <div class="promo">
          <h3>${icon('users')} Board meetings are open to everyone</h3>
          <p>Second Tuesday of each month at 6:00 PM at Sean O'Casey's in Omaha. Come hear what's happening and share your ideas.</p>
          <a class="link-arrow" href="#/about">Meet the board ${icon('arrow')}</a>
        </div>
      </div>
    </section>

    <section class="section sponsors-band">
      <div class="wrap">
        <p class="eyebrow center">Thank you to our partners</p>
        <div class="sponsor-strip">
          ${sponsors.map((s) => html`<a href="#/sponsors" class="sponsor-chip">${s.name}</a>`)}
        </div>
      </div>
    </section>`;
}
