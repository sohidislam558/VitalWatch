import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">404 — Clinical Resource Not Found</h1>
      <p className="text-xs text-slate-600 max-w-md mt-2">
        The patient record, clinical route, or page you are attempting to view does not exist.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="primary" icon={ArrowLeft}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

