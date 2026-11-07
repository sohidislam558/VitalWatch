import React from 'react';

export default function Select({
  label,
  id,
  options = [],
  error,
  helperText,
  placeholder = 'Select an option',
  className = '',
  required = false,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`block w-full rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white px-3 py-2 ${
          error
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}

