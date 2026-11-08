import React from 'react';
import { useForm } from 'react-hook-form';
import Select from '../common/Select';
import Input from '../common/Input';
import Button from '../common/Button';
import { WARDS } from '../../utils/constants';

export default function AdmissionForm({
  patients = [],
  defaultPatientId,
  onSubmit,
  loading = false,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      patient_id: defaultPatientId || '',
      ward: 'Cardiology ICU',
      bed_number: '',
      admitted_at: new Date().toISOString().slice(0, 16),
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!defaultPatientId && (
        <Select
          label="Select Patient"
          id="patient_id"
          required
          options={patients.map((p) => ({
            value: p.id,
            label: `${p.patient_code} — ${p.name}`,
          }))}
          error={errors.patient_id?.message}
          {...register('patient_id', { required: 'Please select a patient to admit' })}
        />
      )}

      <Select
        label="Target Hospital Ward"
        id="ward"
        required
        options={WARDS.map((w) => ({ value: w, label: w }))}
        error={errors.ward?.message}
        {...register('ward', { required: 'Hospital ward is required' })}
      />

      <Input
        label="Assigned Bed Number"
        id="bed_number"
        placeholder="e.g. ICU-04, 3A-12"
        required
        error={errors.bed_number?.message}
        {...register('bed_number', { required: 'Bed assignment is required' })}
      />

      <Input
        label="Admission Date & Time"
        id="admitted_at"
        type="datetime-local"
        required
        error={errors.admitted_at?.message}
        {...register('admitted_at', { required: 'Admission timestamp is required' })}
      />

      <div className="pt-2 flex justify-end">
        <Button type="submit" loading={loading}>
          Confirm Ward Admission
        </Button>
      </div>
    </form>
  );
}

