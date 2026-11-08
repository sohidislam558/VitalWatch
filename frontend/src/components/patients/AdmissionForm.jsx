import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Select from '../common/Select';
import Input from '../common/Input';
import Button from '../common/Button';
import { WARDS, WARD_BEDS } from '../../utils/constants';
import { admissionService } from '../../services/admissionService';
import { Bed, AlertCircle, CheckCircle } from 'lucide-react';

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

  const selectedWard = watch('ward');
  const [bedData, setBedData] = useState({
    available_beds: WARD_BEDS['Cardiology ICU'] || ['Bed 101', 'Bed 102', 'Bed 103'],
    occupied_beds: [],
    loading: false,
  });
  const [useCustomBed, setUseCustomBed] = useState(false);

  // Fetch available/occupied beds whenever ward changes
  useEffect(() => {
    let isMounted = true;
    async function loadBeds() {
      if (!selectedWard) return;
      setBedData((prev) => ({ ...prev, loading: true }));
      try {
        const res = await admissionService.getBeds(selectedWard);
        if (isMounted && res.data) {
          const wardInfo = res.data;
          setBedData({
            available_beds: wardInfo.available_beds || [],
            occupied_beds: wardInfo.occupied_beds || [],
            loading: false,
          });
          // Auto-select first available bed if current bed is not in available
          if (wardInfo.available_beds?.length > 0) {
            setValue('bed_number', wardInfo.available_beds[0]);
          } else {
            setValue('bed_number', '');
          }
        }
      } catch {
        // Fallback to static constants if offline
        if (isMounted) {
          const standard = WARD_BEDS[selectedWard] || ['Bed 101', 'Bed 102', 'Bed 103'];
          setBedData({
            available_beds: standard,
            occupied_beds: [],
            loading: false,
          });
          setValue('bed_number', standard[0] || '');
        }
      }
    }

    loadBeds();
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

      {/* Bed Selection: Available Beds Dropdown */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-700">
            Assigned Bed Number <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setUseCustomBed(!useCustomBed)}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline"
          >
            {useCustomBed ? '← Choose from available beds' : '+ Enter custom bed'}
          </button>
        </div>

        {useCustomBed ? (
          <Input
            id="bed_number"
            placeholder="e.g. Bed 205, Overflow-1"
            required
            error={errors.bed_number?.message}
            {...register('bed_number', { required: 'Bed assignment is required' })}
          />
        ) : (
          <div>
            <select
              id="bed_number"
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...register('bed_number', { required: 'Please select an available bed' })}
            >
              {bedData.available_beds.length === 0 && bedData.occupied_beds.length === 0 && (
                <option value="">No beds configured for this ward</option>
              )}

              {bedData.available_beds.length > 0 && (
                <optgroup label={`Available Beds (${bedData.available_beds.length})`}>
                  {bedData.available_beds.map((b) => (
                    <option key={b} value={b}>
                      🟢 {b} (Available)
                    </option>
                  ))}
                </optgroup>
              )}

              {bedData.occupied_beds.length > 0 && (
                <optgroup label={`Occupied Beds (${bedData.occupied_beds.length})`}>
                  {bedData.occupied_beds.map((occ) => (
                    <option key={occ.bed_number} value={occ.bed_number} disabled>
                      🔴 {occ.bed_number} (Occupied — {occ.patient_name || 'Inpatient'})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {errors.bed_number && (
              <p className="mt-1 text-xs text-red-600">{errors.bed_number.message}</p>
            )}

            {/* Availability Helper Summary */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  <strong>{bedData.available_beds.length}</strong> available /{' '}
                  <strong>{bedData.occupied_beds.length}</strong> occupied in {selectedWard}
                </span>
              </span>
              {bedData.available_beds.length === 0 && !bedData.loading && (
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> All beds occupied
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <Input
        label="Admission Date & Time"
        id="admitted_at"
        type="datetime-local"
        required
        error={errors.admitted_at?.message}
        {...register('admitted_at', { required: 'Admission timestamp is required' })}
      />

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={!useCustomBed && bedData.available_beds.length === 0}
        >
          Confirm Ward Admission
        </Button>
      </div>
    </form>
  );
}
