import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../services/settingsService';
import { alertService } from '../../services/alertService';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import PageContainer from '../../components/layout/PageContainer';
import SituationMonitor from '../../components/dashboard/SituationMonitor';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import {
  Stethoscope,
  AlertTriangle,
  Mail,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldAlert,
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

  // Doctor in action confirmation state (grouped by patient)
  const [actionPatientGroup, setActionPatientGroup] = useState(null);
  const [doctorNote, setDoctorNote] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
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
      toast.error('Failed to load physician situation monitor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if this doctor is ALREADY attending a patient (gathering all alerts for that patient)
  const myAttendingAlerts = activeAlerts.filter(
    (a) =>
      a.status === 'doctor_in_action' &&
      a.acknowledgements?.some(
        (ack) => ack.user_id === user?.id && ack.action === 'doctor_in_action'
      )
  );

  const currentAttendingPatient = myAttendingAlerts[0]?.patient;
  const isDoctorBusy = myAttendingAlerts.length > 0;

  // Group active emergency alerts by patient so that there is EXACTLY ONE BOX FOR ONE PATIENT
  const emergencyPatients = Object.values(
    activeAlerts
      .filter((a) => a.status === 'active')
      .reduce((acc, alert) => {
        const patientId = alert.patient_id || alert.patient?.id;
        if (!patientId) return acc;
        if (!acc[patientId]) {
          acc[patientId] = {
            patient: alert.patient,
            patientId,
            alerts: [],
            primaryAlert: alert,
            hasUrgent: false,
          };
        }
        acc[patientId].alerts.push(alert);
        if (alert.priority === 'urgent') {
          acc[patientId].hasUrgent = true;
        }
        return acc;
      }, {})
  );

  // Group alerts attended by OTHER doctors by patient (one box per patient)
  const otherDoctorInActionPatients = Object.values(
    activeAlerts
      .filter(
        (a) =>
          a.status === 'doctor_in_action' &&
          !myAttendingAlerts.some((ma) => ma.id === a.id)
      )
      .reduce((acc, alert) => {
        const patientId = alert.patient_id || alert.patient?.id;
        if (!patientId) return acc;
        if (!acc[patientId]) {
          const attendingDoctor = alert.acknowledgements?.find(
            (ack) => ack.action === 'doctor_in_action'
          )?.user?.name;
          acc[patientId] = {
            patient: alert.patient,
            patientId,
            alerts: [],
            attendingDoctor: attendingDoctor ? `Dr. ${attendingDoctor}` : 'Attending Physician',
          };
        }
        acc[patientId].alerts.push(alert);
        return acc;
      }, {})
  );

  // Handle Mark Doctor in Action: marks all active alerts for this patient in one go
  const handleMarkDoctorInAction = async () => {
    if (!actionPatientGroup) return;
    setActionSubmitting(true);
    try {
      await alertService.markDoctorInAction(
        actionPatientGroup.primaryAlert.id,
        doctorNote ||
          `Dr. ${user?.name || 'Physician'} attending bedside for ${actionPatientGroup.patient?.name}.`
      );
      toast.success(
        `Bedside attendance logged: Doctor in Action for ${actionPatientGroup.patient?.name}!`
      );
      setActionPatientGroup(null);
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

  // Simple 1-Click: Assessment Done (resolves all alerts for this patient)
  const handleAssessmentDone = async (alertId) => {
    const targetId = alertId || myAttendingAlerts[0]?.id;
    if (!targetId) return;

    setAssessmentSubmitting(true);
    try {
      await alertService.markAssessmentDone(targetId);
      toast.success(
        'Bedside assessment completed! All alarms resolved and you are now available.'
      );
      refreshAlerts();
      loadData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete assessment.');
    } finally {
      setAssessmentSubmitting(false);
    }
  };

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
              emergencyPatients.length > 0
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-emerald-500/30 text-emerald-300'
            }`}
          >
            {emergencyPatients.length}
          </span>
        </div>
      </div>

      {/* EMERGENCY ATTENTION CENTER — ONE BOX PER PATIENT */}
      {emergencyPatients.length > 0 && (
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
              {emergencyPatients.length} Patient{emergencyPatients.length > 1 ? 's' : ''} Need Action
            </span>
          </div>

          {/* Grid of Patient Boxes: ONE BOX FOR ONE PATIENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyPatients.map((group) => {
              const patient = group.patient;
              const admission = patient?.active_admission;

              return (
                <div
                  key={group.patientId}
                  className="bg-white p-4 rounded-xl border-2 border-red-200 shadow-sm flex flex-col justify-between hover:border-red-300 transition-colors"
                >
                  <div>
                    {/* Top Row: Patient Info & Bed */}
                    <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-slate-900">
                            {patient?.name}
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {patient?.patient_code}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {admission?.ward || 'Ward'} •{' '}
                          <span className="font-semibold text-slate-700">
                            Bed {admission?.bed_number || 'N/A'}
                          </span>{' '}
                          • {admission?.diagnosis || 'Inpatient Observation'}
                        </div>
                      </div>

                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-red-600 text-white animate-pulse flex-shrink-0">
                        {group.hasUrgent ? 'Critical Alarm' : 'Attention Needed'}
                      </span>
                    </div>

                    {/* Vitals Disbalances Container: ALL UNSTABLE VITALS IN THIS SINGLE BOX */}
                    <div className="space-y-1.5 my-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-red-600" />
                        <span>
                          Unstable Vitals Disbalance ({group.alerts.length}):
                        </span>
                      </div>

                      {group.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="text-xs font-semibold text-red-900 bg-red-50 p-2.5 rounded-lg border border-red-200/80 flex items-start gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div>{alert.message}</div>
                            <div className="text-[10px] text-red-700/80 font-normal mt-0.5 flex items-center gap-2">
                              <span>Rule: {alert.alert_rule?.name || 'Threshold Rule'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {new Date(alert.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer: EXACTLY ONE "Doctor in Action" button for this patient */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Physician response required
                    </span>

                    {isDoctorBusy ? (
                      <button
                        type="button"
                        disabled
                        title={`You are currently attending ${currentAttendingPatient?.name}. Complete that assessment first.`}
                        className="px-3.5 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed flex items-center gap-1.5 border border-slate-200"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>
                          Busy with Bed {currentAttendingPatient?.active_admission?.bed_number}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActionPatientGroup(group);
                          setDoctorNote(
                            `Dr. ${user?.name || 'Physician'} attending bedside to manage: ${group.alerts
                              .map((a) => a.message)
                              .join('; ')}`
                          );
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all hover:scale-105"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>🩺 Mark Doctor in Action</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[11px] text-red-800 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
            <span>
              Click <strong>'Doctor in Action'</strong> to attend. A doctor can attend only <strong>one patient at a time</strong>. Click <strong>'Assessment Done'</strong> when finished to resolve all alarms.
            </span>
          </div>
        </div>
      )}

      {/* OTHER DOCTORS IN ACTION — ALSO GROUPED ONE BOX PER PATIENT */}
      {otherDoctorInActionPatients.length > 0 && (
        <div className="mb-6 bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Other Attending Physicians In Action ({otherDoctorInActionPatients.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {otherDoctorInActionPatients.map((group) => (
              <div
                key={group.patientId}
                className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">{group.patient?.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {group.patient?.active_admission?.ward} • Bed {group.patient?.active_admission?.bed_number}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600">
                    {group.alerts.length} alarm{group.alerts.length > 1 ? 's' : ''} being managed
                  </div>
                </div>
                <div className="text-[10px] text-blue-700 font-semibold mt-2 pt-1 border-t border-slate-100 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-blue-600" />
                  <span>Attended by {group.attendingDoctor}</span>
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

      {/* Doctor in Action Confirmation Modal (for the entire patient) */}
      {actionPatientGroup && (
        <Modal
          isOpen={!!actionPatientGroup}
          onClose={() => setActionPatientGroup(null)}
          title={`Confirm Bedside Attendance: ${actionPatientGroup.patient?.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>
                  Active Emergency Alarms ({actionPatientGroup.alerts.length}):
                </span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {actionPatientGroup.alerts.map((a) => (
                  <li key={a.id} className="font-semibold">
                    {a.message}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
              <strong>Single-Patient Attendance Notice:</strong> You will be actively registered as the attending bedside physician for <strong>{actionPatientGroup.patient?.name}</strong>. While attending, you will not be able to select another patient until you click <strong>'Assessment Done'</strong>.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setActionPatientGroup(null)}
                disabled={actionSubmitting}
              >
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
