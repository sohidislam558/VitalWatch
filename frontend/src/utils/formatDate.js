import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateString, pattern = 'MMM d, yyyy') {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date) ? format(date, pattern) : '—';
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString) {
  return formatDate(dateString, 'MMM d, yyyy HH:mm');
}

export function formatTimeOnly(dateString) {
  return formatDate(dateString, 'HH:mm');
}

export function calculateAge(dobString) {
  if (!dobString) return '—';
  try {
    const dob = typeof dobString === 'string' ? parseISO(dobString) : dobString;
    if (!isValid(dob)) return '—';
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  } catch {
    return '—';
  }
}

