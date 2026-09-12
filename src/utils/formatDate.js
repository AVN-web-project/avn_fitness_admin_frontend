/**
 * Formats a Date or ISO string into a human-readable format.
 */
export function formatDate(dateInput, includeTime = true) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}
