import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { formatHeartRate, formatBloodPressure, formatSpO2, formatTemperature, formatRespiratoryRate } from '../../utils/formatVitals';
import { formatDateTime } from '../../utils/formatDate';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { Eye, PlusCircle } from 'lucide-react';

export default function PatientOverviewTable({
  patients = [],
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <LoadingSpinner text="Retrieving patient telemetry..." />
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <EmptyState
        title="No admitted patients found"
        description="Try adjusting your ward filter or search parameters."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3 text-left">Patient Code</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Ward & Bed</th>
              <th className="px-4 py-3 text-right">Heart Rate</th>
              <th className="px-4 py-3 text-right">BP (mmHg)</th>
              <th className="px-4 py-3 text-right">SpO2</th>
              <th className="px-4 py-3 text-right">Temp (°C)</th>
              <th className="px-4 py-3 text-right">Resp Rate</th>
              <th className="px-4 py-3 text-left">Last Measured</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {patients.map((patient) => {
              const vitals = patient.latest_vital_record;
              const admission = patient.active_admission;

              return (
                <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">
                    <Link
                      to={`/patients/${patient.id}`}
                      className="hover:text-blue-600 underline-offset-2 hover:underline"
                    >
                      {patient.patient_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{patient.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{admission?.ward || '—'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Bed: {admission?.bed_number || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatHeartRate(vitals?.heart_rate)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {formatBloodPressure(vitals?.systolic_bp, vitals?.diastolic_bp)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {formatSpO2(vitals?.spo2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {formatTemperature(vitals?.temperature)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {formatRespiratoryRate(vitals?.respiratory_rate)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-[11px]">
                    {vitals ? formatDateTime(vitals.measured_at) : 'No vitals recorded'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge
                      status={patient.monitoring_status || 'normal'}
                      label={patient.monitoring_status_label || 'Normal'}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="View Patient Chart"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/vitals/add?patient_id=${patient.id}`}
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                        title="Add New Vitals"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </Link>
                    </div>
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

