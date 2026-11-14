import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import { alertService } from '../../services/alertService';
import { vitalService } from '../../services/vitalService';
import { admissionService } from '../../services/admissionService';
import {
  Activity,
  Heart,
  Droplets,
  Thermometer,
  Wind,
  Clock,
  Bed,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  PlusCircle,
  Eye,
  TrendingUp,
  X,
  FileText,
  Search,
  Ban,
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Modal from '../common/Modal';
import { formatDoctorName, formatNurseName } from '../../utils/formatUser';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { WARDS } from '../../utils/constants';
import { broadcastTelemetryUpdate } from '../../utils/realtime';
import toast from 'react-hot-toast';

export default function SituationMonitor({
  patients = [],
  loading = false,
  onRefresh,
  onAssessmentDone,
  onOpenRegisterPatient,
}) {
  const { user } = useAuth();
  const { refreshAlerts } = useNotification();

  // Filters
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Doctor in Action Modal state
  const [actionAlert, setActionAlert] = useState(null);
  const [actionPatient, setActionPatient] = useState(null);
  const [doctorNote, setDoctorNote] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);

  // Emergency ICU Transfer states
  const [icuTransferPatient, setIcuTransferPatient] = useState(null);
  const [icuTransferWard, setIcuTransferWard] = useState('Intensive Care Unit (ICU)');
  const [icuTransferBed, setIcuTransferBed] = useState('');
  const [icuAvailableBeds, setIcuAvailableBeds] = useState([]);
  const [icuLoadingBeds, setIcuLoadingBeds] = useState(false);
  const [icuSubmitting, setIcuSubmitting] = useState(false);
  const [requestingIcuId, setRequestingIcuId] = useState(null);

  // Ward Step-Down Transfer states (Reverse ICU -> General Ward)
  const [stepDownPatient, setStepDownPatient] = useState(null);
  const [stepDownWard, setStepDownWard] = useState('General Medical Ward');
  const [stepDownBed, setStepDownBed] = useState('');
  const [stepDownAvailableBeds, setStepDownAvailableBeds] = useState([]);
  const [stepDownLoadingBeds, setStepDownLoadingBeds] = useState(false);
  const [stepDownSubmitting, setStepDownSubmitting] = useState(false);
  const [requestingStepDownId, setRequestingStepDownId] = useState(null);

  // Quick Vital Entry Modal state (for Nurse / Admin)
  const [vitalEntryPatient, setVitalEntryPatient] = useState(null);
  const [vitalForm, setVitalForm] = useState({
    heart_rate: '',
    systolic_bp: '',
    diastolic_bp: '',
    spo2: '',
    temperature: '',
    respiratory_rate: '',
    clinical_notes: '',
  });
  const [vitalSubmitting, setVitalSubmitting] = useState(false);

  // Helper to format request timestamp and elapsed waiting duration
  const formatQueueTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const minsAgo = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (minsAgo === 0) return `${time} (Just now)`;
    if (minsAgo < 60) return `${time} (${minsAgo}m ago)`;
    const hoursAgo = Math.floor(minsAgo / 60);
    return `${time} (${hoursAgo}h ago)`;
  };

  // FIFO Queue for Emergency ICU Transfers: Ordered strictly by earliest requested time (Priority #1 = earliest request)
  const icuTransferQueue = [...patients]
    .filter((p) => p.active_admission?.icu_transfer_requested)
    .sort((a, b) => {
      const timeA = new Date(a.active_admission?.icu_transfer_requested_at || a.created_at || 0).getTime();
      const timeB = new Date(b.active_admission?.icu_transfer_requested_at || b.created_at || 0).getTime();
      return timeA - timeB;
    });

  // FIFO Queue for Ward Step-Down Transfers: Ordered strictly by earliest requested time (Priority #1 = earliest request)
  const stepDownQueue = [...patients]
    .filter((p) => p.active_admission?.step_down_requested)
    .sort((a, b) => {
      const timeA = new Date(a.active_admission?.step_down_requested_at || a.created_at || 0).getTime();
      const timeB = new Date(b.active_admission?.step_down_requested_at || b.created_at || 0).getTime();
      return timeA - timeB;
    });

  // Derive unique wards from constants and currently admitted patients
  const availableWards = Array.from(
    new Set([...WARDS, ...patients.map((p) => p.active_admission?.ward).filter(Boolean)])
  );

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    // Search query
    const query = search.toLowerCase();
    const nameMatch = patient.name?.toLowerCase().includes(query);
    const codeMatch = patient.patient_code?.toLowerCase().includes(query);
    const bedMatch = patient.active_admission?.bed_number?.toLowerCase().includes(query);
    if (query && !nameMatch && !codeMatch && !bedMatch) return false;

    // Ward filter
    if (wardFilter !== 'all' && patient.active_admission?.ward !== wardFilter) return false;

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'emergency' && patient.situation_status !== 'emergency') return false;
      if (statusFilter === 'doctor_in_action' && patient.situation_status !== 'doctor_in_action') return false;
      if (statusFilter === 'review' && patient.situation_status !== 'review') return false;
      if (statusFilter === 'stable' && !['stable', 'icu_observation'].includes(patient.situation_status)) return false;
      if (statusFilter === 'icu_observation' && patient.situation_status !== 'icu_observation') return false;
    }

    return true;
  });

  // Role permissions
  const isDoctor = user?.role === 'doctor';
  const isNurse = user?.role === 'nurse';
  const isAdmin = user?.role === 'admin';
  const canInputVitals = isNurse;
  const canTakeDoctorAction = isDoctor;

  // Check if this doctor is ALREADY attending a patient (single-patient concurrency)
  const myAttendingAlert = patients
    .flatMap((p) => p.alerts || [])
    .find(
      (a) =>
        a.status === 'doctor_in_action' &&
        a.acknowledgements?.some(
          (ack) => ack.user_id === user?.id && ack.action === 'doctor_in_action'
        )
    );
  const isCurrentDoctorBusy = !!myAttendingAlert;

  // Handler: Doctor in Action submission
  const handleConfirmDoctorInAction = async () => {
    if (!actionAlert) return;
    setActionSubmitting(true);
    try {
      await alertService.markDoctorInAction(
        actionAlert.id,
        doctorNote || `${formatDoctorName(user?.name)} actively attending bedside.`
      );
      toast.success('Bedside attendance logged: Doctor in Action!');
      setActionAlert(null);
      setActionPatient(null);
      setDoctorNote('');
      broadcastTelemetryUpdate();
      refreshAlerts();
      if (onRefresh) onRefresh();
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
    if (onAssessmentDone) {
      return onAssessmentDone(alertId);
    }
    setAssessmentSubmitting(true);
    try {
      await alertService.markAssessmentDone(alertId);
      toast.success('Bedside assessment completed! Emergency resolved.');
      broadcastTelemetryUpdate();
      refreshAlerts();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete assessment.');
    } finally {
      setAssessmentSubmitting(false);
    }
  };

  // 1-Click: Doctor requests Immediate Emergency ICU Transfer
  const handleRequestIcuTransfer = async (patient) => {
    const admissionId = patient.active_admission?.id;
    if (!admissionId) {
      toast.error('No active admission found for this patient.');
      return;
    }

    setRequestingIcuId(patient.id);
    try {
      await admissionService.requestIcuTransfer(admissionId, {
        notes: `Immediate ICU transfer requested by ${formatDoctorName(user?.name)}. Patient condition deteriorating.`,
        target_ward: 'Intensive Care Unit (ICU)',
      });
      toast.success(
        '🚨 Emergency ICU transfer requested! Ward nurses and administration alerted.',
        { duration: 6000 }
      );
      broadcastTelemetryUpdate();
      refreshAlerts();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request ICU transfer.');
    } finally {
      setRequestingIcuId(null);
    }
  };

  // Open ICU Bed Allocation Modal (Nurse / Admin)
  const openIcuTransferModal = (patient) => {
    setIcuTransferPatient(patient);
    const targetWard = patient.active_admission?.target_icu_ward || 'Intensive Care Unit (ICU)';
    setIcuTransferWard(targetWard);
    fetchIcuBeds(targetWard);
  };

  const fetchIcuBeds = async (ward) => {
    setIcuLoadingBeds(true);
    try {
      const res = await admissionService.getBeds(ward);
      const available = res.data?.available_beds || [];
      setIcuAvailableBeds(available);
      setIcuTransferBed(available[0] || '');
    } catch {
      toast.error('Failed to load available ICU beds.');
    } finally {
      setIcuLoadingBeds(false);
    }
  };

  const handleCompleteIcuTransfer = async (e) => {
    e.preventDefault();
    if (!icuTransferPatient || !icuTransferBed) {
      toast.error('Please select an available ICU bed.');
      return;
    }

    setIcuSubmitting(true);
    try {
      await admissionService.completeIcuTransfer(icuTransferPatient.active_admission?.id, {
        ward: icuTransferWard,
        bed_number: icuTransferBed,
      });
      toast.success(
        `Patient ${icuTransferPatient.name} successfully transferred to ${icuTransferWard} (${icuTransferBed})!`,
        { duration: 6000 }
      );
      setIcuTransferPatient(null);
      broadcastTelemetryUpdate();
      refreshAlerts();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete ICU transfer.');
    } finally {
      setIcuSubmitting(false);
    }
  };

  // List of candidate non-ICU wards for step-down de-escalation
  const STEP_DOWN_WARDS = [
    'General Medical Ward',
    'Telemetry Observation',
    'Surgical Recovery',
    'Respiratory Care Unit',
    'Pediatric Ward',
  ];

  // 1-Click: Doctor/Admin requests Step-Down from ICU back to a general ward
  const handleRequestStepDown = async (patient) => {
    const admissionId = patient.active_admission?.id;
    if (!admissionId) {
      toast.error('No active admission found for this patient.');
      return;
    }

    setRequestingStepDownId(patient.id);
    try {
      await admissionService.requestStepDown(admissionId, {
        notes: `Step-down to general ward requested by ${formatDoctorName(user?.name)}. Patient condition is stable.`,
        target_ward: 'General Medical Ward',
      });
      toast.success(
        '🏥 Ward step-down requested! Patient queued for general bed allocation.',
        { duration: 5000 }
      );
      broadcastTelemetryUpdate();
      refreshAlerts();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request ward step-down.');
    } finally {
      setRequestingStepDownId(null);
    }
  };

  // Open Step-Down Bed Allocation Modal (Nurse / Admin)
  const openStepDownModal = (patient) => {
    setStepDownPatient(patient);
    const targetWard = patient.active_admission?.target_step_down_ward || 'General Medical Ward';
    setStepDownWard(targetWard);
    fetchStepDownBeds(targetWard);
  };

  const fetchStepDownBeds = async (ward) => {
    setStepDownLoadingBeds(true);
    try {
      const res = await admissionService.getBeds(ward);
      const available = res.data?.available_beds || [];
      setStepDownAvailableBeds(available);
      setStepDownBed(available[0] || '');
    } catch {
      toast.error('Failed to load available general ward beds.');
    } finally {
      setStepDownLoadingBeds(false);
    }
  };

  // Complete Step-Down Bed Allocation
  const handleCompleteStepDown = async (e) => {
    e.preventDefault();
    if (!stepDownPatient || !stepDownBed) {
      toast.error('Please select an available ward bed.');
      return;
    }

    setStepDownSubmitting(true);
    try {
      await admissionService.completeStepDown(stepDownPatient.active_admission?.id, {
        ward: stepDownWard,
        bed_number: stepDownBed,
      });
      toast.success(
        `Patient ${stepDownPatient.name} successfully stepped down to ${stepDownWard} (${stepDownBed})!`,
        { duration: 6000 }
      );
      setStepDownPatient(null);
      broadcastTelemetryUpdate();
      refreshAlerts();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete ward step-down.');
    } finally {
      setStepDownSubmitting(false);
    }
  };

  // Handler: Quick Vital Entry Submission (Nurse)
  const handleQuickVitalSubmit = async (e) => {
    e.preventDefault();
    if (!vitalEntryPatient) return;

    setVitalSubmitting(true);
    try {
      const payload = {
        patient_id: vitalEntryPatient.id,
        admission_id: vitalEntryPatient.active_admission?.id,
        heart_rate: Number(vitalForm.heart_rate),
        systolic_bp: Number(vitalForm.systolic_bp),
        diastolic_bp: Number(vitalForm.diastolic_bp),
        spo2: Number(vitalForm.spo2),
        temperature: Number(vitalForm.temperature),
        respiratory_rate: Number(vitalForm.respiratory_rate),
        clinical_notes: vitalForm.clinical_notes || undefined,
        measured_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      const res = await vitalService.recordVitals(payload);
      const alertsTriggered = res.data?.alerts_triggered || [];

      if (alertsTriggered.length > 0) {
        toast(
          `Vitals recorded. ${alertsTriggered.length} critical alert(s) triggered! Attending Doctor notified via Gmail SMTP.`,
          { icon: '🚨', duration: 7000 }
        );
      } else {
        toast.success(
          'Vital signs recorded! Patient situation updated to Normal & Stable. Any previous alarms auto-resolved.'
        );
      }

      setVitalEntryPatient(null);
      setVitalForm({
        heart_rate: '',
        systolic_bp: '',
        diastolic_bp: '',
        spo2: '',
        temperature: '',
        respiratory_rate: '',
        clinical_notes: '',
      });
      broadcastTelemetryUpdate();
      refreshAlerts();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record vital signs.');
    } finally {
      setVitalSubmitting(false);
    }
  };

  // Pre-fill normal vitals helper
  const fillNormalPreset = () => {
    setVitalForm({
      heart_rate: '72',
      systolic_bp: '120',
      diastolic_bp: '80',
      spo2: '98',
      temperature: '36.8',
      respiratory_rate: '16',
      clinical_notes: 'Patient resting comfortably. Normal follow-up reading.',
    });
  };

  // Pre-fill critical vitals helper (for testing emergency alarms)
  const fillCriticalPreset = () => {
    setVitalForm({
      heart_rate: '138',
      systolic_bp: '165',
      diastolic_bp: '98',
      spo2: '88',
      temperature: '39.1',
      respiratory_rate: '26',
      clinical_notes: 'Bedside nurse observed acute respiratory distress and severe tachycardia.',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner text="Loading hospital telemetry & situation monitor..." />
      </div>
    );
  }

  // Clean empty state when 0 patients are admitted
  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <Bed className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">No Patients Currently Admitted</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          The hospital situation monitor is blank. When a registered bedside nurse registers and admits a patient to a ward, their real-time telemetry and situation status will appear here.
        </p>
        {isNurse && onOpenRegisterPatient && (
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={onOpenRegisterPatient}
              className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register & Admit First Patient</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Count summaries for status pills
  const counts = {
    emergency: patients.filter((p) => p.situation_status === 'emergency').length,
    doctor_in_action: patients.filter((p) => p.situation_status === 'doctor_in_action').length,
    review: patients.filter((p) => p.situation_status === 'review').length,
    stable: patients.filter((p) => ['stable', 'icu_observation'].includes(p.situation_status)).length,
    icu_observation: patients.filter((p) => p.situation_status === 'icu_observation').length,
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name, code, or bed..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ward filter */}
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Wards</option>
            {availableWards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          {/* Status filter pills */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/60 p-0.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({patients.length})
            </button>
            <button
              onClick={() => setStatusFilter('emergency')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'emergency'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              Emergency ({counts.emergency})
            </button>
            <button
              onClick={() => setStatusFilter('doctor_in_action')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'doctor_in_action'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              In Action ({counts.doctor_in_action})
            </button>
            <button
              onClick={() => setStatusFilter('review')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'review'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Attention ({counts.review})
            </button>
            <button
              onClick={() => setStatusFilter('stable')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'stable'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Stable ({counts.stable})
            </button>
            {counts.icu_observation > 0 && (
              <button
                onClick={() => setStatusFilter('icu_observation')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  statusFilter === 'icu_observation'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                ICU Obs ({counts.icu_observation})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PENDING EMERGENCY ICU TRANSFERS FIFO PRIORITY QUEUE BANNER */}
      {icuTransferQueue.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 text-white shadow-lg shadow-red-600/25 border border-red-500 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg flex-shrink-0 animate-pulse">
                🚑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-200">
                    🚨 Immediate Action Required: Emergency ICU Bed Allocation Queue
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-white font-mono text-[10px] font-bold">
                    {icuTransferQueue.length} {icuTransferQueue.length === 1 ? 'Patient Waiting' : 'Patients Waiting'}
                  </span>
                </div>
                <div className="text-xs text-red-100 mt-0.5">
                  <strong>FIFO Priority Queue:</strong> Patients are queued in strict chronological order by doctor request time. The patient requested first holds #1 Priority.
                </div>
              </div>
            </div>

            {(isNurse || isAdmin) && (
              <button
                type="button"
                onClick={() => openIcuTransferModal(icuTransferQueue[0])}
                className="px-3.5 py-2 rounded-lg bg-white text-red-700 hover:bg-red-50 text-xs font-extrabold shadow-md flex-shrink-0 cursor-pointer transition-all hover:scale-105"
              >
                Allocate Bed for Priority #1 ({icuTransferQueue[0].name})
              </button>
            )}
          </div>

          {/* Individual Queue Items in Priority Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {icuTransferQueue.map((patient, index) => {
              const isFirstPriority = index === 0;
              const requestedAt = patient.active_admission?.icu_transfer_requested_at;
              return (
                <div
                  key={patient.id}
                  className={`p-3 rounded-lg flex flex-col justify-between gap-2 border transition-all ${
                    isFirstPriority
                      ? 'bg-white/15 border-white/40 ring-1 ring-white/30'
                      : 'bg-black/15 border-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          isFirstPriority
                            ? 'bg-white text-red-700 shadow-xs'
                            : 'bg-red-950/60 text-red-200 border border-red-400/30'
                        }`}
                      >
                        Priority #{index + 1} {isFirstPriority && '• 1st in Queue'}
                      </span>
                      {requestedAt && (
                        <span className="text-[10px] text-red-200 font-mono">
                          {formatQueueTime(requestedAt)}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-white truncate">
                      {patient.name}{' '}
                      <span className="text-red-200 font-normal text-xs">
                        ({patient.patient_code})
                      </span>
                    </div>
                    <div className="text-[11px] text-red-100 mt-0.5">
                      Current: {patient.active_admission?.ward} • Bed {patient.active_admission?.bed_number}
                    </div>
                    <div className="text-[10px] text-red-200 italic mt-0.5">
                      Target: {patient.active_admission?.target_icu_ward || 'Intensive Care Unit (ICU)'}
                    </div>
                  </div>

                  {(isNurse || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => openIcuTransferModal(patient)}
                      className={`w-full py-1.5 px-2.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isFirstPriority
                          ? 'bg-white text-red-700 hover:bg-red-50 shadow-sm'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <span>Allocate Bed (Priority #{index + 1})</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PENDING WARD STEP-DOWN TRANSFERS FIFO PRIORITY QUEUE BANNER */}
      {stepDownQueue.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white shadow-lg shadow-teal-700/20 border border-teal-500 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg flex-shrink-0">
                🏥
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200">
                    Ready for Ward Step-Down • General Bed Allocation Queue
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-white font-mono text-[10px] font-bold">
                    {stepDownQueue.length} {stepDownQueue.length === 1 ? 'Patient Waiting' : 'Patients Waiting'}
                  </span>
                </div>
                <div className="text-xs text-teal-100 mt-0.5">
                  <strong>FIFO Priority Queue:</strong> Step-down allocation is strictly prioritized by earliest doctor request time. Earliest request holds #1 Priority.
                </div>
              </div>
            </div>

            {(isNurse || isAdmin) && (
              <button
                type="button"
                onClick={() => openStepDownModal(stepDownQueue[0])}
                className="px-3.5 py-2 rounded-lg bg-white text-teal-800 hover:bg-teal-50 text-xs font-extrabold shadow-md flex-shrink-0 cursor-pointer transition-all hover:scale-105"
              >
                Allocate Bed for Priority #1 ({stepDownQueue[0].name})
              </button>
            )}
          </div>

          {/* Individual Step-Down Queue Items in Priority Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {stepDownQueue.map((patient, index) => {
              const isFirstPriority = index === 0;
              const requestedAt = patient.active_admission?.step_down_requested_at;
              return (
                <div
                  key={patient.id}
                  className={`p-3 rounded-lg flex flex-col justify-between gap-2 border transition-all ${
                    isFirstPriority
                      ? 'bg-white/15 border-white/40 ring-1 ring-white/30'
                      : 'bg-black/15 border-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          isFirstPriority
                            ? 'bg-white text-teal-800 shadow-xs'
                            : 'bg-teal-950/60 text-teal-200 border border-teal-400/30'
                        }`}
                      >
                        Priority #{index + 1} {isFirstPriority && '• 1st in Queue'}
                      </span>
                      {requestedAt && (
                        <span className="text-[10px] text-teal-200 font-mono">
                          {formatQueueTime(requestedAt)}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-white truncate">
                      {patient.name}{' '}
                      <span className="text-teal-200 font-normal text-xs">
                        ({patient.patient_code})
                      </span>
                    </div>
                    <div className="text-[11px] text-teal-100 mt-0.5">
                      Current: {patient.active_admission?.ward} • Bed {patient.active_admission?.bed_number}
                    </div>
                    <div className="text-[10px] text-teal-200 italic mt-0.5">
                      Target: {patient.active_admission?.target_step_down_ward || 'General Medical Ward'}
                    </div>
                  </div>

                  {(isNurse || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => openStepDownModal(patient)}
                      className={`w-full py-1.5 px-2.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isFirstPriority
                          ? 'bg-white text-teal-800 hover:bg-teal-50 shadow-sm'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <span>Allocate Bed (Priority #{index + 1})</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient Situation Cards Grid */}
      {filteredPatients.length === 0 ? (
        <EmptyState
          title="No patients match current filter"
          description="Try selecting a different status filter or clearing your search term."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPatients.map((patient) => {
            const vitals = patient.latest_vital_record;
            const admission = patient.active_admission;
            const status = patient.situation_status || 'stable';
            const label = patient.situation_label || 'Normal & Stable';
            const description = patient.situation_description || 'Patient resting comfortably.';

            // Active alert for this patient if any
            const activeEmergencyAlert = patient.alerts?.find((a) => a.status === 'active');
            const doctorInActionAlert = patient.alerts?.find((a) => a.status === 'doctor_in_action');
            const isAttendingThisPatient =
              myAttendingAlert && patient.alerts?.some((a) => a.id === myAttendingAlert.id);

            // Queue priority positions (FIFO: earliest requested = index 0 = Priority #1)
            const icuQueueIndex = icuTransferQueue.findIndex((p) => p.id === patient.id);
            const stepDownQueueIndex = stepDownQueue.findIndex((p) => p.id === patient.id);

            // Card styling by status
            const cardStyles = {
              emergency: 'border-red-300 bg-gradient-to-b from-red-50/40 via-white to-white ring-1 ring-red-400/30',
              doctor_in_action: 'border-blue-300 bg-gradient-to-b from-blue-50/40 via-white to-white ring-1 ring-blue-400/30',
              review: 'border-amber-300 bg-gradient-to-b from-amber-50/40 via-white to-white',
              stable: 'border-emerald-200 bg-gradient-to-b from-emerald-50/20 via-white to-white',
              pending_vitals: 'border-slate-200 bg-white',
              icu_observation: 'border-indigo-300 bg-gradient-to-b from-indigo-50/30 via-white to-white ring-1 ring-indigo-400/30',
            };

            const bannerStyles = {
              emergency: 'bg-red-50 border-red-200 text-red-900',
              doctor_in_action: 'bg-blue-50 border-blue-200 text-blue-900',
              review: 'bg-amber-50 border-amber-200 text-amber-900',
              stable: 'bg-emerald-50 border-emerald-200 text-emerald-900',
              pending_vitals: 'bg-slate-50 border-slate-200 text-slate-700',
              icu_observation: 'bg-indigo-50 border-indigo-200 text-indigo-900',
            };

            const badgeStyles = {
              emergency: 'bg-red-600 text-white animate-pulse',
              doctor_in_action: 'bg-blue-600 text-white',
              review: 'bg-amber-500 text-white',
              stable: 'bg-emerald-600 text-white',
              pending_vitals: 'bg-slate-500 text-white',
              icu_observation: 'bg-indigo-600 text-white',
            };

            return (
              <div
                key={patient.id}
                className={`rounded-2xl border-2 p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                  cardStyles[status] || 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  {/* Top Row: Patient Info & Bed */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {patient.name}
                        </Link>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {patient.patient_code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {patient.age ? `${patient.age} yrs` : 'Age N/A'} • {patient.gender || 'Unknown'} •{' '}
                        <span className="text-slate-700 font-medium">{admission?.diagnosis || 'General Observation'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${badgeStyles[status]}`}>
                        {label}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mt-1">
                        <Bed className="w-3.5 h-3.5 text-slate-400" />
                        <span>{admission?.ward || 'Unassigned'} • Bed {admission?.bed_number || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* SITUATION MONITOR BANNER (Clear plain-English status description) */}
                  <div className={`p-3.5 rounded-xl border text-xs leading-relaxed mb-4 flex items-start gap-2.5 ${bannerStyles[status]}`}>
                    {status === 'emergency' && <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
                    {status === 'doctor_in_action' && <Stethoscope className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                    {status === 'review' && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
                    {status === 'stable' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
                    {status === 'pending_vitals' && <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}

                    <div>
                      <div className="font-bold uppercase tracking-wider text-[10px] opacity-80 mb-0.5">
                        Patient Bedside Situation
                      </div>
                      <div className="font-medium text-xs">{description}</div>
                      {patient.alerts?.filter((a) => ['active', 'doctor_in_action'].includes(a.status)).length > 1 && (
                        <div className="mt-2 space-y-1">
                          {patient.alerts
                            .filter((a) => ['active', 'doctor_in_action'].includes(a.status))
                            .map((a) => (
                              <div
                                key={a.id}
                                className="text-[11px] font-semibold text-red-950 bg-white/80 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                <span>{a.message}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vital Signs Grid */}
                  <div className="grid grid-cols-5 gap-2 bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-center">
                    {/* HR */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500" />
                        <span>HR</span>
                      </div>
                      <div className={`text-sm font-extrabold mt-0.5 ${
                        vitals?.heart_rate > 100 || vitals?.heart_rate < 50 ? 'text-red-600' : 'text-slate-800'
                      }`}>
                        {vitals?.heart_rate ? `${vitals.heart_rate}` : '—'}
                      </div>
                      <div className="text-[9px] text-slate-400">bpm</div>
                    </div>

                    {/* BP */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                        <Activity className="w-3 h-3 text-blue-500" />
                        <span>BP</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                        {vitals?.systolic_bp && vitals?.diastolic_bp
                          ? `${vitals.systolic_bp}/${vitals.diastolic_bp}`
                          : '—'}
                      </div>
                      <div className="text-[9px] text-slate-400">mmHg</div>
                    </div>

                    {/* SpO2 */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                        <Droplets className="w-3 h-3 text-cyan-500" />
                        <span>SpO2</span>
                      </div>
                      <div className={`text-sm font-extrabold mt-0.5 ${
                        vitals?.spo2 && vitals?.spo2 < 92 ? 'text-red-600' : 'text-slate-800'
                      }`}>
                        {vitals?.spo2 ? `${vitals.spo2}%` : '—'}
                      </div>
                      <div className="text-[9px] text-slate-400">Oxygen</div>
                    </div>

                    {/* Temp */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                        <Thermometer className="w-3 h-3 text-amber-500" />
                        <span>Temp</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                        {vitals?.temperature ? `${vitals.temperature}°` : '—'}
                      </div>
                      <div className="text-[9px] text-slate-400">Celsius</div>
                    </div>

                    {/* Resp */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                        <Wind className="w-3 h-3 text-emerald-500" />
                        <span>Resp</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                        {vitals?.respiratory_rate ? `${vitals.respiratory_rate}` : '—'}
                      </div>
                      <div className="text-[9px] text-slate-400">/min</div>
                    </div>
                  </div>

                  {/* Measurement timestamp */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                    <span>
                      {vitals
                        ? `Measured: ${new Date(vitals.measured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'No measurements yet'}
                    </span>
                    {vitals?.recorder && (
                      <span className="font-medium text-slate-600">By: {formatNurseName(vitals.recorder.name)}</span>
                    )}
                  </div>
                </div>

                {/* Role-Specific Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/patients/${patient.id}`}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chart Details</span>
                    </Link>
                    {(isNurse || isDoctor) && (
                      <Link
                        to={`/vitals/history?patient_id=${patient.id}`}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        <span>Trends</span>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* DOCTOR ACTIONS */}
                    {canTakeDoctorAction && (
                      <>
                        {/* 1. If THIS doctor is currently attending this patient, show "Assessment Done" + "Request ICU Transfer" buttons (only if not already in ICU) */}
                        {isAttendingThisPatient && (
                          <div className="flex items-center gap-1.5">
                            {!(
                              ['Intensive Care Unit (ICU)', 'Cardiology ICU'].includes(patient.active_admission?.ward) ||
                              patient.active_admission?.icu_transferred
                            ) && (
                              !patient.active_admission?.icu_transfer_requested ? (
                                <button
                                  type="button"
                                  onClick={() => handleRequestIcuTransfer(patient)}
                                  disabled={requestingIcuId === patient.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                                  title="Patient condition deteriorating: Request emergency ICU bed"
                                >
                                  <span>🚑 Request ICU</span>
                                </button>
                              ) : (
                                <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-[11px] font-bold border border-red-300 flex items-center gap-1 animate-pulse">
                                  <span>
                                    🚨 ICU Requested {icuQueueIndex !== -1 && `(#${icuQueueIndex + 1} in Queue)`}
                                  </span>
                                </span>
                              )
                            )}

                            <button
                              type="button"
                              onClick={() => handleAssessmentDone(myAttendingAlert.id)}
                              disabled={assessmentSubmitting}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{assessmentSubmitting ? 'Resolving...' : '✅ Assessment Done'}</span>
                            </button>
                          </div>
                        )}

                        {/* 2. If this patient has an active emergency alarm */}
                        {!isAttendingThisPatient && activeEmergencyAlert && (
                          isCurrentDoctorBusy ? (
                            <button
                              type="button"
                              disabled
                              title={`You are currently attending another patient. Complete that assessment first.`}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Busy with Bed {myAttendingAlert?.patient?.active_admission?.bed_number || 'Other'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActionAlert(activeEmergencyAlert);
                                setActionPatient(patient);
                                setDoctorNote(`${formatDoctorName(user?.name)} attending bedside for ${activeEmergencyAlert.message}`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all hover:scale-105"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>🩺 Doctor in Action</span>
                            </button>
                          )
                        )}

                        {/* 3. If attended by another doctor */}
                        {!isAttendingThisPatient && status === 'doctor_in_action' && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                            <span>Doctor Attending</span>
                          </span>
                        )}

                        {/* 4. DOCTOR / ADMIN: Ward Step-Down Request for Stable Patients in ICU */}
                        {!(
                          !['Intensive Care Unit (ICU)', 'Cardiology ICU'].includes(patient.active_admission?.ward) &&
                          !patient.active_admission?.icu_transferred
                        ) && !activeEmergencyAlert && !doctorInActionAlert && (
                          !patient.active_admission?.step_down_requested ? (
                            <button
                              type="button"
                              onClick={() => handleRequestStepDown(patient)}
                              disabled={requestingStepDownId === patient.id}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                              title="Patient is clinically stable: Request transfer back to General Ward"
                            >
                              <span>🏥 Request Step-Down</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-[11px] font-bold border border-teal-200 flex items-center gap-1">
                              <span>
                                🏥 Step-Down Requested {stepDownQueueIndex !== -1 && `(#${stepDownQueueIndex + 1} in Queue)`}
                              </span>
                            </span>
                          )
                        )}
                      </>
                    )}

                    {/* NURSE / ADMIN ICU BED ALLOCATION BUTTON */}
                    {(isNurse || isAdmin) && patient.active_admission?.icu_transfer_requested && (
                      <button
                        type="button"
                        onClick={() => openIcuTransferModal(patient)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/30 flex items-center gap-1.5 animate-pulse transition-all hover:scale-105 cursor-pointer"
                      >
                        <Bed className="w-3.5 h-3.5" />
                        <span>
                          🚑 Allocate ICU Bed {icuQueueIndex !== -1 && `(Priority #${icuQueueIndex + 1})`}
                        </span>
                      </button>
                    )}

                    {/* NURSE / ADMIN STEP-DOWN BED ALLOCATION BUTTON */}
                    {(isNurse || isAdmin) && patient.active_admission?.step_down_requested && (
                      <button
                        type="button"
                        onClick={() => openStepDownModal(patient)}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/30 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                      >
                        <Bed className="w-3.5 h-3.5" />
                        <span>
                          🏥 Allocate Ward Bed {stepDownQueueIndex !== -1 && `(Priority #${stepDownQueueIndex + 1})`}
                        </span>
                      </button>
                    )}

                    {/* NURSE / ADMIN QUICK VITAL ENTRY BUTTON */}
                    {canInputVitals && (
                      <button
                        type="button"
                        onClick={() => {
                          setVitalEntryPatient(patient);
                          setVitalForm({
                            heart_rate: '',
                            systolic_bp: '',
                            diastolic_bp: '',
                            spo2: '',
                            temperature: '',
                            respiratory_rate: '',
                            clinical_notes: '',
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Input Vitals</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Doctor in Action Bedside Attendance Modal */}
      {actionAlert && (
        <Modal
          isOpen={!!actionAlert}
          onClose={() => setActionAlert(null)}
          title="Confirm Doctor Bedside Attendance"
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Active Emergency Alarm for {actionPatient?.name}</span>
              </div>
              <div>{actionAlert.message}</div>
              <div className="text-[11px] text-red-700 mt-1">
                Attending physician notification was dispatched via Gmail SMTP.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Attendance Note (Optional)
              </label>
              <Textarea
                rows={3}
                value={doctorNote}
                onChange={(e) => setDoctorNote(e.target.value)}
                placeholder="e.g. Attending bedside, administering oxygen and IV fluids. Awaiting follow-up vitals from nurse."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This note will be permanently logged in the hospital audit trail.
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
              <strong>Workflow Next Step:</strong> Clicking confirm flags the patient as <strong>'Doctor in Action'</strong>. Once the bedside nurse records subsequent normalized vitals, the alarm will automatically resolve!
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setActionAlert(null)} disabled={actionSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmDoctorInAction}
                loading={actionSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                🩺 Mark Doctor in Action
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Nurse Quick Vital Entry Modal */}
      {vitalEntryPatient && (
        <Modal
          isOpen={!!vitalEntryPatient}
          onClose={() => setVitalEntryPatient(null)}
          title={`Input Vitals: ${vitalEntryPatient.name} (${vitalEntryPatient.active_admission?.ward || 'Bedside'})`}
        >
          <form onSubmit={handleQuickVitalSubmit} className="space-y-4">
            {/* Helper presets for quick testing */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Presets (Testing)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fillNormalPreset}
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded text-[11px] font-semibold"
                >
                  Fill Normal (Auto-Resolves Alarms)
                </button>
                <button
                  type="button"
                  onClick={fillCriticalPreset}
                  className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded text-[11px] font-semibold"
                >
                  Fill Critical (Triggers Alarm)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Heart Rate (bpm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={vitalForm.heart_rate}
                  onChange={(e) => setVitalForm({ ...vitalForm, heart_rate: e.target.value })}
                  placeholder="e.g. 75"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Oxygen SpO2 (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vitalForm.spo2}
                  onChange={(e) => setVitalForm({ ...vitalForm, spo2: e.target.value })}
                  placeholder="e.g. 98"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Systolic BP (mmHg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={vitalForm.systolic_bp}
                  onChange={(e) => setVitalForm({ ...vitalForm, systolic_bp: e.target.value })}
                  placeholder="e.g. 120"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diastolic BP (mmHg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={vitalForm.diastolic_bp}
                  onChange={(e) => setVitalForm({ ...vitalForm, diastolic_bp: e.target.value })}
                  placeholder="e.g. 80"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temperature (°C) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={vitalForm.temperature}
                  onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                  placeholder="e.g. 36.8"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Respiratory Rate (/min) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={vitalForm.respiratory_rate}
                  onChange={(e) => setVitalForm({ ...vitalForm, respiratory_rate: e.target.value })}
                  placeholder="e.g. 16"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nurse Bedside Notes (Optional)
              </label>
              <Textarea
                rows={2}
                value={vitalForm.clinical_notes}
                onChange={(e) => setVitalForm({ ...vitalForm, clinical_notes: e.target.value })}
                placeholder="e.g. Patient conscious, verbal response normal. Resting comfortably."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setVitalEntryPatient(null)} disabled={vitalSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={vitalSubmitting}>
                Save Vital Signs & Update Status
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Emergency ICU Bed Allocation Modal (Nurse / Admin) */}
      {icuTransferPatient && (
        <Modal
          isOpen={!!icuTransferPatient}
          onClose={() => setIcuTransferPatient(null)}
          title="🚑 Emergency ICU Bed Allocation & Transfer"
        >
          <form onSubmit={handleCompleteIcuTransfer} className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold flex items-center gap-1.5 text-sm text-red-900">
                  <span>🚨 Immediate ICU Upgrade Requested</span>
                </div>
                {icuTransferQueue.findIndex((p) => p.id === icuTransferPatient.id) !== -1 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px]">
                    Priority #{icuTransferQueue.findIndex((p) => p.id === icuTransferPatient.id) + 1} of {icuTransferQueue.length} in Queue
                  </span>
                )}
              </div>
              <p>
                Attending Physician requested urgent ICU bed allocation for{' '}
                <strong className="text-slate-900">{icuTransferPatient.name}</strong> ({icuTransferPatient.patient_code}).
              </p>
              <p className="text-slate-600">
                Current Location: {icuTransferPatient.active_admission?.ward} • Bed {icuTransferPatient.active_admission?.bed_number}
              </p>
              {icuTransferPatient.active_admission?.icu_transfer_requested_at && (
                <p className="text-[11px] text-red-700 font-mono">
                  Requested: {new Date(icuTransferPatient.active_admission.icu_transfer_requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({formatQueueTime(icuTransferPatient.active_admission.icu_transfer_requested_at)})
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target ICU Ward
              </label>
              <select
                value={icuTransferWard}
                onChange={(e) => {
                  setIcuTransferWard(e.target.value);
                  fetchIcuBeds(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              >
                <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                <option value="Cardiology ICU">Cardiology ICU</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available ICU Bed
              </label>
              {icuLoadingBeds ? (
                <div className="py-2 text-xs text-slate-500 flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Checking available ICU beds...</span>
                </div>
              ) : icuAvailableBeds.length === 0 ? (
                <div className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  No vacant beds in {icuTransferWard}. Please select another ICU ward or discharge an occupant.
                </div>
              ) : (
                <select
                  value={icuTransferBed}
                  onChange={(e) => setIcuTransferBed(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                  required
                >
                  {icuAvailableBeds.map((bed) => (
                    <option key={bed} value={bed}>
                      {bed} (Available)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIcuTransferPatient(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="submit"
                loading={icuSubmitting}
                disabled={!icuTransferBed || icuAvailableBeds.length === 0}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                Confirm ICU Bed Transfer
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: Step-Down General Ward Bed Allocation Modal (Nurse / Admin) */}
      {stepDownPatient && (
        <Modal
          isOpen={!!stepDownPatient}
          onClose={() => setStepDownPatient(null)}
          title="🏥 Ward Step-Down: General Bed Allocation"
        >
          <form onSubmit={handleCompleteStepDown} className="space-y-4">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold flex items-center gap-1.5 text-sm text-teal-950">
                  <span>🏥 Transfer from ICU to General Ward</span>
                </div>
                {stepDownQueue.findIndex((p) => p.id === stepDownPatient.id) !== -1 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-700 text-white font-extrabold text-[10px]">
                    Priority #{stepDownQueue.findIndex((p) => p.id === stepDownPatient.id) + 1} of {stepDownQueue.length} in Queue
                  </span>
                )}
              </div>
              <p>
                Patient <strong className="text-slate-900">{stepDownPatient.name}</strong> ({stepDownPatient.patient_code}) is clinically stable and ready for step-down care.
              </p>
              <p className="text-teal-700">
                Current Location: {stepDownPatient.active_admission?.ward} • Bed {stepDownPatient.active_admission?.bed_number}
              </p>
              {stepDownPatient.active_admission?.step_down_requested_at && (
                <p className="text-[11px] text-teal-700 font-mono">
                  Requested: {new Date(stepDownPatient.active_admission.step_down_requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({formatQueueTime(stepDownPatient.active_admission.step_down_requested_at)})
                </p>
              )}
              {stepDownPatient.active_admission?.step_down_notes && (
                <p className="text-slate-600 italic mt-1 bg-white/70 p-2 rounded-lg border border-teal-100">
                  Doctor's Note: "{stepDownPatient.active_admission?.step_down_notes}"
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target General / Step-Down Ward
              </label>
              <select
                value={stepDownWard}
                onChange={(e) => {
                  setStepDownWard(e.target.value);
                  fetchStepDownBeds(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
              >
                {STEP_DOWN_WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Vacant Bed
              </label>
              {stepDownLoadingBeds ? (
                <div className="py-2 text-xs text-slate-500 flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Checking available ward beds...</span>
                </div>
              ) : stepDownAvailableBeds.length === 0 ? (
                <div className="p-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                  No vacant beds currently in {stepDownWard}. Please select another ward or discharge an occupant.
                </div>
              ) : (
                <select
                  value={stepDownBed}
                  onChange={(e) => setStepDownBed(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
                  required
                >
                  {stepDownAvailableBeds.map((bed) => (
                    <option key={bed} value={bed}>
                      {bed} (Available)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setStepDownPatient(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={stepDownSubmitting}
                disabled={!stepDownBed || stepDownAvailableBeds.length === 0}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
              >
                Confirm Ward Step-Down
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

