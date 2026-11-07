import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatTimeOnly, formatDateTime } from '../../utils/formatDate';

export default function VitalChart({ records = [] }) {
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Format records sorted ascending by measured_at
  const chartData = [...records]
    .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at))
    .map((r) => ({
      time: formatTimeOnly(r.measured_at),
      fullDate: formatDateTime(r.measured_at),
      heart_rate: Number(r.heart_rate),
      systolic_bp: Number(r.systolic_bp),
      diastolic_bp: Number(r.diastolic_bp),
      spo2: Number(r.spo2),
      temperature: Number(r.temperature),
      respiratory_rate: Number(r.respiratory_rate),
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-500">
        No measurements available to generate time-series trend graphs.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-md shadow-lg text-xs space-y-1">
          <p className="font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-1">
            {dataPoint?.fullDate || label}
          </p>
          {payload.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-4">
              <span style={{ color: item.color }} className="font-medium">
                {item.name}:
              </span>
              <span className="font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Physiological Trend Charts</h3>
          <p className="text-xs text-slate-500 mt-0.5">Chronological vital signs progression</p>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'All Primary' },
            { id: 'hr', label: 'Heart Rate (bpm)' },
            { id: 'bp', label: 'Blood Pressure (mmHg)' },
            { id: 'spo2', label: 'SpO2 (%)' },
            { id: 'temp', label: 'Temp (°C)' },
            { id: 'rr', label: 'Resp Rate (/min)' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMetric(m.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedMetric === m.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

            {(selectedMetric === 'all' || selectedMetric === 'hr') && (
              <Line
                type="monotone"
                dataKey="heart_rate"
                name="Heart Rate (bpm)"
                stroke="#e11d48"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}

            {(selectedMetric === 'all' || selectedMetric === 'bp') && (
              <>
                <Line
                  type="monotone"
                  dataKey="systolic_bp"
                  name="Systolic BP (mmHg)"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic_bp"
                  name="Diastolic BP (mmHg)"
                  stroke="#818cf8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5 }}
                />
              </>
            )}

            {(selectedMetric === 'all' || selectedMetric === 'spo2') && (
              <Line
                type="monotone"
                dataKey="spo2"
                name="SpO2 (%)"
                stroke="#0284c7"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            )}

            {selectedMetric === 'temp' && (
              <Line
                type="monotone"
                dataKey="temperature"
                name="Body Temp (°C)"
                stroke="#d97706"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            )}

            {selectedMetric === 'rr' && (
              <Line
                type="monotone"
                dataKey="respiratory_rate"
                name="Respiratory Rate (/min)"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

