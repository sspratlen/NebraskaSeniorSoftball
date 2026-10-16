const TZ = 'America/Chicago';

// Dates from Postgres `date` columns are plain YYYY-MM-DD; parse as local noon
// so they never shift a day across time zones.
export const parseDate = (d) => (d instanceof Date ? d : new Date(`${String(d).slice(0, 10)}T12:00:00`));

export const fmtDate = (d, opts = { weekday: 'short', month: 'short', day: 'numeric' }) =>
  d ? parseDate(d).toLocaleDateString('en-US', opts) : '';

export const fmtLongDate = (d) => fmtDate(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = String(t).split(':').map(Number);
  if (Number.isNaN(h)) return t;
  return new Date(2000, 0, 1, h, m || 0).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const fmtMoney = (cents) => (cents == null ? '' : `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`);

export const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });

export const monthKey = (d) => String(d).slice(0, 7);
export const fmtMonth = (key) => parseDate(`${key}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const pct = (w, l, t = 0) => {
  const g = w + l + t;
  return g ? ((w + t / 2) / g).toFixed(3).replace(/^0/, '') : '.000';
};
