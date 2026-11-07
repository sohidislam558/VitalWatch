import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Failed to load information',
  message = 'An unexpected error occurred while communicating with the hospital backend API.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-lg border border-red-200">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-red-900">{title}</h4>
      <p className="text-xs text-red-700 max-w-sm mt-1">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-4 border-red-300 text-red-700 hover:bg-red-100" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

