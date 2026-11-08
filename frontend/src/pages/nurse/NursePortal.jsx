import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../services/settingsService';
import { patientService } from '../../services/patientService';
import { useAuth } from '../../hooks/useAuth';
import PageContainer from '../../components/layout/PageContainer';
import SituationMonitor from '../../components/dashboard/SituationMonitor';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
  HeartHandshake,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  UserPlus,
  Bed,
  Users,
} from 'lucide-react';
import { WARDS, WARD_BEDS } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function NursePortal() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Patient & Admission Modal state
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [submittingPatient, setSubmittingPatient] = useState(false);
  const [useCustomBed, setUseCustomBed] = useState(false);
  const [patientForm, setPatientForm] = useState({
    name: '',
    date_of_birth: '1980-01-01',
    gender: 'male',
    ward: 'Cardiology ICU',
    bed_number: 'Bed 101',
    diagnosis: 'Acute Observation',
    contact: '',
  });

  // Calculate occupied and available beds for currently selected ward
  const occupiedBedsInWard = patients
    .filter((p) => p.active_admission?.ward === patientForm.ward)
    .map((p) => ({
      bed_number: p.active_admission?.bed_number,
      patient_name: p.name,
    }));

  const standardBedsForWard = WARD_BEDS[patientForm.ward] || [
    'Bed 101', 'Bed 102', 'Bed 103', 'Bed 104', 'Bed 105',
    'Bed 106', 'Bed 107', 'Bed 108', 'Bed 109', 'Bed 110',
  ];

  const occupiedBedNumbers = occupiedBedsInWard.map((b) => b.bed_number);
  const availableBedsForWard = standardBedsForWard.filter(
    (b) => !occupiedBedNumbers.includes(b)
  );

  const handleWardChange = (newWard) => {
    const occupied = patients
      .filter((p) => p.active_admission?.ward === newWard)
      .map((p) => p.active_admission?.bed_number);
    const standard = WARD_BEDS[newWard] || ['Bed 101', 'Bed 102', 'Bed 103'];
    const available = standard.filter((b) => !occupied.includes(b));
    setPatientForm((prev) => ({
      ...prev,
      ward: newWard,
      bed_number: available[0] || '',
    }));
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [patientsRes, summaryRes] = await Promise.all([
        dashboardService.getMonitoringPatients(),
        dashboardService.getSummary(),
      ]);

      setPatients(patientsRes.data?.data || []);
      setSummary(summaryRes.data || null);
    } catch {
      toast.error('Failed to load bedside situation telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!patientForm.name.trim() || !patientForm.ward.trim() || !patientForm.bed_number.trim()) {
      toast.error('Patient Name, Ward, and Bed Number are required.');
      return;
    }

    setSubmittingPatient(true);
    try {
      const payload = {
        name: patientForm.name.trim(),
        date_of_birth: patientForm.date_of_birth,
        gender: patientForm.gender,
        ward: patientForm.ward.trim(),
        bed_number: patientForm.bed_number.trim(),
        diagnosis: patientForm.diagnosis.trim() || 'General Observation',
        contact: patientForm.contact.trim() || undefined,
      };

      const res = await patientService.createPatient(payload);
      toast.success(
        `Patient ${res.data?.name || patientForm.name} admitted to ${patientForm.ward} (${patientForm.bed_number})! Monitoring initiated.`
      );

      setRegisterModalOpen(false);
      setPatientForm({
        name: '',
        date_of_birth: '1980-01-01',
        gender: 'male',
        ward: 'Cardiology ICU',
        bed_number: 'Bed 101',
        diagnosis: 'Acute Observation',
        contact: '',
      });

      loadData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register patient and admission.');
    } finally {
      setSubmittingPatient(false);
    }
  };

  // Derived counts
  const stableCount = patients.filter((p) => p.situation_status === 'stable').length;
  const emergencyCount = patients.filter((p) => p.situation_status === 'emergency').length;
  const doctorInActionCount = patients.filter((p) => p.situation_status === 'doctor_in_action').length;
  const attentionCount = patients.filter((p) => p.situation_status === 'review').length;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Nurse Bedside Telemetry Station
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome, <span className="font-semibold text-slate-700">{user?.name}</span> (RN/Caregiver) • Bedside Vitals Entry & Situation Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="primary"
            onClick={() => setRegisterModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register & Admit Patient</span>
          </Button>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Monitored</div>
            <div className="text-xl font-bold text-slate-900">{patients.length}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-emerald-600 uppercase">Normal & Stable</div>
            <div className="text-xl font-bold text-emerald-700">{stableCount}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-red-600 uppercase">Emergency</div>
            <div className="text-xl font-bold text-red-700">{emergencyCount}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-blue-600 uppercase">Doctor Attending</div>
            <div className="text-xl font-bold text-blue-700">{doctorInActionCount}</div>
          </div>
        </div>
      </div>

      {/* Helpful Caregiver Note */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-900 text-xs mb-6 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Bedside Caregiver Guidance:</strong> Click <strong>"Register & Admit Patient"</strong> to onboard a patient into a ward. To record telemetry, click <strong>"Input Vitals"</strong> on any patient card below. Entering normalized vitals for a patient with an active alarm automatically clears the alarm and restores their status to <strong>Normal & Stable</strong>.
        </div>
      </div>

      {/* Empty State when no patients admitted */}
      {patients.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Bed className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Patients Currently Admitted</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            The hospital roster is completely clean. Register and admit a new patient to a ward to begin situation telemetry monitoring.
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setRegisterModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register & Admit First Patient</span>
            </Button>
          </div>
        </div>
      ) : (
        /* The Situation Monitor */
        <SituationMonitor
          patients={patients}
          loading={loading}
          onRefresh={() => loadData(true)}
          onOpenRegisterPatient={() => setRegisterModalOpen(true)}
        />
      )}

      {/* MODAL: Register & Admit Patient */}
      {registerModalOpen && (
        <Modal
          isOpen={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          title="Register & Admit New Patient"
        >
          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="text"
                placeholder="e.g. Johnathan Vance"
                value={patientForm.name}
                onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={patientForm.date_of_birth}
                  onChange={(e) => setPatientForm({ ...patientForm, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Ward <span className="text-red-500">*</span>
                </label>
                <select
                  value={patientForm.ward}
                  onChange={(e) => handleWardChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {WARDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Bed Designation <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomBed(!useCustomBed)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    {useCustomBed ? 'Available beds' : '+ Custom bed'}
                  </button>
                </div>

                {useCustomBed ? (
                  <Input
                    required
                    type="text"
                    placeholder="e.g. Bed 101 or ICU-02"
                    value={patientForm.bed_number}
                    onChange={(e) => setPatientForm({ ...patientForm, bed_number: e.target.value })}
                  />
                ) : (
                  <div>
                    <select
                      value={patientForm.bed_number}
                      onChange={(e) => setPatientForm({ ...patientForm, bed_number: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {availableBedsForWard.length === 0 && occupiedBedsInWard.length === 0 && (
                        <option value="">No beds configured</option>
                      )}

                      {availableBedsForWard.length > 0 && (
                        <optgroup label={`Available Beds (${availableBedsForWard.length})`}>
                          {availableBedsForWard.map((b) => (
                            <option key={b} value={b}>
                              🟢 {b} (Available)
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {occupiedBedsInWard.length > 0 && (
                        <optgroup label={`Occupied Beds (${occupiedBedsInWard.length})`}>
                          {occupiedBedsInWard.map((occ) => (
                            <option key={occ.bed_number} value={occ.bed_number} disabled>
                              🔴 {occ.bed_number} (Occupied — {occ.patient_name})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>{availableBedsForWard.length} beds available</span>
                      {availableBedsForWard.length === 0 && (
                        <span className="text-red-600 font-bold">Ward is full</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission Diagnosis / Observation Reason <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="text"
                placeholder="e.g. Acute Coronary Syndrome, Post-Op Monitoring"
                value={patientForm.diagnosis}
                onChange={(e) => setPatientForm({ ...patientForm, diagnosis: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact Phone (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. +1 (555) 019-2834"
                value={patientForm.contact}
                onChange={(e) => setPatientForm({ ...patientForm, contact: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setRegisterModalOpen(false)}
                disabled={submittingPatient}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submittingPatient}>
                Admit Patient & Start Monitoring
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
