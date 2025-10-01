export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDay(value) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, options).format(value);
}

export function formatWeight(value) {
  if (value === null || value === undefined) return '—';
  return `${formatNumber(value, { maximumFractionDigits: 1 })} lbs`;
}

export function computeAdherence(completed, total) {
  if (!total) return '—';
  return `${Math.round((completed / total) * 100)}%`;
}
