import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">403 — Unauthorized Access</h1>
      <p className="text-xs text-slate-600 max-w-md mt-2 leading-relaxed">
        Your current staff role does not possess the clinical or administrative privileges required to access this system module.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="primary" icon={ArrowLeft}>
            Return to Hospital Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

