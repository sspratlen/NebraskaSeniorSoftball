// Hash-based router: works on GitHub Pages (no server rewrites needed) and on Cloudflare.
const routes = [];

export function route(pattern, handler) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/\/:(\w+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; }) + '/?$');
  routes.push({ re, keys, handler });
}

export function currentPath() {
  const h = location.hash.replace(/^#/, '');
  return h.split('?')[0] || '/';
}

export function query() {
  return new URLSearchParams(location.hash.split('?')[1] || '');
}

export function navigate(path) {
  if (currentPath() === path) resolve(); else location.hash = path;
}

let onChange = () => {};
export function onRoute(fn) { onChange = fn; }

export async function resolve() {
  const path = currentPath();
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) {
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      return onChange(r.handler, params, path);
    }
  }
  return onChange(null, {}, path);
}

export function start() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
