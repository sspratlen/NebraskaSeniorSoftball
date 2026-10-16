// Tiny HTML templating with automatic escaping of interpolated values.
// Use raw() for trusted markup produced by other html`` calls.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escape = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);

function render(v) {
  if (v == null || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  return escape(v);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => { out += render(v) + strings[i + 1]; });
  return raw(out);
}

// Minimal, safe markdown: paragraphs, "- " lists, **bold**, and auto-linked emails/URLs.
export function md(text) {
  const inline = (s) => escape(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\b([\w.+-]+@[\w-]+\.[\w.]+)\b/g, '<a href="mailto:$1">$1</a>')
    .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  const out = [];
  for (const block of String(text ?? '').split(/\n{2,}/)) {
    let para = [];
    let list = [];
    const flushPara = () => { if (para.length) out.push(`<p>${para.join('<br>')}</p>`); para = []; };
    const flushList = () => { if (list.length) out.push(`<ul>${list.join('')}</ul>`); list = []; };
    for (const line of block.split('\n')) {
      if (line.startsWith('- ')) { flushPara(); list.push(`<li>${inline(line.slice(2))}</li>`); }
      else { flushList(); para.push(inline(line)); }
    }
    flushPara(); flushList();
  }
  return raw(out.join(''));
}
