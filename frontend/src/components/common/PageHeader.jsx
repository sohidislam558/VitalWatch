import React from 'react';

export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
      <div>
        {breadcrumb && <div className="text-xs text-slate-500 mb-1">{breadcrumb}</div>}
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

