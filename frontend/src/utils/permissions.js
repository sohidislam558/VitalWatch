import { ROLES } from './constants';

export function canManageUsers(user) {
  return user?.role === ROLES.ADMIN;
}

export function canRegisterPatient(user) {
  // Only registered nurses can register patients
  return user?.role === ROLES.NURSE;
}

export function canAdmitPatient(user) {
  // Only nurses can admit patients to a ward
  return user?.role === ROLES.NURSE;
}

export function canDischargePatient(user) {
  // Only doctors can formally discharge patients
  return user?.role === ROLES.DOCTOR;
}

export function canRecordVitals(user) {
  // Only bedside nurses can record vital signs observations
  return user?.role === ROLES.NURSE;
}

export function canDeletePatient(user) {
  // Only administrators can delete patient records
  return user?.role === ROLES.ADMIN;
}

export function canAcknowledgeAlerts(user) {
  return [ROLES.DOCTOR, ROLES.NURSE].includes(user?.role);
}

export function canResolveAlerts(user) {
  return user?.role === ROLES.DOCTOR;
}

export function canManageAlertRules(user) {
  return user?.role === ROLES.ADMIN;
}

export function canViewAuditLogs(user) {
  return user?.role === ROLES.ADMIN;
}
