import './styles.css';
import './themes.css';
import { route, start, onRoute, currentPath } from './lib/router.js';
import { initAuth, onAuth } from './lib/auth.js';
import { initTheme, renderPreviewBar } from './lib/theme.js';
import { SPRITE, errorBox, empty } from './lib/ui.js';
import { html } from './lib/html.js';
import { renderHeader, renderFooter } from './layout.js';

import home from './pages/home.js';
import { leaguesIndex, leagueDetail } from './pages/leagues.js';
import calendar from './pages/calendar.js';
import { newsIndex, newsPost } from './pages/news.js';
import register from './pages/register.js';
import rules from './pages/rules.js';
import about from './pages/about.js';
import sponsors from './pages/sponsors.js';
import contact from './pages/contact.js';
import account from './pages/account.js';
import admin from './pages/admin.js';

document.body.insertAdjacentHTML('afterbegin', SPRITE);

route('/', home);
route('/leagues', leaguesIndex);
route('/leagues/:slug', leagueDetail);
route('/leagues/:slug/:tab', leagueDetail);
route('/calendar', calendar);
route('/news', newsIndex);
route('/news/:slug', newsPost);
route('/register', register);
route('/rules', rules);
route('/about', about);
route('/board', about);
route('/sponsors', sponsors);
route('/contact', contact);
route('/account', account);
route('/admin', admin);
route('/admin/:tab', admin);

const main = document.getElementById('main');
let renderId = 0;

onRoute(async (handler, params, path) => {
  const id = ++renderId;
  renderHeader(path);
  if (!handler) {
    main.innerHTML = html`<div class="wrap section">${empty('Page not found', 'That page may have moved when we launched the new site.')}<p class="center"><a class="btn" href="#/">Go home</a></p></div>`;
    return;
  }
  try {
    // A page returns either markup or { html, mount } for interactive pages.
    const out = await handler(params);
    if (id !== renderId) return; // a newer navigation won
    const view = out?.html !== undefined ? out : { html: out };
    main.innerHTML = String(view.html);
    view.mount?.(main);
    const sub = params.tab;
    if (!sub) window.scrollTo({ top: 0 });
    document.title = (main.querySelector('h1')?.textContent?.trim() || 'Home') + ' · Nebraska Senior Softball';
  } catch (err) {
    console.error(err);
    if (id === renderId) main.innerHTML = html`<div class="wrap section">${errorBox(err)}</div>`;
  }
});

// A magic-link return lands as #access_token=… (or #error=…). Let Supabase read it,
// then swap it for a real route so the hash router never sees the tokens.
const authReturn = /(^#|&)(access_token|error_description)=/.test(location.hash);

(async () => {
  renderFooter();
  const themeReady = initTheme().catch((err) => console.warn('Theme not loaded:', err));
  await initAuth();
  await themeReady;
  renderPreviewBar();
  if (authReturn) {
    let next = '/account';
    try { next = sessionStorage.getItem('nss-after-login') || next; sessionStorage.removeItem('nss-after-login'); } catch (_) {}
    history.replaceState(null, '', `${location.pathname}${location.search}#${next}`);
  }
  onAuth(() => renderHeader(currentPath()));
  start();
})();
