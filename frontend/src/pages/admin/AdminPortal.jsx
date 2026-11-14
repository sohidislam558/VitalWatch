import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/settingsService';
import { useAuth } from '../../hooks/useAuth';
import PageContainer from '../../components/layout/PageContainer';
import SituationMonitor from '../../components/dashboard/SituationMonitor';
import DateRangePicker from '../../components/common/DateRangePicker';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { cleanPersonName, formatDoctorName, formatNurseName } from '../../utils/formatUser';
import { onTelemetryUpdate } from '../../utils/realtime';
import {
  ShieldCheck,
  Activity,
  HeartHandshake,
  Stethoscope,
  Users,
  Bed,
  Sliders,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Search,
  ArrowRight,
  Filter,
  X,
  Eye,
  User,
  ExternalLink,
  Sparkles,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPortal() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab switch between Activity Stream and Situation Monitor
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' or 'monitor'

  // Activity Stream Filter and Search States
  const [activitySearch, setActivitySearch] = useState('');
  const [activityCategory, setActivityCategory] = useState('all');
  const [clinicalOnly, setClinicalOnly] = useState(true);
  const [activityStartDate, setActivityStartDate] = useState('');
  const [activityEndDate, setActivityEndDate] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Activity Deletion Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null, // 'specific' | 'date' | 'dateRange' | 'all'
    targetId: null,
    targetDate: null,
    targetRange: null,
    title: '',
    message: '',
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [patientsRes, summaryRes, activitiesRes] = await Promise.all([
        dashboardService.getMonitoringPatients(),
        dashboardService.getSummary(),
        dashboardService.getActivities({
          start_date: activityStartDate || undefined,
          end_date: activityEndDate || undefined,
        }),
      ]);

      setPatients(patientsRes.data?.data || []);
      setSummary(summaryRes.data || null);
      setActivities(activitiesRes.data || []);
    } catch {
      toast.error('Failed to load administrator telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activityStartDate, activityEndDate]);

  useEffect(() => {
    loadData();

    // Silent background real-time sync every 2.5s
    const interval = setInterval(() => {
      loadData(true);
    }, 2500);

    const unsubscribe = onTelemetryUpdate(() => {
      loadData(true);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [loadData]);

  // Open confirmation modal for deletion
  const openDeleteModal = (type, target) => {
    if (type === 'specific') {
      setDeleteConfirm({
        isOpen: true,
        type: 'specific',
        targetId: target.id,
        title: `Delete Activity Event #${target.id}`,
        message: `Are you sure you want to delete this activity log event ("${target.summary}")? This action cannot be undone.`,
      });
    } else if (type === 'date') {
      const sampleItem = target.items?.[0];
      const isoDate = sampleItem
        ? new Date(sampleItem.created_at).toISOString().split('T')[0]
        : null;
      setDeleteConfirm({
        isOpen: true,
        type: 'date',
        targetDate: isoDate,
        title: `Delete Logs for ${target.dateTitle}`,
        message: `Are you sure you want to permanently delete all ${target.items.length} activity log event(s) recorded on ${target.dateTitle}? This cannot be undone.`,
      });
    } else if (type === 'dateRange') {
      const desc = target.startDate && target.endDate
        ? `${target.startDate} to ${target.endDate}`
        : target.startDate ? `from ${target.startDate} onwards` : `up to ${target.endDate}`;
      setDeleteConfirm({
        isOpen: true,
        type: 'dateRange',
        targetRange: target,
        title: 'Delete Logs in Date Range',
        message: `Are you sure you want to permanently delete all activity log events recorded ${desc}? This action cannot be undone.`,
      });
    } else if (type === 'all') {
      setDeleteConfirm({
        isOpen: true,
        type: 'all',
        title: 'Purge ALL Activity Logs',
        message: `Permanent Deletion Warning: Are you sure you want to permanently delete ALL ${activities.length} activity log events in the hospital system? This will clear the entire audit trail and cannot be undone.`,
      });
    }
  };

  // Perform deletion after confirmation
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      if (deleteConfirm.type === 'specific') {
        await dashboardService.deleteActivity(deleteConfirm.targetId);
        toast.success(`Activity log #${deleteConfirm.targetId} deleted.`);
        if (selectedActivity?.id === deleteConfirm.targetId) {
          setSelectedActivity(null);
        }
      } else if (deleteConfirm.type === 'date') {
        const res = await dashboardService.deleteActivitiesByDate({
          date: deleteConfirm.targetDate,
        });
        toast.success(res.message || 'Date logs deleted successfully.');
        if (
          selectedActivity &&
          new Date(selectedActivity.created_at).toISOString().split('T')[0] === deleteConfirm.targetDate
        ) {
          setSelectedActivity(null);
        }
      } else if (deleteConfirm.type === 'dateRange') {
        const res = await dashboardService.deleteActivitiesByDate({
          start_date: deleteConfirm.targetRange?.startDate,
          end_date: deleteConfirm.targetRange?.endDate,
        });
        toast.success(res.message || 'Date range logs deleted successfully.');
        setSelectedActivity(null);
      } else if (deleteConfirm.type === 'all') {
        const res = await dashboardService.clearAllActivities();
        toast.success(res.message || 'All activity logs permanently cleared.');
        setSelectedActivity(null);
      }
      setDeleteConfirm({ isOpen: false, type: null });
      await loadData(false);
    } catch {
      toast.error('Failed to delete activity log.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper badge descriptor for enterprise audit grid
  const getActivityBadge = (action) => {
    if (action.includes('ICU')) {
      return {
        label: action === 'EMERGENCY_ICU_TRANSFER_REQUESTED' ? 'ICU Requested' : 'ICU Transfer',
        color: 'bg-rose-100 text-rose-800 border-rose-200',
        icon: <Bed className="w-3.5 h-3.5 text-rose-600" />,
      };
    }
    if (action.includes('STEP_DOWN')) {
      return {
        label: action === 'STEP_DOWN_REQUESTED' ? 'Step-Down Req' : 'Ward Step-Down',
        color: 'bg-teal-100 text-teal-800 border-teal-200',
        icon: <Bed className="w-3.5 h-3.5 text-teal-600" />,
      };
    }
    if (action === 'RECORD_VITALS') {
      return {
        label: 'Vitals Entry',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />,
      };
    }
    if (action.startsWith('DOCTOR_')) {
      return {
        label: 'Doctor in Action',
        color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        icon: <Stethoscope className="w-3.5 h-3.5 text-cyan-600" />,
      };
    }
    if (action.startsWith('ALERT_RESOLVED') || action.startsWith('ALERT_AUTO_RESOLVED')) {
      return {
        label: 'Alarm Resolved',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      };
    }
    if (action.startsWith('ALERT_GENERATED')) {
      return {
        label: 'Alarm Triggered',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
      };
    }
    if (action.startsWith('PATIENT_ADMITTED')) {
      return {
        label: 'Admission',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: <Bed className="w-3.5 h-3.5 text-indigo-600" />,
      };
    }
    if (action.startsWith('PATIENT_DISCHARGED')) {
      return {
        label: 'Discharge',
        color: 'bg-slate-100 text-slate-800 border-slate-200',
        icon: <Activity className="w-3.5 h-3.5 text-slate-600" />,
      };
    }
    return {
      label: action.replace(/_/g, ' '),
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: <Activity className="w-3.5 h-3.5 text-slate-600" />,
    };
  };

  const getActivityHighlight = (item) => {
    const details = item.details || {};
    if (item.action === 'RECORD_VITALS' && details.heart_rate != null) {
      return `HR ${details.heart_rate} bpm • BP ${details.systolic_bp}/${details.diastolic_bp} • SpO2 ${details.spo2}% • Temp ${details.temperature}°C`;
    }
    if (item.action === 'DOCTOR_IN_ACTION') {
      return details.notes || details.message || 'Bedside attendance logged by physician';
    }
    if (item.action === 'EMERGENCY_ICU_TRANSFER_REQUESTED') {
      return `Urgent ICU escalation requested: Target ${details.target_ward || 'ICU'}`;
    }
    if (item.action === 'PATIENT_TRANSFERRED_TO_ICU') {
      return `Transfer completed: ${details.from_ward} ➔ ${details.to_ward} (${details.to_bed})`;
    }
    if (item.action === 'STEP_DOWN_REQUESTED') {
      return `Step-down requested to ${details.target_ward || 'General Medical Ward'}`;
    }
    if (item.action === 'PATIENT_STEPPED_DOWN') {
      return `Stepped down from ${details.from_ward} ➔ ${details.to_ward} (${details.to_bed})`;
    }
    if (item.action.startsWith('ALERT_')) {
      return details.rule || details.message || 'Early warning alert threshold event';
    }
    if (item.action === 'PATIENT_ADMITTED') {
      return `Admitted to ${details.ward} (Bed ${details.bed_number}) • ${details.diagnosis || 'Observation'}`;
    }
    if (item.action === 'PATIENT_DISCHARGED') {
      return `Discharged from ${details.ward}`;
    }
    if (item.action.startsWith('LOGIN_')) {
      return `Portal authentication from IP ${details.ip || 'Intranet'}`;
    }
    return item.summary;
  };

  const getActivityTarget = (item) => {
    const details = item.details || {};
    if (details.name) {
      return `${details.name}${details.bed_number ? ` (${details.bed_number})` : ''}`;
    }
    if (details.patient_name) {
      return `${details.patient_name}${details.current_bed ? ` (${details.current_bed})` : ''}`;
    }
    if (details.ward) {
      return `${details.ward}${details.bed_number ? ` (${details.bed_number})` : ''}`;
    }
    return '—';
  };

  // Filtered activities
  const filteredActivities = activities.filter((item) => {
    // Hide routine auth logs when clinicalOnly toggle is active
    if (clinicalOnly && (item.action.startsWith('LOGIN_') || item.action === 'LOGOUT')) {
      return false;
    }

    // Category filter
    if (activityCategory === 'vitals') {
      if (item.action !== 'RECORD_VITALS' && item.role !== 'nurse') return false;
    } else if (activityCategory === 'doctor') {
      if (
        !item.action.startsWith('DOCTOR_') &&
        !item.action.startsWith('ALERT_') &&
        item.role !== 'doctor'
      )
        return false;
    } else if (activityCategory === 'transfers') {
      if (!item.action.includes('ICU') && !item.action.includes('STEP_DOWN')) return false;
    } else if (activityCategory === 'admissions') {
      if (
        !item.action.startsWith('PATIENT_ADMITTED') &&
        !item.action.startsWith('PATIENT_DISCHARGED') &&
        !item.action.startsWith('PATIENT_REGISTERED')
      )
        return false;
    }

    // Date filter
    if (activityStartDate) {
      const itemDate = new Date(item.created_at);
      const start = new Date(activityStartDate + 'T00:00:00');
      if (itemDate < start) return false;
    }
    if (activityEndDate) {
      const itemDate = new Date(item.created_at);
      const end = new Date(activityEndDate + 'T23:59:59');
      if (itemDate > end) return false;
    }

    // Search query
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      const summaryMatch = item.summary?.toLowerCase().includes(q);
      const userMatch = item.user_name?.toLowerCase().includes(q);
      const actionMatch = item.action?.toLowerCase().includes(q);
      const detailsMatch = item.details && JSON.stringify(item.details).toLowerCase().includes(q);
      if (!summaryMatch && !userMatch && !actionMatch && !detailsMatch) return false;
    }

    return true;
  });

  // Group activities date-wise (Today, Yesterday, or formatted date string)
  const groupActivitiesByDate = (items) => {
    const groups = {};
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    items.forEach((item) => {
      const itemDate = new Date(item.created_at);
      const itemDayStr = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).toDateString();

      let title = '';
      if (itemDayStr === todayStr) {
        title = `Today — ${itemDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else if (itemDayStr === yesterdayStr) {
        title = `Yesterday — ${itemDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else {
        title = itemDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      }

      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(item);
    });

    return groups;
  };

  const groupedActivities = groupActivitiesByDate(filteredActivities);

  // Render clean human-readable details without raw JSON stringification
  const renderActivityDetails = (item) => {
    const details = item.details;
    if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
      return null;
    }

    // 1. Bedside Vital Signs Recording
    if (item.action === 'RECORD_VITALS') {
      return (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
          {details.heart_rate != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-100">
              <span>❤️ HR: {details.heart_rate} bpm</span>
            </span>
          )}
          {details.systolic_bp != null && details.diastolic_bp != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              <span>🩸 BP: {details.systolic_bp}/{details.diastolic_bp} mmHg</span>
            </span>
          )}
          {details.spo2 != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 font-semibold border border-cyan-100">
              <span>🫁 SpO2: {details.spo2}%</span>
            </span>
          )}
          {details.temperature != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-100">
              <span>🌡️ Temp: {details.temperature}°C</span>
            </span>
          )}
          {details.respiratory_rate != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
              <span>🌬️ RR: {details.respiratory_rate}/min</span>
            </span>
          )}
          {details.clinical_notes && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 italic border border-slate-200">
              <span>📝 Note: "{details.clinical_notes}"</span>
            </span>
          )}
        </div>
      );
    }

    // 2. Emergency ICU Transfer Requested
    if (item.action === 'EMERGENCY_ICU_TRANSFER_REQUESTED') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200">
            🚨 Target: {details.target_ward || 'ICU'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
            From: {details.current_ward} • Bed {details.current_bed}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
            {formatDoctorName(details.requester_name || item.user_name)}
          </span>
          {details.notes && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 italic border border-amber-200">
              "{details.notes}"
            </span>
          )}
        </div>
      );
    }

    // 3. Patient Transferred to ICU
    if (item.action === 'PATIENT_TRANSFERRED_TO_ICU') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
            🚑 Transferred to ICU
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
            {details.from_ward} ({details.from_bed}) ➔ {details.to_ward} ({details.to_bed})
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
            Completed by: {details.transferred_by || item.user_name}
          </span>
        </div>
      );
    }

    // 4. Ward Step-Down Requested
    if (item.action === 'STEP_DOWN_REQUESTED') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold border border-teal-200">
            🏥 Target: {details.target_ward || 'General Medical Ward'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
            Current: {details.current_ward} • Bed {details.current_bed}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
            {formatDoctorName(details.requester_name || item.user_name)}
          </span>
          {details.notes && (
            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 italic border border-teal-200">
              "{details.notes}"
            </span>
          )}
        </div>
      );
    }

    // 5. Patient Stepped Down to General Ward
    if (item.action === 'PATIENT_STEPPED_DOWN') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold border border-teal-200">
            🏥 Stepped Down to General Ward
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
            {details.from_ward} ({details.from_bed}) ➔ {details.to_ward} ({details.to_bed})
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
            Allocated by: {details.transferred_by || item.user_name}
          </span>
        </div>
      );
    }

    // 6. Doctor in Action
    if (item.action === 'DOCTOR_IN_ACTION') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
            🩺 Bedside Attendance: {formatDoctorName(item.user_name)}
          </span>
          {details.message && (
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium border border-rose-100">
              🚨 {details.message}
            </span>
          )}
          {details.notes && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 italic border border-slate-200">
              "{details.notes}"
            </span>
          )}
        </div>
      );
    }

    // 7. Alert Resolved or Auto Resolved
    if (item.action.startsWith('ALERT_RESOLVED') || item.action.startsWith('ALERT_AUTO_RESOLVED')) {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
            ✅ Alarm Resolved
          </span>
          {details.rule && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Rule: {details.rule}
            </span>
          )}
        </div>
      );
    }

    // 8. Patient Admitted
    if (item.action === 'PATIENT_ADMITTED') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100">
            Ward: {details.ward} • Bed {details.bed_number}
          </span>
          {details.diagnosis && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Diagnosis: {details.diagnosis}
            </span>
          )}
        </div>
      );
    }

    // 9. Generic clean key-value tags (No raw JSON dump!)
    const ignoredKeys = ['patient_id', 'requester_id', 'actor_id', 'user_id', 'id'];
    const entries = Object.entries(details).filter(
      ([k, v]) => !ignoredKeys.includes(k) && v !== null && v !== undefined && typeof v !== 'object'
    );

    if (entries.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
        {entries.map(([key, val]) => (
          <span
            key={key}
            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200"
          >
            <span className="font-semibold text-slate-700 capitalize">{key.replace(/_/g, ' ')}:</span> {String(val)}
          </span>
        ))}
      </div>
    );
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Hospital Administration & Clinical Governance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome, <span className="font-semibold text-slate-700">{user?.name}</span> (Administrator) • Live Activity Stream & System Controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Real-Time Sync</span>
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Admitted Patients</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary?.total_admitted_patients ?? patients.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs">
          <div className="text-[11px] font-semibold text-red-600 uppercase">Active Alarms</div>
          <div className="text-2xl font-extrabold text-red-700 mt-1">
            {summary?.active_alerts_count ?? 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Monitored Wards</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary?.active_wards_count ?? 4}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Vitals Recorded (24h)</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {summary?.vitals_recorded_24h ?? patients.length * 2}
          </div>
        </div>
      </div>

      {/* Admin Quick Control Shortcuts */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Hospital Governance Shortcuts
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            to="/users"
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Staff Accounts</div>
              <div className="text-[10px] text-slate-500">Doctors & Nurses</div>
            </div>
          </Link>

          <Link
            to="/settings/rules"
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Threshold Rules</div>
              <div className="text-[10px] text-slate-500">Early Warning Bounds</div>
            </div>
          </Link>

          <Link
            to="/patients"
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Bed className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Patient Directory</div>
              <div className="text-[10px] text-slate-500">Manage Patients & Records</div>
            </div>
          </Link>

          <Link
            to="/reports"
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Clinical Reports</div>
              <div className="text-[10px] text-slate-500">PDF Telemetry Export</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Tabs: Live Activity Feed vs Situation Monitor */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'activity'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Hospital Activity Stream ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('monitor')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'monitor'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Patient Situation Monitor ({patients.length})</span>
        </button>
      </div>

      {/* TAB 1: LIVE ACTIVITY STREAM (Organized & Date-Wise Formation) */}
      {activeTab === 'activity' && (
        <div className="space-y-5">
          {/* Top Info Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Real-Time Clinical Activity Audit Log
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Organized date-wise stream tracking nurse vital entries, physician bedside interventions, ICU escalations, and ward step-down de-escalations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 text-[11px] font-mono border border-white/10">
                {activities.length} Total Events
              </span>
              <button
                type="button"
                onClick={() => openDeleteModal('all')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 hover:text-white text-[11px] font-semibold border border-rose-500/30 transition-all cursor-pointer"
                title="Permanently wipe all activity log history"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Clear All Logs</span>
              </button>
            </div>
          </div>

          {/* Calendar Date Filtration Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px] uppercase tracking-wider mr-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Calendar Date Filter:</span>
              </div>
              <DateRangePicker
                startDate={activityStartDate}
                endDate={activityEndDate}
                onStartDateChange={(d) => setActivityStartDate(d)}
                onEndDateChange={(d) => setActivityEndDate(d)}
              />
              {(activityStartDate || activityEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setActivityStartDate('');
                    setActivityEndDate('');
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Clear Dates
                </button>
              )}
            </div>

            {/* Quick Presets & Range Deletion */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mr-1">
                Quick:
              </span>
              <button
                type="button"
                onClick={() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  setActivityStartDate(todayStr);
                  setActivityEndDate(todayStr);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  activityStartDate === new Date().toISOString().split('T')[0] &&
                  activityEndDate === new Date().toISOString().split('T')[0]
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const yest = new Date();
                  yest.setDate(yest.getDate() - 1);
                  const yestStr = yest.toISOString().split('T')[0];
                  setActivityStartDate(yestStr);
                  setActivityEndDate(yestStr);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  activityStartDate &&
                  activityStartDate === activityEndDate &&
                  activityStartDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  const end = new Date().toISOString().split('T')[0];
                  const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
                  setActivityStartDate(start);
                  setActivityEndDate(end);
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivityStartDate('');
                  setActivityEndDate('');
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
              >
                All Dates
              </button>

              {(activityStartDate || activityEndDate) && (
                <button
                  type="button"
                  onClick={() =>
                    openDeleteModal('dateRange', {
                      startDate: activityStartDate,
                      endDate: activityEndDate,
                    })
                  }
                  className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  title="Delete all logs within this selected date range"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Selected Range</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search audit events by staff, patient, or notes..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-slate-50/50"
              />
            </div>

            {/* Category Filter Pills & Clinical Only Switch */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Clinical Only Toggle */}
              <button
                type="button"
                onClick={() => setClinicalOnly(!clinicalOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer border ${
                  clinicalOnly
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title="Toggle between clinical events and system/login audit logs"
              >
                <Sparkles className={`w-3.5 h-3.5 ${clinicalOnly ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{clinicalOnly ? 'Clinical Only' : 'All Logs (incl. System)'}</span>
              </button>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <button
                type="button"
                onClick={() => setActivityCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activityCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({activities.length})
              </button>
              <button
                type="button"
                onClick={() => setActivityCategory('vitals')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activityCategory === 'vitals'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Nurse Vitals ({activities.filter((a) => a.action === 'RECORD_VITALS' || a.role === 'nurse').length})
              </button>
              <button
                type="button"
                onClick={() => setActivityCategory('doctor')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activityCategory === 'doctor'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                }`}
              >
                Physician Bedside ({activities.filter((a) => a.action.startsWith('DOCTOR_') || a.action.startsWith('ALERT_') || a.role === 'doctor').length})
              </button>
              <button
                type="button"
                onClick={() => setActivityCategory('transfers')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activityCategory === 'transfers'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Transfers ({activities.filter((a) => a.action.includes('ICU') || a.action.includes('STEP_DOWN')).length})
              </button>
              <button
                type="button"
                onClick={() => setActivityCategory('admissions')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activityCategory === 'admissions'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Admissions ({activities.filter((a) => a.action.startsWith('PATIENT_ADMITTED') || a.action.startsWith('PATIENT_DISCHARGED') || a.action.startsWith('PATIENT_REGISTERED')).length})
              </button>
            </div>
          </div>

          {/* Date-Wise Grouped Activity List */}
          {Object.keys(groupedActivities).length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
              <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Activity Events Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                No logs match your current filter or search criteria. Try selecting "All" or clearing the search box.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([dateTitle, items]) => (
                <div key={dateTitle} className="space-y-2.5">
                  {/* Date Section Header */}
                  <div className="flex items-center justify-between gap-2.5 px-1 pt-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                        {dateTitle}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold font-mono">
                        {items.length} {items.length === 1 ? 'event' : 'events'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openDeleteModal('date', { dateTitle, items })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md transition-colors cursor-pointer"
                        title={`Delete all ${items.length} logs for ${dateTitle}`}
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Delete Day's Logs</span>
                      </button>
                    </div>
                  </div>

                  {/* Date Enterprise Audit Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-24">Time</th>
                            <th className="py-2.5 px-3 w-40">Event Type</th>
                            <th className="py-2.5 px-3 w-44">Staff (Actor)</th>
                            <th className="py-2.5 px-3 w-40">Patient / Ward</th>
                            <th className="py-2.5 px-4 min-w-[260px]">Clinical Summary</th>
                            <th className="py-2.5 px-3 w-28 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map((item) => {
                            const badge = getActivityBadge(item.action);
                            const target = getActivityTarget(item);
                            const highlight = getActivityHighlight(item);
                            const isSelected = selectedActivity?.id === item.id;

                            return (
                              <tr
                                key={item.id}
                                onClick={() => setSelectedActivity(item)}
                                className={`hover:bg-blue-50/50 cursor-pointer transition-colors group ${
                                  isSelected ? 'bg-blue-50/80' : ''
                                }`}
                              >
                                {/* Time */}
                                <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                  {new Date(item.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </td>

                                {/* Action / Event Badge */}
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.color}`}
                                  >
                                    {badge.icon}
                                    <span>{badge.label}</span>
                                  </span>
                                </td>

                                {/* Staff / Actor */}
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-800">
                                      {item.user_name ? cleanPersonName(item.user_name) : 'System Auto'}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                        item.role === 'nurse'
                                          ? 'bg-blue-100 text-blue-700'
                                          : item.role === 'doctor'
                                          ? 'bg-cyan-100 text-cyan-700'
                                          : item.role === 'admin'
                                          ? 'bg-slate-800 text-white'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {item.role || 'sys'}
                                    </span>
                                  </div>
                                </td>

                                {/* Patient / Target */}
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="font-medium text-slate-700 text-xs">{target}</span>
                                </td>

                                {/* Clinical Highlight */}
                                <td className="py-2.5 px-4 text-slate-600">
                                  <p className="truncate max-w-md text-xs font-normal text-slate-700" title={highlight}>
                                    {highlight}
                                  </p>
                                </td>

                                {/* Actions: Inspect & Delete */}
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedActivity(item);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-700 bg-slate-100 group-hover:bg-blue-100/70 rounded-md transition-colors"
                                      title="View event details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Detail</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal('specific', item);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                      title="Delete this activity log event"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SLIDE-OVER DETAIL DRAWER */}
          {selectedActivity && (
            <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                onClick={() => setSelectedActivity(null)}
              />

              {/* Slide-over panel */}
              <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col z-50 border-l border-slate-200 h-full animate-in slide-in-from-right duration-200">
                {/* Drawer Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {(() => {
                        const b = getActivityBadge(selectedActivity.action);
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-white/10 text-white border border-white/20">
                            {b.icon}
                            <span>{b.label}</span>
                          </span>
                        );
                      })()}
                      <span className="text-[11px] font-mono text-slate-400">
                        Event #{selectedActivity.id}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {selectedActivity.summary}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(selectedActivity.created_at).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'medium',
                        })}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedActivity(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                  {/* Staff & Target Context Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                        Actor / Staff Member
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {selectedActivity.user_name ? selectedActivity.user_name.charAt(0) : 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {selectedActivity.user_name || 'System Auto-Trigger'}
                          </p>
                          <span className="text-[10px] text-slate-500 capitalize">
                            {selectedActivity.role || 'automated'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                        Target Patient / Location
                      </span>
                      <p className="font-bold text-slate-900 text-xs">
                        {getActivityTarget(selectedActivity)}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {selectedActivity.details?.ward ? `Ward: ${selectedActivity.details.ward}` : 'Inpatient Ward'}
                      </span>
                    </div>
                  </div>

                  {/* Clinical Payload Visualizer: Bedside Vitals */}
                  {selectedActivity.action === 'RECORD_VITALS' && selectedActivity.details && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                        Recorded Vital Signs Measurements
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                          <span className="text-[10px] text-rose-700 font-bold uppercase">Heart Rate</span>
                          <p className="text-lg font-bold text-rose-900 mt-0.5">
                            {selectedActivity.details.heart_rate ?? '—'}{' '}
                            <span className="text-xs font-normal">bpm</span>
                          </p>
                        </div>
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <span className="text-[10px] text-indigo-700 font-bold uppercase">Blood Pressure</span>
                          <p className="text-lg font-bold text-indigo-900 mt-0.5">
                            {selectedActivity.details.systolic_bp && selectedActivity.details.diastolic_bp
                              ? `${selectedActivity.details.systolic_bp}/${selectedActivity.details.diastolic_bp}`
                              : '—'}{' '}
                            <span className="text-xs font-normal">mmHg</span>
                          </p>
                        </div>
                        <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-lg">
                          <span className="text-[10px] text-cyan-700 font-bold uppercase">Oxygen Saturation</span>
                          <p className="text-lg font-bold text-cyan-900 mt-0.5">
                            {selectedActivity.details.spo2 ?? '—'}{' '}
                            <span className="text-xs font-normal">%</span>
                          </p>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                          <span className="text-[10px] text-amber-700 font-bold uppercase">Temperature</span>
                          <p className="text-lg font-bold text-amber-900 mt-0.5">
                            {selectedActivity.details.temperature ?? '—'}{' '}
                            <span className="text-xs font-normal">°C</span>
                          </p>
                        </div>
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase">Respiratory Rate</span>
                          <p className="text-lg font-bold text-emerald-900 mt-0.5">
                            {selectedActivity.details.respiratory_rate ?? '—'}{' '}
                            <span className="text-xs font-normal">/min</span>
                          </p>
                        </div>
                      </div>
                      {selectedActivity.details.clinical_notes && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mt-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                            Nurse Clinical Observation Note
                          </span>
                          <p className="text-xs text-slate-800 italic">
                            "{selectedActivity.details.clinical_notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transfer Escalation / Step-Down Payload */}
                  {(selectedActivity.action.includes('ICU') || selectedActivity.action.includes('STEP_DOWN')) && selectedActivity.details && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Transfer Workflow Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 font-medium block">Source Location:</span>
                          <span className="font-bold text-slate-800">
                            {selectedActivity.details.current_ward || selectedActivity.details.from_ward || 'Ward'} (Bed {selectedActivity.details.current_bed || selectedActivity.details.from_bed || '—'})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium block">Destination Target:</span>
                          <span className="font-bold text-slate-800">
                            {selectedActivity.details.target_ward || selectedActivity.details.to_ward || 'ICU'} {selectedActivity.details.to_bed ? `(Bed ${selectedActivity.details.to_bed})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium block">Requesting Physician:</span>
                          <span className="font-bold text-slate-800">
                            {formatDoctorName(selectedActivity.details.requester_name || selectedActivity.user_name)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium block">Transfer Status:</span>
                          <span className="font-bold text-emerald-700">Verified & Logged</span>
                        </div>
                      </div>
                      {selectedActivity.details.notes && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-slate-500 font-medium block mb-0.5">Physician Clinical Rationale:</span>
                          <p className="text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-200">
                            "{selectedActivity.details.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Doctor Bedside Intervention Payload */}
                  {selectedActivity.action.startsWith('DOCTOR_') && selectedActivity.details && (
                    <div className="p-4 bg-cyan-50/60 border border-cyan-200 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-cyan-700" />
                        <span>Physician Bedside Attendance</span>
                      </h4>
                      <p className="text-xs text-slate-700">
                        {formatDoctorName(selectedActivity.user_name)} attended the patient bedside for clinical assessment.
                      </p>
                      {selectedActivity.details.notes && (
                        <div className="bg-white p-3 rounded-lg border border-cyan-100 text-xs text-slate-800">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">CLINICAL DIRECTIVE</span>
                          {selectedActivity.details.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alert Trigger / Resolution Payload */}
                  {selectedActivity.action.startsWith('ALERT_') && selectedActivity.details && (
                    <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>Threshold Telemetry Alarm</span>
                      </h4>
                      <p className="text-xs text-slate-800 font-semibold">
                        {selectedActivity.details.message || selectedActivity.summary}
                      </p>
                      {selectedActivity.details.rule && (
                        <p className="text-xs text-slate-600">
                          Trigger Rule: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 font-mono text-[11px]">{selectedActivity.details.rule}</code>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openDeleteModal('specific', selectedActivity)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    title="Permanently delete this event from the audit trail"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Event</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedActivity(null)}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Close Inspection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SITUATION MONITOR */}
      {activeTab === 'monitor' && (
        <SituationMonitor
          patients={patients}
          loading={loading}
          onRefresh={() => loadData(true)}
        />
      )}

      {/* Activity Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: null })}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText={deleteConfirm.type === 'all' ? 'Purge All Logs' : 'Delete'}
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </PageContainer>
  );
}

