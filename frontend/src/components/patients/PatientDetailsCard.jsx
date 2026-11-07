import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { calculateAge, formatDate, formatDateTime } from '../../utils/formatDate';
import { User, Bed, Phone, MapPin, Calendar, Activity } from 'lucide-react';
import Button from '../common/Button';

export default function PatientDetailsCard({
  patient,
  onDischarge,
  canDischarge = false,
  dischargeLoading = false,
}) {
  if (!patient) return null;

  const activeAdm = patient.active_admission;
  const age = calculateAge(patient.date_of_birth);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-200">
            {patient.name?.[0] || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">{patient.name}</h2>
              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                {patient.patient_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {age} years old &bull; <span className="capitalize">{patient.gender}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge
            status={activeAdm ? 'admitted' : 'discharged'}
            label={activeAdm ? `Admitted in ${activeAdm.ward}` : 'Discharged / Inactive'}
            size="md"
          />

          {activeAdm && canDischarge && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onDischarge(activeAdm)}
              loading={dischargeLoading}
            >
              Discharge Patient
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-5 text-xs">
        <div>
          <p className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5" /> Date of Birth
          </p>
          <p className="font-semibold text-slate-800">{formatDate(patient.date_of_birth)}</p>
        </div>

        <div>
          <p className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <Phone className="w-3.5 h-3.5" /> Contact Number
          </p>
          <p className="font-semibold text-slate-800">{patient.contact || 'No phone recorded'}</p>
        </div>

        <div>
          <p className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <Bed className="w-3.5 h-3.5" /> Ward & Bed
          </p>
          <p className="font-semibold text-slate-800">
            {activeAdm ? `${activeAdm.ward} (Bed ${activeAdm.bed_number})` : 'None'}
          </p>
        </div>

        <div>
          <p className="text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5" /> Admission Date
          </p>
          <p className="font-semibold text-slate-800">
            {activeAdm ? formatDateTime(activeAdm.admitted_at) : 'N/A'}
          </p>
        </div>
      </div>

      {patient.address && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <span>{patient.address}</span>
        </div>
      )}
    </div>
  );
}

