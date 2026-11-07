import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid hospital email address'),
  password: z.string().min(1, 'Password is required'),
});

export const patientSchema = z.object({
  name: z.string().min(2, 'Patient name must be at least 2 characters'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  contact: z.string().max(50).optional().or(z.literal('')),
  address: z.string().max(1000).optional().or(z.literal('')),
});

export const admissionSchema = z.object({
  patient_id: z.coerce.number().positive('Please select a patient'),
  ward: z.string().min(1, 'Please select or enter a ward'),
  bed_number: z.string().min(1, 'Bed number is required'),
  admitted_at: z.string().optional().or(z.literal('')),
});

export const vitalSchema = z.object({
  patient_id: z.coerce.number().positive('Patient is required'),
  admission_id: z.coerce.number().positive('Active admission is required'),
  heart_rate: z.coerce.number().min(20, 'Heart rate must be ≥ 20 bpm').max(280, 'Heart rate must be ≤ 280 bpm'),
  systolic_bp: z.coerce.number().min(40, 'Systolic BP must be ≥ 40 mmHg').max(280, 'Systolic BP must be ≤ 280 mmHg'),
  diastolic_bp: z.coerce.number().min(20, 'Diastolic BP must be ≥ 20 mmHg').max(180, 'Diastolic BP must be ≤ 180 mmHg'),
  spo2: z.coerce.number().min(50, 'SpO2 must be ≥ 50%').max(100, 'SpO2 must be ≤ 100%'),
  temperature: z.coerce.number().min(25.0, 'Temperature must be ≥ 25.0 °C').max(45.0, 'Temperature must be ≤ 45.0 °C'),
  respiratory_rate: z.coerce.number().min(4, 'Respiratory rate must be ≥ 4 /min').max(60, 'Respiratory rate must be ≤ 60 /min'),
  notes: z.string().max(1000).optional().or(z.literal('')),
  measured_at: z.string().optional().or(z.literal('')),
});

export const alertRuleSchema = z.object({
  name: z.string().min(3, 'Rule name is required'),
  parameter: z.enum(['heart_rate', 'systolic_bp', 'diastolic_bp', 'spo2', 'temperature', 'respiratory_rate']),
  operator: z.enum(['greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'equal_to']),
  threshold_value: z.coerce.number(),
  priority: z.enum(['review', 'urgent']),
  message_template: z.string().min(5, 'Message template is required (use {val} placeholder)'),
});

