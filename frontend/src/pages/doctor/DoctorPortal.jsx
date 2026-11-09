import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../services/settingsService';
import { alertService } from '../../services/alertService';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import { onTelemetryUpdate, broadcastTelemetryUpdate } from '../../utils/realtime';
import PageContainer from '../../components/layout/PageContainer';
import SituationMonitor from '../../components/dashboard/SituationMonitor';
import Button from '../../components/common/Button';
import {
  Stethoscope,
  Mail,
  CheckCircle2,
  RefreshCw,
  HeartPulse,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorPortal() {
  const { user } = useAuth();
  const { refreshAlerts } = useNotification();

  const [patients, setPatients] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [patientsRes, alertsRes] = await Promise.all([
        dashboardService.getMonitoringPatients(),
        dashboardService.getActiveAlerts({ limit: 50 }),
      ]);

      setPatients(patientsRes.data?.data || []);
      setActiveAlerts(alertsRes.data || []);
    } catch {
      if (!isSilent) {
        toast.error('Failed to load physician situation monitor.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + Real-time auto-sync (silent 2.5s poll + instant broadcast channel)
  useEffect(() => {
    loadData();

    // Silent background poll every 2.5s to ensure real-time update across all user portals
    const interval = setInterval(() => {
      loadData(true);
    }, 2500);

    // Instant cross-window event subscription (<50ms response)
    const unsubscribe = onTelemetryUpdate(() => {
      loadData(true);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [loadData]);

  // Check if this doctor is ALREADY attending a patient
  const myAttendingAlerts = activeAlerts.filter(
    (a) =>
      a.status === 'doctor_in_action' &&
      a.acknowledgements?.some(
        (ack) => ack.user_id === user?.id && ack.action === 'doctor_in_action'
      )
  );

  const currentAttendingPatient = myAttendingAlerts[0]?.patient;

  // Simple 1-Click: Assessment Done (resolves all alarms for this patient)
  const handleAssessmentDone = async (alertId) => {
    const targetId = alertId || myAttendingAlerts[0]?.id;
    if (!targetId) return;

    setAssessmentSubmitting(true);
    try {
      await alertService.markAssessmentDone(targetId);
      toast.success(
        'Bedside assessment completed! All alarms resolved and you are now available.'
      );
      broadcastTelemetryUpdate();
      refreshAlerts();
      loadData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete assessment.');
    } finally {
      setAssessmentSubmitting(false);
    }
  };

  // Count distinct patients with active emergency alarms
  const emergencyPatientCount = new Set(
    activeAlerts.filter((a) => a.status === 'active').map((a) => a.patient_id)
  ).size;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Attending Physician Situation Telemetry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome, <span className="font-semibold text-slate-700">Dr. {user?.name}</span> (MD) • Early Warning Response & Bedside Action
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Real-Time Sync</span>
          </span>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE BEDSIDE ATTENDANCE CARD (When this doctor is currently attending a patient) */}
      {currentAttendingPatient && (
        <div className="mb-6 p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border-2 border-blue-400/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 flex-shrink-0">
                <Stethoscope className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    Your Active Bedside Patient
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                    Doctor in Action
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {currentAttendingPatient.name} •{' '}
                  <span className="text-slate-300 text-sm font-normal">
                    {currentAttendingPatient.active_admission?.ward} (Bed {currentAttendingPatient.active_admission?.bed_number})
                  </span>
                </h3>

                {/* All alarms for this patient in this single box */}
                <div className="mt-2 space-y-1">
                  {myAttendingAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="text-xs text-blue-100 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 font-mono"
                    >
                      <span>🚨 {alert.message}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-[11px] text-blue-200">
                  <strong>Concurrency Policy:</strong> You are attending this patient. Complete assessment to release your focus for other patients.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch sm:items-end gap-1.5 self-stretch sm:self-auto">
              <Button
                variant="primary"
                size="lg"
                loading={assessmentSubmitting}
                onClick={() => handleAssessmentDone(myAttendingAlerts[0]?.id)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Assessment Done</span>
              </Button>
              <span className="text-[10px] text-slate-300 text-center sm:text-right">
                1-click completion: resolves all alarms for this patient
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gmail SMTP Real-time Alert Notification Banner */}
      <div className="p-4 bg-gradient-to-r from-cyan-900 to-slate-900 text-white rounded-2xl shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 flex-shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Gmail SMTP Emergency Dispatch Enabled</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              When vital signs cross critical early warning thresholds, automated email alerts are dispatched immediately to on-duty physicians.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs self-stretch sm:self-auto justify-between sm:justify-start">
          <span>Patients Needing Attention:</span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
              emergencyPatientCount > 0
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-emerald-500/30 text-emerald-300'
            }`}
          >
            {emergencyPatientCount}
          </span>
        </div>
      </div>

      {/* The Situation Monitor Header */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
          Hospital Patient Situation Monitor
        </h2>
        <p className="text-xs text-slate-500">
          Real-time patient telemetry and plain-English situation descriptions. Vital recording is reserved for bedside nurses.
        </p>
      </div>

      {/* Empty State when no patients are in the hospital */}
      {patients.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-4">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Patients Currently Admitted</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            The hospital roster is clean. When a bedside nurse registers and admits a patient to a ward, their situation telemetry will appear here for observation.
          </p>
        </div>
      ) : (
        <SituationMonitor
          patients={patients}
          loading={loading}
          onRefresh={() => loadData(true)}
          currentAttendingAlertId={myAttendingAlerts[0]?.id}
          onAssessmentDone={handleAssessmentDone}
        />
      )}
    </PageContainer>
  );
}
