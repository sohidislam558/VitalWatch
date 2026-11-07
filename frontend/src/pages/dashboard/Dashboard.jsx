import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import NursePortal from '../nurse/NursePortal';
import DoctorPortal from '../doctor/DoctorPortal';
import AdminPortal from '../admin/AdminPortal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [adminRoleOverride, setAdminRoleOverride] = useState(null);

  if (loading) {
    return (
      <div className="p-12">
        <LoadingSpinner text="Checking hospital staff authorization..." />
      </div>
    );
  }

  // Allow admin to preview other role portals
  const activeRole = adminRoleOverride || user?.role;

  return (
    <div>
      {/* Admin Role Preview Bar */}
      {user?.role === 'admin' && (
        <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Admin Perspective Switcher:</span>
            <span className="text-[11px] text-slate-400">Preview portal as seen by clinical roles</span>
          </div>
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800/80 p-0.5">
            <button
              onClick={() => setAdminRoleOverride(null)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                !adminRoleOverride ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin Master Feed
            </button>
            <button
              onClick={() => setAdminRoleOverride('doctor')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                adminRoleOverride === 'doctor' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Doctor View (Read-Only + Action)
            </button>
            <button
              onClick={() => setAdminRoleOverride('nurse')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                adminRoleOverride === 'nurse' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nurse View (Input Vitals + Monitor)
            </button>
          </div>
        </div>
      )}

      {/* Render dedicated role workspace */}
      {activeRole === 'nurse' && <NursePortal />}
      {activeRole === 'doctor' && <DoctorPortal />}
      {activeRole === 'admin' && <AdminPortal />}
      {!['nurse', 'doctor', 'admin'].includes(activeRole) && <AdminPortal />}
    </div>
  );
}
