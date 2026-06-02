// datetime-local inputs are stored as local time, but Laravel serialises
// Carbon dates with a UTC 'Z' suffix. Stripping Z prevents the browser
// from applying a UTC-offset shift on display and comparisons.

export function parseDate(iso) {
  if (!iso) return null;
  return new Date(iso.replace(/Z$/, ''));
}

export function fmtDate(iso) {
  const d = parseDate(iso);
  return d ? d.toLocaleString() : 'N/A';
}

export function fmtDateOnly(iso) {
  const d = parseDate(iso);
  return d ? d.toLocaleDateString() : 'N/A';
}
