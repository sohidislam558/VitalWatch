/**
 * Strips any redundant doctor/nurse prefixes from a name.
 * Handles "Dr. Dr. Atika", "Dr. Atika", "Nurse Nurse Farzana", "Nurse Farzana", etc.
 */
export function cleanPersonName(name) {
  if (!name) return '';
  let cleaned = String(name).trim();
  while (/^(dr\.?|doctor|nurse)\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(dr\.?|doctor|nurse)\s+/i, '').trim();
  }
  return cleaned;
}

/**
 * Returns a doctor's name prefixed with "Dr. " without duplicate prefixes.
 */
export function formatDoctorName(name) {
  const clean = cleanPersonName(name);
  return clean ? `Dr. ${clean}` : 'Attending Physician';
}

/**
 * Returns a nurse's name prefixed with "Nurse " without duplicate prefixes.
 */
export function formatNurseName(name) {
  const clean = cleanPersonName(name);
  return clean ? `Nurse ${clean}` : 'Ward Nurse';
}

/**
 * Formats a user display name according to their role.
 */
export function formatStaffName(name, role) {
  if (!name) return 'Staff Member';
  if (role === 'doctor') return formatDoctorName(name);
  if (role === 'nurse') return formatNurseName(name);
  return cleanPersonName(name);
}
