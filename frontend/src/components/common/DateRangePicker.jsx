import React from 'react';
import { Calendar } from 'lucide-react';

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="relative">
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="pl-8 pr-2 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
        />
        <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
      </div>
      <span className="text-slate-400">to</span>
      <div className="relative">
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="pl-8 pr-2 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
        />
        <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

