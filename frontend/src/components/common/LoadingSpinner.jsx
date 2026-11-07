import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading data...', size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-slate-500 ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-blue-600 mb-2`} />
      {text && <p className="text-xs font-medium text-slate-500">{text}</p>}
    </div>
  );
}

