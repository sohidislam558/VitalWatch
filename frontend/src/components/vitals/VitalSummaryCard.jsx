import React from 'react';
import { Heart, Droplets, Wind, Thermometer, Activity } from 'lucide-react';
import { formatHeartRate, formatBloodPressure, formatSpO2, formatTemperature, formatRespiratoryRate } from '../../utils/formatVitals';
import { formatDateTime } from '../../utils/formatDate';

export default function VitalSummaryCard({ latestReading }) {
  if (!latestReading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-xs text-slate-500">
        No vital measurements on file for this patient.
      </div>
    );
  }

  const items = [
    {
      label: 'Heart Rate',
      val: formatHeartRate(latestReading.heart_rate),
      icon: Heart,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      label: 'Blood Pressure',
      val: formatBloodPressure(latestReading.systolic_bp, latestReading.diastolic_bp),
      icon: Droplets,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Oxygen Saturation',
      val: formatSpO2(latestReading.spo2),
      icon: Wind,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      label: 'Temperature',
      val: formatTemperature(latestReading.temperature),
      icon: Thermometer,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Respiratory Rate',
      val: formatRespiratoryRate(latestReading.respiratory_rate),
      icon: Activity,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Latest Bedside Telemetry
        </h3>
        <span className="text-[11px] text-slate-500">
          Measured: <strong>{formatDateTime(latestReading.measured_at)}</strong> by {latestReading.recorder?.name || 'Staff'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-500">{item.label}</span>
                <div className={`p-1.5 rounded-md ${item.bg} ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-base font-bold text-slate-900 mt-2">{item.val}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

