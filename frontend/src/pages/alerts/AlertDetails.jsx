import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { alertService } from '../../services/alertService';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatDate';
import { AlertTriangle, Clock, User, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlertDetails() {
  const { id } = useParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await alertService.getAlert(id);
        setAlert(res.data);
      } catch {
        toast.error('Alert details not found.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Retrieving alert triage trail..." />
      </PageContainer>
    );
  }

  if (!alert) return null;

  const acks = alert.acknowledgements || [];

  return (
    <PageContainer>
      <PageHeader
        title={`Alert #${alert.id} Inspection`}
        subtitle={`Triggered: ${formatDateTime(alert.created_at)}`}
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              alert.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{alert.message}</h3>
              <p className="text-xs text-slate-500">
                Rule: {alert.alert_rule?.name || 'Threshold Rule'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={alert.priority} size="md" pulse />
            <StatusBadge status={alert.status} size="md" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Monitored Patient</span>
            <Link to={`/patients/${alert.patient_id}`} className="text-blue-600 font-bold hover:underline">
              {alert.patient?.name} ({alert.patient?.patient_code})
            </Link>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Ward Location</span>
            <strong className="text-slate-800">
              {alert.patient?.active_admission?.ward || 'General'} (Bed {alert.patient?.active_admission?.bed_number || 'N/A'})
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Trigger Measurement Time</span>
            <strong className="text-slate-800">{formatDateTime(alert.vital_record?.measured_at)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Recorded By</span>
            <strong className="text-slate-800">{alert.vital_record?.recorder?.name || 'Staff'}</strong>
          </div>
        </div>
      </div>

      {/* Staff Triage Audit Log */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Staff Response & Triage Audit Trail</h3>
        </div>

        {acks.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No triage actions have been recorded yet for this alert.</p>
        ) : (
          <div className="space-y-4">
            {acks.map((ack) => (
              <div key={ack.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {ack.user?.name} ({ack.user?.role?.toUpperCase()})
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ack.action} size="sm" />
                    <span className="text-[11px] text-slate-400">{formatDateTime(ack.created_at)}</span>
                  </div>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">{ack.note || 'Acknowledged with no comment.'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

