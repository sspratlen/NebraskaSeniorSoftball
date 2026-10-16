import { html } from '../lib/html.js';
import { icon, pageHead } from '../lib/ui.js';
import { getBoard, getFields } from '../lib/data.js';

export default async function about() {
  const [board, fields] = await Promise.all([getBoard(), getFields()]);
  return html`
    ${pageHead('About NSS', 'Fun, fitness and fellowship for senior softball players across the Omaha metro.', 'Who we are')}
    <section class="section"><div class="wrap two-col wide-left">
      <div class="prose">
        <h2>Our mission</h2>
        <p>The goal of Nebraska Senior Softball is to promote softball for seniors; improve physical, mental and spiritual wellness; develop new friendships and renew old acquaintances. We serve active players 50 and over in Omaha and other communities in Nebraska and Iowa.</p>
        <p>We encourage a competitive spirit combined with respect for other players, fans and umpires.</p>
        <h2>What your registration covers</h2>
        <ul>
          <li>Field rental and umpires</li>
          <li>Softballs and safety equipment</li>
          <li>Uniforms (hat and jersey)</li>
          <li>Liability insurance</li>
          <li>League administration</li>
        </ul>
        <h2>Awards &amp; events</h2>
        <p>Each year we celebrate at the NSS Awards and Recognition Banquet, where Summer and Fall champions receive team awards and players are honored with the Spirit Award and Manager of the Year. The league also hosts an annual golf outing.</p>
      </div>
      <aside>
        ${fields.map((f) => html`<div class="card">
          <h3>${icon('pin')} ${f.name}</h3>
          <p>${f.address}</p>
          <a class="link-arrow" href="${f.map_url}" target="_blank" rel="noopener">Directions ${icon('arrow')}</a>
        </div>`)}
        <div class="card">
          <h3>${icon('users')} Board meetings</h3>
          <p>Second Tuesday of each month, 6:00 PM at Sean O'Casey's in Omaha. Anyone can attend.</p>
        </div>
      </aside>
    </div></section>

    <section class="section alt" id="board"><div class="wrap">
      <div class="section-head"><h2>Board of Directors</h2></div>
      <div class="board-grid">
        ${board.map((b) => html`<div class="board-card">
          <span class="role">${b.role}</span>
          ${b.name ? html`<strong>${b.name}</strong>` : html`<span class="tba">To be announced</span>`}
          ${b.email ? html`<a href="mailto:${b.email}">${icon('mail')} ${b.email}</a>` : ''}
        </div>`)}
      </div>
      <p class="muted">Board elections are held each summer. Send nominations to <a href="mailto:board_of_directors@neseniorsoftball.com">board_of_directors@neseniorsoftball.com</a>.</p>
    </div></section>`;
}
