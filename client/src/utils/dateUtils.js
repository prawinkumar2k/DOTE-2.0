/**
 * Formats a date string or object to dd-mm-yyyy format.
 * @param {Date|string} d - The date to format.
 * @returns {string} - Formatted date string.
 */
export function formatDate(d) {
  if (!d || d === '—') return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return String(d);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Formats a date string or object to dd-mm-yyyy HH:MM format.
 * @param {Date|string} d - The date/time to format.
 * @returns {string} - Formatted date-time string.
 */
export function formatDateTime(d) {
  if (!d || d === '—' || d === 'NA') return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return String(d);
  
  const dmy = formatDate(date);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  
  return `${dmy} ${time}`;
}
