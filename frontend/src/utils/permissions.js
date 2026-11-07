import { ROLES } from './constants';

export function canManageUsers(user) {
  return user?.role === ROLES.ADMIN;
}

export function canRegisterPatient(user) {
  return user?.role === ROLES.ADMIN || user?.role === ROLES.NURSE;
}

export function canAdmitPatient(user) {
  return user?.role === ROLES.ADMIN || user?.role === ROLES.NURSE;
}

export function canDischargePatient(user) {
  return user?.role === ROLES.ADMIN || user?.role === ROLES.DOCTOR;
}

export function canRecordVitals(user) {
  return user?.role === ROLES.ADMIN || user?.role === ROLES.NURSE;
}

export function canAcknowledgeAlerts(user) {
  return [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE].includes(user?.role);
}

export function canResolveAlerts(user) {
  return [ROLES.ADMIN, ROLES.DOCTOR].includes(user?.role);
}

export function canManageAlertRules(user) {
  return user?.role === ROLES.ADMIN;
}

export function canViewAuditLogs(user) {
  return user?.role === ROLES.ADMIN;
}

