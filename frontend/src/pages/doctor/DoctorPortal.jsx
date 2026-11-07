import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../services/settingsService';
import { alertService } from '../../services/alertService';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import PageContainer from '../../components/layout/PageContainer';
import SituationMonitor from '../../components/dashboard/SituationMonitor';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Textarea from '../../components/common/Textarea';
import {
  Stethoscope,
  AlertTriangle,
  Mail,
  CheckCircle2,
  RefreshCw,
  BellRing,
  Bed,
  Clock,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Ban,
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

  // Doctor in action confirmation state
  const [actionAlert, setActionAlert] = useState(null);
  const [doctorNote, setDoctorNote] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [patientsRes, alertsRes] = await Promise.all([
        dashboardService.getMonitoringPatients(),
        dashboardService.getActiveAlerts({ limit: 10 }),
      ]);

      setPatients(patientsRes.data?.data || []);
      setActiveAlerts(alertsRes.data || []);
    } catch {
      toast.error('Failed to load physician situation monitor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if this doctor is ALREADY attending a patient
  const currentAttendingAlert = activeAlerts.find(
    (a) =>
      a.status === 'doctor_in_action' &&
      a.acknowledgements?.some(
        (ack) => ack.user_id === user?.id && ack.action === 'doctor_in_action'
      )
  );

  const isDoctorBusy = !!currentAttendingAlert;

  // Handle Mark Doctor in Action
  const handleMarkDoctorInAction = async () => {
    if (!actionAlert) return;
    setActionSubmitting(true);
    try {
      await alertService.markDoctorInAction(
        actionAlert.id,
        doctorNote || `Dr. ${user?.name || 'Physician'} attending bedside.`
      );
      toast.success('Bedside attendance logged: Doctor in Action!');
      setActionAlert(null);
      setDoctorNote('');
      refreshAlerts();
      loadData(true);
    } catch (err) {
      const msg =
        err.response?.data?.errors?.doctor_in_action?.[0] ||
        err.response?.data?.message ||
        'Failed to start bedside action.';
      toast.error(msg, { duration: 6000 });
    } finally {
      setActionSubmitting(false);
    }
  };

  // Simple 1-Click: Assessment Done
  const handleAssessmentDone = async (alertId) => {
    setAssessmentSubmitting(true);
    try {
      await alertService.markAssessmentDone(alertId);
      toast.success('Bedside assessment completed! Case resolved and you are now available.');
      refreshAlerts();
      loadData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete assessment.');
    } finally {
      setAssessmentSubmitting(false);
    }
  };

  const emergencyAlerts = activeAlerts.filter((a) => a.status === 'active');
  const otherDoctorInActionAlerts = activeAlerts.filter(
    (a) => a.status === 'doctor_in_action' && a.id !== currentAttendingAlert?.id
  );

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

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-600' : 'text-slate-500'}`} />
          <span>{refreshing ? 'Updating Telemetry...' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {/* ACTIVE BEDSIDE ATTENDANCE CARD (When this doctor is currently in an action) */}
      {currentAttendingAlert && (
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
                  {currentAttendingAlert.patient?.name} •{' '}
                  <span className="text-slate-300 text-sm font-normal">
                    {currentAttendingAlert.patient?.active_admission?.ward} (Bed {currentAttendingAlert.patient?.active_admission?.bed_number})
                  </span>
                </h3>
                <div className="mt-1 text-xs text-blue-100 bg-white/10 px-3 py-1 rounded-lg border border-white/10 inline-block font-mono">
                  🚨 {currentAttendingAlert.message}
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
                onClick={() => handleAssessmentDone(currentAttendingAlert.id)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Assessment Done</span>
              </Button>
              <span className="text-[10px] text-slate-300 text-center sm:text-right">
                Simple 1-click completion & resolution
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
          <span>Active Emergencies:</span>
          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
            emergencyAlerts.length > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/30 text-emerald-300'
          }`}>
            {emergencyAlerts.length}
          </span>
        </div>
      </div>

      {/* EMERGENCY ATTENTION CENTER */}
      {emergencyAlerts.length > 0 && (
        <div className="mb-6 bg-red-50/70 border-2 border-red-300 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <h2 className="text-sm font-bold text-red-950 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Emergency Attention Alarms Requiring Physician Action
              </h2>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-200">
              {emergencyAlerts.length} Action Needed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {emergencyAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white p-4 rounded-xl border border-red-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{alert.patient?.name}</div>
                      <div className="text-xs text-slate-500">
                        {alert.patient?.active_admission?.ward || 'Ward'} • Bed {alert.patient?.active_admission?.bed_number || 'N/A'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-600 text-white animate-pulse">
                      Critical
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200/60 mb-2">
                    {alert.message}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Triggered at: {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Rule: {alert.alert_rule?.name || 'Threshold Rule'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Bedside attendance
                  </span>

                  {/* If doctor is already busy with another patient, disable button */}
                  {isDoctorBusy ? (
                    <button
                      type="button"
                      disabled
                      title={`You are currently attending ${currentAttendingAlert?.patient?.name}. Complete that assessment first.`}
                      className="px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed flex items-center gap-1.5 border border-slate-200"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Busy with Bed {currentAttendingAlert?.patient?.active_admission?.bed_number}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActionAlert(alert);
                        setDoctorNote(`Dr. ${user?.name || 'Physician'} attending bedside to manage: ${alert.message}`);
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all hover:scale-105"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>🩺 Mark Doctor in Action</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-[11px] text-red-800 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
            <span>
              Click <strong>'Doctor in Action'</strong> to attend. A doctor can attend only <strong>one patient at a time</strong>. Click <strong>'Assessment Done'</strong> when finished to resolve the alert.
            </span>
          </div>
        </div>
      )}

      {/* OTHER DOCTORS IN ACTION */}
      {otherDoctorInActionAlerts.length > 0 && (
        <div className="mb-6 bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Other Attending Physicians In Action ({otherDoctorInActionAlerts.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {otherDoctorInActionAlerts.map((alert) => (
              <div key={alert.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{alert.patient?.name}</div>
                <div className="text-[11px] text-slate-500">
                  {alert.patient?.active_admission?.ward} • Bed {alert.patient?.active_admission?.bed_number}
                </div>
                <div className="text-[10px] text-blue-700 font-semibold mt-1">
                  Bedside physician attending
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            The hospital roster is completely clean. When a bedside nurse registers and admits a patient to a ward, their situation telemetry will appear here for observation.
          </p>
        </div>
      ) : (
        <SituationMonitor
          patients={patients}
          loading={loading}
          onRefresh={() => loadData(true)}
          currentAttendingAlertId={currentAttendingAlert?.id}
          onAssessmentDone={handleAssessmentDone}
        />
      )}

      {/* Doctor in Action Confirmation Modal */}
      {actionAlert && (
        <Modal
          isOpen={!!actionAlert}
          onClose={() => setActionAlert(null)}
          title="Confirm Bedside Attendance"
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Active Alarm: {actionAlert.patient?.name}</span>
              </div>
              <div>{actionAlert.message}</div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
              <strong>Single-Patient Concurrency Notice:</strong> While you are attending this patient, you will not be able to select another patient until you click <strong>'Assessment Done'</strong>.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setActionAlert(null)} disabled={actionSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleMarkDoctorInAction}
                loading={actionSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                🩺 Confirm Doctor in Action
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
