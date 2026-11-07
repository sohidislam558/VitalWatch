import React from 'react';
import { WARDS } from '../../utils/constants';

export default function WardFilter({ selectedWard, onChange, className = '' }) {
  return (
    <select
      value={selectedWard || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs bg-white border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 ${className}`}
    >
      <option value="">All Hospital Wards</option>
      {WARDS.map((ward) => (
        <option key={ward} value={ward}>
          {ward}
        </option>
      ))}
    </select>
  );
}

