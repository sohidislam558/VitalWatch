import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatDateTime } from '../../utils/formatDate';

export default function AlertSummary({ alerts = [], loading = false, onAcknowledge }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-100 rounded" />
          <div className="h-16 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-slate-800">Priority Clinical Alerts</h3>
        </div>
        <Link
          to="/alerts"
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            No active early warning alerts right now.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 transition-colors flex items-start justify-between gap-3 ${
                alert.priority === 'urgent' ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.priority === 'urgent' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/patients/${alert.patient_id}`}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600"
                    >
                      {alert.patient?.patient_code} — {alert.patient?.name}
                    </Link>
                    <StatusBadge status={alert.priority} size="sm" pulse />
                  </div>
                  <p className="text-xs text-slate-700 mt-1 font-medium">{alert.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {alert.patient?.active_admission?.ward || 'Ward'} &bull; Bed{' '}
                    {alert.patient?.active_admission?.bed_number || 'N/A'} &bull;{' '}
                    {formatDateTime(alert.created_at)}
                  </p>
                </div>
              </div>

              {onAcknowledge && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(alert)}
                  className="text-xs text-blue-600 hover:text-blue-800 bg-white border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded shadow-2xs font-medium flex-shrink-0"
                >
                  Triage
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

