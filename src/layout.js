import { html } from './lib/html.js';
import { icon } from './lib/ui.js';
import { auth, isAdmin } from './lib/auth.js';

const NAV = [
  { href: '#/leagues', label: 'Leagues', match: '/leagues' },
  { href: '#/calendar', label: 'Calendar', match: '/calendar' },
  { href: '#/news', label: 'News', match: '/news' },
  { href: '#/rules', label: 'Rules', match: '/rules' },
  { href: '#/about', label: 'About', match: '/about' },
  { href: '#/sponsors', label: 'Sponsors', match: '/sponsors' },
  { href: '#/contact', label: 'Contact', match: '/contact' },
];

export function renderHeader(path) {
  const { session } = auth();
  const el = document.getElementById('site-header');
  el.innerHTML = html`
    <div class="wrap header-row">
      <a class="brand" href="#/" aria-label="Nebraska Senior Softball home">
        <img class="brand-mark" src="./favicon.svg" alt="" width="44" height="44">
        <span class="brand-text"><strong>Nebraska Senior Softball</strong><small>Fun · Fitness · Fellowship</small></span>
      </a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="Menu">${icon('menu')}</button>
      <nav id="primary-nav" class="primary-nav" aria-label="Primary">
        ${NAV.map((n) => html`<a href="${n.href}" class="${path.startsWith(n.match) ? 'active' : ''}">${n.label}</a>`)}
        ${isAdmin() ? html`<a href="#/admin" class="${path.startsWith('/admin') ? 'active' : ''}">Admin</a>` : ''}
        <a href="#/account" class="nav-account">${session ? 'My Account' : 'Sign in'}</a>
        <a href="#/register" class="btn btn-accent nav-cta">Register</a>
      </nav>
    </div>`;
  const toggle = el.querySelector('.nav-toggle');
  const nav = el.querySelector('#primary-nav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = String(icon(open ? 'close' : 'menu'));
  });
}

export function renderFooter() {
  document.getElementById('site-footer').innerHTML = html`
    <div class="wrap footer-grid">
      <div>
        <div class="brand brand-footer"><img class="brand-mark" src="./favicon.svg" alt="" width="44" height="44">
          <span class="brand-text"><strong>Nebraska Senior Softball</strong><small>Fun · Fitness · Fellowship</small></span></div>
        <p class="muted">Senior slow pitch softball for men and women 50+ in Omaha and surrounding Nebraska and Iowa communities.</p>
      </div>
      <div>
        <h4>Leagues</h4>
        <a href="#/leagues/mon-wed">Monday/Wednesday Nights</a>
        <a href="#/leagues/tuesday">Tuesday Mornings</a>
        <a href="#/leagues/friday">Friday Mornings</a>
      </div>
      <div>
        <h4>Get involved</h4>
        <a href="#/register">Register to play</a>
        <a href="#/calendar">Season calendar</a>
        <a href="#/about">Board of Directors</a>
        <a href="#/sponsors">Become a sponsor</a>
      </div>
      <div>
        <h4>Contact</h4>
        <p class="muted">Nebraska Senior Softball<br>P.O. Box 460631<br>Papillion, NE 68046</p>
        <a href="mailto:info@neseniorsoftball.com">info@neseniorsoftball.com</a>
      </div>
    </div>
    <div class="wrap footer-base">
      <span>© ${new Date().getFullYear()} Nebraska Senior Softball</span>
      <span>Games at the LaVista Sports Complex · 7346 S 66th St, La Vista, NE</span>
    </div>`;
}
