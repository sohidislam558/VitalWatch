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

export const WARD_BEDS = {
  'Cardiology ICU': ['Bed 101', 'Bed 102', 'Bed 103', 'Bed 104', 'Bed 105', 'Bed 106', 'Bed 107', 'Bed 108', 'Bed 109', 'Bed 110'],
  'Intensive Care Unit (ICU)': ['ICU-01', 'ICU-02', 'ICU-03', 'ICU-04', 'ICU-05', 'ICU-06', 'ICU-07', 'ICU-08', 'ICU-09', 'ICU-10'],
  'Emergency Department': ['ER-01', 'ER-02', 'ER-03', 'ER-04', 'ER-05', 'ER-06', 'ER-07', 'ER-08', 'ER-09', 'ER-10'],
  'General Medical Ward': ['Bed 201', 'Bed 202', 'Bed 203', 'Bed 204', 'Bed 205', 'Bed 206', 'Bed 207', 'Bed 208', 'Bed 209', 'Bed 210'],
  'Surgical Recovery': ['SURG-01', 'SURG-02', 'SURG-03', 'SURG-04', 'SURG-05', 'SURG-06', 'SURG-07', 'SURG-08', 'SURG-09', 'SURG-10'],
  'Telemetry Observation': ['TEL-01', 'TEL-02', 'TEL-03', 'TEL-04', 'TEL-05', 'TEL-06', 'TEL-07', 'TEL-08', 'TEL-09', 'TEL-10'],
  'Pediatric Ward': ['PED-01', 'PED-02', 'PED-03', 'PED-04', 'PED-05', 'PED-06', 'PED-07', 'PED-08', 'PED-09', 'PED-10'],
  'Respiratory Care Unit': ['RCU-01', 'RCU-02', 'RCU-03', 'RCU-04', 'RCU-05', 'RCU-06', 'RCU-07', 'RCU-08', 'RCU-09', 'RCU-10'],
};

export const ALERT_PRIORITIES = {
  REVIEW: 'review',
  URGENT: 'urgent',
};

export const ALERT_STATUSES = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
};

