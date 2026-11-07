import React, { useState } from 'react';
import Modal from '../common/Modal';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import { canResolveAlerts } from '../../utils/permissions';
import { useAuth } from '../../hooks/useAuth';

export default function AlertAcknowledgeModal({
  isOpen,
  onClose,
  alert,
  onAcknowledge,
  onResolve,
  loading = false,
}) {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [mode, setMode] = useState('acknowledge'); // 'acknowledge' or 'resolve'

  if (!alert) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'resolve' && onResolve) {
      onResolve(alert.id, note);
    } else {
      onAcknowledge(alert.id, note);
    }
  };

  const isDoctorOrAdmin = canResolveAlerts(user);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clinical Alert Triage & Response"
      subtitle={`Alert ID: #${alert.id} &bull; ${alert.patient?.patient_code || 'Patient'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Alert Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-700">Priority Level:</span>
            <StatusBadge status={alert.priority} pulse />
          </div>
          <div className="text-slate-900 font-medium">{alert.message}</div>
          <div className="text-[11px] text-slate-500 mt-2">
            Patient: <strong>{alert.patient?.name}</strong> &bull;{' '}
            {alert.patient?.active_admission?.ward || 'General'} (Bed {alert.patient?.active_admission?.bed_number || 'N/A'})
          </div>
        </div>

        {/* Action Toggle if user is Doctor/Admin */}
        {isDoctorOrAdmin && (
          <div className="flex rounded-md bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('acknowledge')}
              className={`flex-1 py-1.5 font-medium rounded transition-colors ${
                mode === 'acknowledge' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600'
              }`}
            >
              Acknowledge Alert
            </button>
            <button
              type="button"
              onClick={() => setMode('resolve')}
              className={`flex-1 py-1.5 font-medium rounded transition-colors ${
                mode === 'resolve' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-600'
              }`}
            >
              Formally Resolve Alert
            </button>
          </div>
        )}

        <Textarea
          label={mode === 'resolve' ? 'Physician Resolution Findings & Outcome' : 'Bedside Clinical Review Notes'}
          id="triage_note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            mode === 'resolve'
              ? 'e.g. Bedside physician assessment completed. Oxygen therapy adjusted, vitals stabilizing.'
              : 'e.g. Ward nurse alerted, checking patient position and vital repetition...'
          }
          rows={3}
          required
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={mode === 'resolve' ? 'primary' : 'primary'}
            loading={loading}
          >
            {mode === 'resolve' ? 'Submit Alert Resolution' : 'Confirm Acknowledgement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

