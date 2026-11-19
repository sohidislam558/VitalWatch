import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../utils/formatDate';
import { formatHeartRate, formatBloodPressure, formatSpO2, formatTemperature, formatRespiratoryRate } from '../../utils/formatVitals';
import { formatStaffName } from '../../utils/formatUser';
import EmptyState from '../common/EmptyState';
import { AlertTriangle, User } from 'lucide-react';

export default function VitalHistoryTable({ vitals = [], showPatient = true }) {
  if (vitals.length === 0) {
    return <EmptyState title="No vital measurements recorded" description="Start by adding the patient's first vital signs observation." />;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              {showPatient && <th className="px-4 py-3 text-left">Patient</th>}
              <th className="px-4 py-3 text-left">Observed Date/Time</th>
              <th className="px-4 py-3 text-right">Heart Rate</th>
              <th className="px-4 py-3 text-right">Blood Pressure</th>
              <th className="px-4 py-3 text-right">SpO2</th>
              <th className="px-4 py-3 text-right">Temperature</th>
              <th className="px-4 py-3 text-right">Resp Rate</th>
              <th className="px-4 py-3 text-left">Recorded By</th>
              <th className="px-4 py-3 text-left">Clinical Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {vitals.map((v) => {
              const hasAlert = v.alerts && v.alerts.length > 0;
              const patient = v.patient;
              const admission = v.admission;

              return (
                <tr
                  key={v.id}
                  className={`transition-colors ${hasAlert ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50'}`}
                >
                  {showPatient && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {patient ? (
                        <div>
                          <Link
                            to={`/patients/${patient.id}`}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1.5"
                          >
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{patient.name}</span>
                          </Link>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                            {patient.patient_code && (
                              <span className="font-mono">{patient.patient_code}</span>
                            )}
                            {admission?.ward && (
                              <span>&bull; {admission.ward}{admission.bed_number ? ` (${admission.bed_number})` : ''}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium italic">Patient #{v.patient_id}</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-medium">
                    <div className="flex items-center gap-1.5">
                      {hasAlert && (
                        <span title="Triggered alert threshold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        </span>
                      )}
                      <span>{formatDateTime(v.measured_at)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {formatHeartRate(v.heart_rate)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {formatBloodPressure(v.systolic_bp, v.diastolic_bp)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {formatSpO2(v.spo2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {formatTemperature(v.temperature)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {formatRespiratoryRate(v.respiratory_rate)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                    {v.recorder ? formatStaffName(v.recorder.name, v.recorder.role) : 'Staff Member'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={v.clinical_notes || v.notes || ''}>
                    {v.clinical_notes || v.notes || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

