import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { calculateAge, formatDate } from '../../utils/formatDate';
import { Eye, Edit, Bed, Activity } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

export default function PatientTable({
  patients = [],
  loading = false,
  onAdmit,
}) {
  if (loading) {
    return <LoadingSpinner text="Loading patient registry..." />;
  }

  if (patients.length === 0) {
    return <EmptyState title="No patients found" description="Try clearing your search query." />;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Patient Name</th>
              <th className="px-4 py-3 text-left">Age / Gender</th>
              <th className="px-4 py-3 text-left">Current Ward</th>
              <th className="px-4 py-3 text-left">Bed</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {patients.map((p) => {
              const activeAdm = p.active_admission;
              const age = calculateAge(p.date_of_birth);

              return (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">
                    <Link to={`/patients/${p.id}`} className="hover:text-blue-600">
                      {p.patient_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {age} yrs &bull; <span className="capitalize">{p.gender}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {activeAdm?.ward || <span className="text-slate-400">Not Admitted</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono">
                    {activeAdm?.bed_number || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge
                      status={activeAdm ? 'admitted' : 'discharged'}
                      label={activeAdm ? 'Admitted' : 'Discharged'}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/patients/${p.id}`}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <Link
                        to={`/patients/${p.id}/edit`}
                        className="p-1 text-slate-500 hover:text-amber-600 rounded transition-colors"
                        title="Edit Demographics"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {activeAdm ? (
                        <Link
                          to={`/vitals/add?patient_id=${p.id}`}
                          className="p-1 text-slate-500 hover:text-emerald-600 rounded transition-colors"
                          title="Record Vitals"
                        >
                          <Activity className="w-4 h-4" />
                        </Link>
                      ) : onAdmit ? (
                        <button
                          type="button"
                          onClick={() => onAdmit(p)}
                          className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                          title="Admit to Ward"
                        >
                          <Bed className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

