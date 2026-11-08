export const APP_NAME = 'VitalWatch';

export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
};

export const ROLE_LABELS = {
  admin: 'Hospital Administrator',
  doctor: 'Attending Physician (MD)',
  nurse: 'Floor / Ward Nurse (RN)',
};

export const VITAL_BOUNDS = {
  heart_rate: { min: 20, max: 280, unit: 'bpm', label: 'Heart Rate' },
  systolic_bp: { min: 40, max: 280, unit: 'mmHg', label: 'Systolic Blood Pressure' },
  diastolic_bp: { min: 20, max: 180, unit: 'mmHg', label: 'Diastolic Blood Pressure' },
  spo2: { min: 50, max: 100, unit: '%', label: 'SpO2' },
  temperature: { min: 25.0, max: 45.0, unit: '°C', label: 'Body Temperature' },
  respiratory_rate: { min: 4, max: 60, unit: 'breaths/min', label: 'Respiratory Rate' },
};

export const WARDS = [
  'Cardiology ICU',
  'Intensive Care Unit (ICU)',
  'Emergency Department',
  'General Medical Ward',
  'Surgical Recovery',
  'Telemetry Observation',
  'Pediatric Ward',
  'Respiratory Care Unit',
];

export const ALERT_PRIORITIES = {
  REVIEW: 'review',
  URGENT: 'urgent',
};

export const ALERT_STATUSES = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
};

