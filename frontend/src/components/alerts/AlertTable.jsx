import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { formatDateTime } from '../../utils/formatDate';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';

export default function AlertTable({
  alerts = [],
  loading = false,
  onOpenTriage,
}) {
  if (loading) {
    return <LoadingSpinner text="Loading hospital alerts..." />;
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        title="No alerts matching criteria"
        description="All monitored vital signs are currently within configured boundaries or filter returned no items."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3 text-left">Triggered At</th>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-left">Ward / Bed</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Alert Message</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Staff Triage Trail</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {alerts.map((a) => {
              const patient = a.patient;
              const acks = a.acknowledgements || [];

              return (
                <tr
                  key={a.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    a.status === 'active' && a.priority === 'urgent' ? 'bg-red-50/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {formatDateTime(a.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/patients/${a.patient_id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 font-mono"
                    >
                      {patient?.patient_code}
                    </Link>
                    <div className="text-slate-600 font-medium">{patient?.name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{patient?.active_admission?.ward || '—'}</div>
                    <div className="text-[10px] text-slate-400">Bed: {patient?.active_admission?.bed_number || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.priority} size="sm" pulse={a.status === 'active'} />
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium max-w-sm">
                    {a.message}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={a.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-600 max-w-xs">
                    {acks.length > 0 ? (
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800">
                          {acks[0].user?.name}:
                        </div>
                        <div className="italic text-slate-500 truncate">{acks[0].note || 'Acknowledged'}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pending staff review</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {a.status !== 'resolved' ? (
                      <button
                        type="button"
                        onClick={() => onOpenTriage(a)}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded text-xs font-semibold shadow-2xs"
                      >
                        Respond
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium">Resolved</span>
                    )}
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

