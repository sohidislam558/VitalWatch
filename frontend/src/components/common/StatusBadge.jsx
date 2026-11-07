import React from 'react';

export default function StatusBadge({ status, label, size = 'md', pulse = false }) {
  const normStatus = (status || '').toLowerCase();

  const styles = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
    review: 'bg-amber-100 text-amber-800 border-amber-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    admitted: 'bg-blue-100 text-blue-800 border-blue-200',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    stable: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    normal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    discharged: 'bg-slate-100 text-slate-700 border-slate-200',
    inactive: 'bg-slate-100 text-slate-700 border-slate-200',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    acknowledged: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const dotColors = {
    urgent: 'bg-red-500',
    critical: 'bg-red-500',
    review: 'bg-amber-500',
    warning: 'bg-amber-500',
    admitted: 'bg-blue-500',
    active: 'bg-emerald-500',
    stable: 'bg-emerald-500',
    normal: 'bg-emerald-500',
    discharged: 'bg-slate-400',
    inactive: 'bg-slate-400',
    resolved: 'bg-emerald-500',
    acknowledged: 'bg-blue-500',
  };

  const currentStyle = styles[normStatus] || 'bg-slate-100 text-slate-700 border-slate-200';
  const dotColor = dotColors[normStatus] || 'bg-slate-400';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  const displayLabel = label || status || 'Unknown';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses[size]} ${currentStyle}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
          pulse && (normStatus === 'urgent' || normStatus === 'critical') ? 'animate-ping' : ''
        }`}
      />
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
}

