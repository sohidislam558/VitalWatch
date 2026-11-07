import React from 'react';

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  loading = false,
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      iconText: 'text-blue-600',
      border: 'border-blue-100',
    },
    red: {
      bg: 'bg-red-50',
      iconText: 'text-red-600',
      border: 'border-red-100',
    },
    amber: {
      bg: 'bg-amber-50',
      iconText: 'text-amber-600',
      border: 'border-amber-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      iconText: 'text-emerald-600',
      border: 'border-emerald-100',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`p-5 bg-white rounded-lg border ${scheme.border} shadow-xs flex items-start justify-between`}>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className="mt-2 flex items-baseline gap-2">
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
          ) : (
            <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className={`p-3 rounded-lg ${scheme.bg} ${scheme.iconText}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

