import React from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import { Heart, Droplets, Thermometer, Wind, AlertCircle } from 'lucide-react';

export default function VitalEntryForm({
  patient,
  onSubmit,
  loading = false,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      patient_id: patient?.id,
      admission_id: patient?.active_admission?.id,
      heart_rate: '',
      systolic_bp: '',
      diastolic_bp: '',
      spo2: '',
      temperature: '',
      respiratory_rate: '',
      notes: '',
      measured_at: new Date().toISOString().slice(0, 16),
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient admission confirmation banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-blue-900">Active Patient: </span>
          <strong className="text-blue-950">{patient.patient_code} &bull; {patient.name}</strong>
        </div>
        <div>
          <span className="text-blue-700">Ward: </span>
          <strong className="text-blue-950">{patient.active_admission?.ward} (Bed {patient.active_admission?.bed_number})</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Heart Rate */}
        <div>
          <Input
            label="Heart Rate (bpm)"
            id="heart_rate"
            type="number"
            step="1"
            placeholder="e.g. 75"
            required
            icon={Heart}
            helperText="Valid range: 20 – 280 bpm"
            error={errors.heart_rate?.message}
            {...register('heart_rate', {
              required: 'Heart rate is required',
              min: { value: 20, message: 'Minimum 20 bpm' },
              max: { value: 280, message: 'Maximum 280 bpm' },
            })}
          />
        </div>

        {/* Systolic BP */}
        <div>
          <Input
            label="Systolic BP (mmHg)"
            id="systolic_bp"
            type="number"
            step="1"
            placeholder="e.g. 120"
            required
            icon={Droplets}
            helperText="Valid range: 40 – 280 mmHg"
            error={errors.systolic_bp?.message}
            {...register('systolic_bp', {
              required: 'Systolic BP is required',
              min: { value: 40, message: 'Minimum 40 mmHg' },
              max: { value: 280, message: 'Maximum 280 mmHg' },
            })}
          />
        </div>

        {/* Diastolic BP */}
        <div>
          <Input
            label="Diastolic BP (mmHg)"
            id="diastolic_bp"
            type="number"
            step="1"
            placeholder="e.g. 80"
            required
            icon={Droplets}
            helperText="Valid range: 20 – 180 mmHg"
            error={errors.diastolic_bp?.message}
            {...register('diastolic_bp', {
              required: 'Diastolic BP is required',
              min: { value: 20, message: 'Minimum 20 mmHg' },
              max: { value: 180, message: 'Maximum 180 mmHg' },
            })}
          />
        </div>

        {/* SpO2 */}
        <div>
          <Input
            label="SpO2 Oxygen Saturation (%)"
            id="spo2"
            type="number"
            step="0.1"
            placeholder="e.g. 98.0"
            required
            icon={Wind}
            helperText="Valid range: 50 – 100%"
            error={errors.spo2?.message}
            {...register('spo2', {
              required: 'Oxygen saturation is required',
              min: { value: 50, message: 'Minimum 50%' },
              max: { value: 100, message: 'Maximum 100%' },
            })}
          />
        </div>

        {/* Temperature */}
        <div>
          <Input
            label="Body Temperature (°C)"
            id="temperature"
            type="number"
            step="0.1"
            placeholder="e.g. 36.8"
            required
            icon={Thermometer}
            helperText="Valid range: 25.0 – 45.0 °C"
            error={errors.temperature?.message}
            {...register('temperature', {
              required: 'Temperature is required',
              min: { value: 25.0, message: 'Minimum 25.0 °C' },
              max: { value: 45.0, message: 'Maximum 45.0 °C' },
            })}
          />
        </div>

        {/* Respiratory Rate */}
        <div>
          <Input
            label="Respiratory Rate (breaths/min)"
            id="respiratory_rate"
            type="number"
            step="1"
            placeholder="e.g. 16"
            required
            icon={Wind}
            helperText="Valid range: 4 – 60 /min"
            error={errors.respiratory_rate?.message}
            {...register('respiratory_rate', {
              required: 'Respiratory rate is required',
              min: { value: 4, message: 'Minimum 4 /min' },
              max: { value: 60, message: 'Maximum 60 /min' },
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Observation Date & Time"
          id="measured_at"
          type="datetime-local"
          required
          error={errors.measured_at?.message}
          {...register('measured_at', { required: 'Measurement date & time is required' })}
        />

        <Textarea
          label="Bedside Clinical Observations (Optional)"
          id="notes"
          placeholder="Enter patient position, symptoms, or rounding notes..."
          rows={2}
          {...register('notes')}
        />
      </div>

      <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-md text-xs text-amber-900 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p>
          Entered vital values will be evaluated against configured alert threshold rules immediately upon saving.
          Past clinical measurements are permanent and immutable.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading} size="lg">
          Commit & Evaluate Vital Signs
        </Button>
      </div>
    </form>
  );
}

