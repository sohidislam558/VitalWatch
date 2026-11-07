export function formatHeartRate(val) {
  if (val === null || val === undefined) return '—';
  return `${Number(val).toFixed(0)} bpm`;
}

export function formatBloodPressure(systolic, diastolic) {
  if (!systolic || !diastolic) return '—';
  return `${Number(systolic).toFixed(0)}/${Number(diastolic).toFixed(0)} mmHg`;
}

export function formatSpO2(val) {
  if (val === null || val === undefined) return '—';
  return `${Number(val).toFixed(1)}%`;
}

export function formatTemperature(val) {
  if (val === null || val === undefined) return '—';
  return `${Number(val).toFixed(1)} °C`;
}

export function formatRespiratoryRate(val) {
  if (val === null || val === undefined) return '—';
  return `${Number(val).toFixed(0)} /min`;
}

