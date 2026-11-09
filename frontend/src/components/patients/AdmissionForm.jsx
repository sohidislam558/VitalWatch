import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Select from '../common/Select';
import Button from '../common/Button';
import { WARDS } from '../../utils/constants';
import { admissionService } from '../../services/admissionService';
import { Bed, AlertCircle } from 'lucide-react';

export default function AdmissionForm({
  patients = [],
  defaultPatientId,
  onSubmit,
  loading = false,
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      patient_id: defaultPatientId || '',
      ward: 'Cardiology ICU',
      bed_number: '',
      admitted_at: new Date().toISOString().slice(0, 16),
    },
  });

  const selectedWard = watch('ward') || 'Cardiology ICU';
  const [availableBeds, setAvailableBeds] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(true);

  // Fetch ONLY available beds for the selected ward (defaults immediately to Cardiology ICU on blank form)
  useEffect(() => {
    let isMounted = true;
    async function loadAvailableBeds() {
      if (!selectedWard) {
        setAvailableBeds([]);
        setValue('bed_number', '');
        return;
      }

      setLoadingBeds(true);
      try {
        const res = await admissionService.getBeds(selectedWard);
        if (isMounted && res.data) {
          const available = res.data.available_beds || [];
          setAvailableBeds(available);
          setValue('bed_number', available[0] || '');
        }
      } catch {
        if (isMounted) {
          setAvailableBeds([]);
          setValue('bed_number', '');
        }
      } finally {
        if (isMounted) {
          setLoadingBeds(false);
        }
      }
    }

    loadAvailableBeds();
    return () => {
      isMounted = false;
    };
  }, [selectedWard, setValue]);

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

      {/* Bed Designation: Strictly available beds only. No occupied beds, no custom option */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Bed Designation <span className="text-red-500">*</span>
        </label>

        <select
          id="bed_number"
          disabled={loadingBeds || availableBeds.length === 0}
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
          {...register('bed_number', { required: 'Please select an available bed' })}
        >
          {loadingBeds ? (
            <option value="">Querying available beds for {selectedWard}...</option>
          ) : availableBeds.length === 0 ? (
            <option value="">No beds available in {selectedWard} (Ward is Full)</option>
          ) : (
            availableBeds.map((b) => (
              <option key={b} value={b}>
                {b} (Available)
              </option>
            ))
          )}
        </select>

        {errors.bed_number && (
          <p className="mt-1 text-xs text-red-600">{errors.bed_number.message}</p>
        )}

        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {loadingBeds
                ? 'Checking bed occupancy...'
                : `${availableBeds.length} bed${availableBeds.length === 1 ? '' : 's'} available in ${selectedWard}`}
            </span>
          </span>
          {availableBeds.length === 0 && !loadingBeds && (
            <span className="text-red-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Ward Full
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Admission Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          id="admitted_at"
          type="datetime-local"
          required
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          {...register('admitted_at', { required: 'Admission timestamp is required' })}
        />
        {errors.admitted_at && (
          <p className="mt-1 text-xs text-red-600">{errors.admitted_at.message}</p>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={loadingBeds || availableBeds.length === 0}
        >
          Confirm Ward Admission
        </Button>
      </div>
    </form>
  );
}
