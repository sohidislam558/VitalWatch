import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { admissionService } from '../../services/admissionService';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../hooks/useAuth';
import { canRecordVitals, canDischargePatient, canAdmitPatient, canDeletePatient } from '../../utils/permissions';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import PatientDetailsCard from '../../components/patients/PatientDetailsCard';
import VitalSummaryCard from '../../components/vitals/VitalSummaryCard';
import VitalChart from '../../components/vitals/VitalChart';
import VitalHistoryTable from '../../components/vitals/VitalHistoryTable';
import AdmissionForm from '../../components/patients/AdmissionForm';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { PlusCircle, FileText, Download, Bed, History, AlertTriangle, Trash2 } from 'lucide-react';
import { formatDateTime } from '../../utils/formatDate';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

export default function PatientDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Modals
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [dischargeTarget, setDischargeTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'charts' | 'vitals' | 'admissions' | 'alerts'

  const loadPatient = useCallback(async () => {
    try {
      const res = await patientService.getPatient(id);
      setPatient(res.data);
    } catch {
      toast.error('Failed to load patient profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await reportService.downloadReportPdf(id);
      toast.success('Patient report PDF downloaded.');
    } catch {
      toast.error('Failed to generate PDF report.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDischargeConfirm = async () => {
    if (!dischargeTarget) return;
    setActionLoading(true);
    try {
      await admissionService.dischargePatient(dischargeTarget.id);
      toast.success('Patient has been formally discharged.');
      setDischargeTarget(null);
      loadPatient();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to discharge patient.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdmitSubmit = async (formData) => {
    setActionLoading(true);
    try {
      await admissionService.admitPatient(formData);
      toast.success('Patient admitted to ward successfully.');
      setAdmitModalOpen(false);
      loadPatient();
    } catch (err) {
      const msg = err.response?.data?.errors?.patient_id?.[0] || err.response?.data?.message || 'Admission failed.';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    setDeleteLoading(true);
    try {
      await patientService.deletePatient(id);
      toast.success(`Patient ${patient.patient_code} (${patient.name}) deleted successfully.`);
      navigate('/patients');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete patient record.');
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Retrieving complete patient history..." />
      </PageContainer>
    );
  }

  if (!patient) return null;

  const activeAdm = patient.active_admission;
  const latestVital = patient.latest_vital_record;
  const vitalRecords = patient.vital_records || [];
  const admissions = patient.admissions || [];
  const alerts = patient.alerts || [];

  return (
    <PageContainer>
      <PageHeader
        title={`${patient.name} (${patient.patient_code})`}
        subtitle="Comprehensive clinical chart and historical observations"
        actions={
          <div className="flex items-center gap-2">
            {activeAdm && canRecordVitals(user) && (
              <Link to={`/vitals/add?patient_id=${patient.id}`}>
                <Button size="sm" icon={PlusCircle}>
                  Record Vital Signs
                </Button>
              </Link>
            )}

            {!activeAdm && canAdmitPatient(user) && (
              <Button size="sm" icon={Bed} onClick={() => setAdmitModalOpen(true)}>
                Admit to Ward
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              icon={Download}
              onClick={handleDownloadPdf}
              loading={downloadingPdf}
            >
              Export PDF
            </Button>

            {canDeletePatient(user) && (
              <Button
                size="sm"
                variant="danger"
                icon={Trash2}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete Patient
              </Button>
            )}
          </div>
        }
      />

      {/* Patient Demographic Card */}
      <div className="mb-6">
        <PatientDetailsCard
          patient={patient}
          canDischarge={canDischargePatient(user)}
          onDischarge={(adm) => setDischargeTarget(adm)}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6 flex gap-6 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Telemetry Overview' },
          { id: 'charts', label: `Trend Charts (${vitalRecords.length})` },
          { id: 'vitals', label: `Vital Measurements (${vitalRecords.length})` },
          { id: 'alerts', label: `Early Warning Alerts (${alerts.length})` },
          { id: 'admissions', label: `Admission History (${admissions.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <VitalSummaryCard latestReading={latestVital} />
          <VitalChart records={vitalRecords} />
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Recent Measurement Logs</h3>
              <button
                type="button"
                onClick={() => setActiveTab('vitals')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                View Complete Log &rarr;
              </button>
            </div>
            <VitalHistoryTable vitals={vitalRecords.slice(0, 5)} />
          </div>
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="space-y-6">
          <VitalChart records={vitalRecords} />
        </div>
      )}

      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <VitalHistoryTable vitals={vitalRecords} />
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3 text-left">Triggered</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Message</th>
                <th className="px-4 py-3 text-left">Staff Triage Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-slate-500">
                    No alert events recorded for this patient.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDateTime(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.priority} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.message}</td>
                    <td className="px-4 py-3 text-slate-600 text-[11px]">
                      {a.acknowledgements?.length > 0 ? (
                        a.acknowledgements.map((ack, i) => (
                          <div key={i}>
                            <strong>{ack.user?.name}:</strong> {ack.note || 'Acknowledged'}
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No notes</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'admissions' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3 text-left">Admission Period</th>
                <th className="px-4 py-3 text-left">Hospital Ward</th>
                <th className="px-4 py-3 text-left">Bed Number</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admissions.map((adm) => (
                <tr key={adm.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatDateTime(adm.admitted_at)} &rarr;{' '}
                    {adm.discharged_at ? formatDateTime(adm.discharged_at) : <span className="text-blue-600 font-bold">Present</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{adm.ward}</td>
                  <td className="px-4 py-3 text-slate-700 font-mono">{adm.bed_number}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={adm.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admit Modal */}
      <Modal
        isOpen={admitModalOpen}
        onClose={() => setAdmitModalOpen(false)}
        title="Admit Patient to Ward"
        subtitle={`Patient: ${patient.patient_code} — ${patient.name}`}
      >
        <AdmissionForm
          defaultPatientId={patient.id}
          onSubmit={handleAdmitSubmit}
          loading={actionLoading}
        />
      </Modal>

      {/* Discharge Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!dischargeTarget}
        onClose={() => setDischargeTarget(null)}
        onConfirm={handleDischargeConfirm}
        title="Confirm Formal Patient Discharge"
        message={`Are you sure you want to formally discharge patient ${patient.name} from ${dischargeTarget?.ward} (Bed: ${dischargeTarget?.bed_number})? This will close active telemetry monitoring and release the bed.`}
        confirmText="Confirm Discharge"
        variant="danger"
        loading={actionLoading}
      />

      {/* Admin Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeletePatient}
        title="Permanently Delete Patient Record"
        message={`Are you sure you want to permanently delete patient ${patient.name} (${patient.patient_code}) and all associated admissions, vital signs, and alerts? This action is permanent and cannot be undone.`}
        confirmText="Delete Patient"
        confirmLabel="Delete Patient"
        variant="danger"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </PageContainer>
  );
}

