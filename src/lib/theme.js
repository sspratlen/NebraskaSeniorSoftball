import { supabase } from './supabase.js';

// Admin-selectable site themes. The active theme lives in site_settings.theme;
// the last one seen is cached in localStorage so the next visit paints in the
// right theme before Supabase answers (see the inline script in index.html).
export const THEMES = [
  {
    id: 'scoreboard', name: 'Scoreboard', tagline: 'Night game under the lights — LED amber on black, line-score panels and glowing numbers.',
    swatches: ['#07090c', '#ffb000', '#39ff6a', '#ff3b3b'], headerBg: '#000', headerFg: '#ffb000', font: "'Orbitron', sans-serif",
  },
  {
    id: 'ballpark', name: 'Ballpark', tagline: 'Sunny day at the park — mowed-grass stripes, ivy-green outfield wall, brick and chalk lines.',
    swatches: ['#1f4d2b', '#a4362a', '#f4efe3', '#e8c66a'], headerBg: '#1f4d2b', headerFg: '#fff', font: "'Alfa Slab One', serif",
  },
  {
    id: 'varsity', name: 'Varsity', tagline: 'Letterman jacket — maroon wool, gold stripes, chenille patches and stitched edges.',
    swatches: ['#6b1d2a', '#e0a526', '#f3ead6', '#1d1a19'], headerBg: '#6b1d2a', headerFg: '#e0a526', font: "'Graduate', serif",
  },
  {
    id: 'cards', name: 'Trading Card', tagline: '1970s baseball card — card stock, retro stripes, chunky type and stat-back tables.',
    swatches: ['#f2e6c9', '#e8692c', '#f2b134', '#1f8a8a'], headerBg: '#5a3a22', headerFg: '#f2b134', font: "'Righteous', sans-serif",
  },
];
export const DEFAULT_THEME = 'ballpark';
const isTheme = (id) => THEMES.some((t) => t.id === id);

let liveTheme = DEFAULT_THEME;
const store = {
  get: (s, k) => { try { return s.getItem(k); } catch (_) { return null; } },
  set: (s, k, v) => { try { v == null ? s.removeItem(k) : s.setItem(k, v); } catch (_) {} },
};

export function applyTheme(id) {
  const theme = isTheme(id) ? id : DEFAULT_THEME;
  document.documentElement.dataset.siteTheme = theme;
  window.NSS_loadThemeFonts?.(theme);
}

export const previewTheme = () => store.get(sessionStorage, 'nss-theme-preview');
export const currentLiveTheme = () => liveTheme;

export function setPreview(id) {
  store.set(sessionStorage, 'nss-theme-preview', id && id !== liveTheme ? id : null);
  applyTheme(id || liveTheme);
  renderPreviewBar();
}

// Floating bar shown only to the person previewing (preview lives in this tab only).
export function renderPreviewBar() {
  document.querySelector('.preview-bar')?.remove();
  const id = previewTheme();
  if (!id || id === liveTheme) return;
  const theme = THEMES.find((t) => t.id === id);
  const bar = document.createElement('div');
  bar.className = 'preview-bar';
  bar.setAttribute('role', 'status');
  const label = document.createElement('span');
  label.textContent = `Previewing “${theme?.name}” — only you can see this.`;
  const live = Object.assign(document.createElement('a'), { className: 'btn btn-accent', href: '#/admin/theme', textContent: 'Choose theme' });
  const exit = Object.assign(document.createElement('button'), { className: 'btn btn-outline', type: 'button', textContent: 'Exit preview' });
  exit.style.color = '#fff';
  exit.addEventListener('click', () => setPreview(null));
  bar.append(label, live, exit);
  document.body.appendChild(bar);
}

export async function initTheme() {
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'theme').maybeSingle();
  if (isTheme(data?.value)) liveTheme = data.value;
  store.set(localStorage, 'nss-theme', liveTheme);
  applyTheme(previewTheme() || liveTheme);
}

export async function saveTheme(id, userId) {
  const { error } = await supabase.from('site_settings')
    .upsert({ key: 'theme', value: id, updated_at: new Date().toISOString(), updated_by: userId });
  if (error) throw error;
  liveTheme = id;
  store.set(localStorage, 'nss-theme', id);
  setPreview(null);
}
