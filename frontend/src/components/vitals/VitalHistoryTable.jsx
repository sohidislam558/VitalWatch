import React from 'react';
import { formatDateTime } from '../../utils/formatDate';
import { formatHeartRate, formatBloodPressure, formatSpO2, formatTemperature, formatRespiratoryRate } from '../../utils/formatVitals';
import EmptyState from '../common/EmptyState';
import { AlertTriangle } from 'lucide-react';

export default function VitalHistoryTable({ vitals = [], loading = false }) {
  if (vitals.length === 0) {
    return <EmptyState title="No vital measurements recorded" description="Start by adding the patient's first vital signs observation." />;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
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

              return (
                <tr
                  key={v.id}
                  className={`transition-colors ${hasAlert ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50'}`}
                >
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
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {v.recorder?.name || 'Staff Member'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                    {v.notes || '—'}
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

