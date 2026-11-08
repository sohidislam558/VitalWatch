import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { admissionService } from '../../services/admissionService';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { canRegisterPatient, canAdmitPatient } from '../../utils/permissions';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import PatientTable from '../../components/patients/PatientTable';
import AdmissionForm from '../../components/patients/AdmissionForm';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SearchInput from '../../components/common/SearchInput';
import WardFilter from '../../components/dashboard/WardFilter';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import { UserPlus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ward, setWard] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination hook
  const { page, perPage, totalPages, totalItems, setPage, updatePaginationData } = usePagination(1, 10);

  // Quick Admission modal
  const [admitPatientTarget, setAdmitPatientTarget] = useState(null);
  const [admitLoading, setAdmitLoading] = useState(false);

  // Admin Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientService.getPatients({
        search: search || undefined,
        ward: ward || undefined,
        status: statusFilter || undefined,
        page,
        per_page: perPage,
      });
      setPatients(res.data?.data || []);
      updatePaginationData(res.data);
    } catch {
      toast.error('Failed to load patient records.');
    } finally {
      setLoading(false);
    }
  }, [search, ward, statusFilter, page, perPage]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleQuickAdmit = async (formData) => {
    setAdmitLoading(true);
    try {
      await admissionService.admitPatient(formData);
      toast.success('Patient admitted to ward successfully.');
      setAdmitPatientTarget(null);
      fetchPatients();
    } catch (err) {
      const msg = err.response?.data?.errors?.patient_id?.[0] || err.response?.data?.message || 'Admission failed.';
      toast.error(msg);
    } finally {
      setAdmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await patientService.deletePatient(deleteTarget.id);
      toast.success(`Patient ${deleteTarget.patient_code} (${deleteTarget.name}) deleted successfully.`);
      setDeleteTarget(null);
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete patient record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Hospital Patient Directory"
        subtitle="Master patient index, ward admissions, and monitoring profiles"
        actions={
          canRegisterPatient(user) && (
            <Link to="/patients/add">
              <Button icon={UserPlus}>Register New Patient</Button>
            </Link>
          )
        }
      />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by patient name, code, contact..."
          className="w-full sm:w-72"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <WardFilter
            selectedWard={ward}
            onChange={(w) => {
              setWard(w);
              setPage(1);
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="admitted">Currently Admitted</option>
            <option value="discharged">Discharged</option>
          </select>
        </div>
      </div>

      <PatientTable
        patients={patients}
        loading={loading}
        onAdmit={canAdmitPatient(user) ? (p) => setAdmitPatientTarget(p) : null}
        onDelete={(p) => setDeleteTarget(p)}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        perPage={perPage}
        onPageChange={setPage}
      />

      {/* Admin Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Permanently Delete Patient Record"
        message={`Are you sure you want to permanently delete patient ${deleteTarget?.name} (${deleteTarget?.patient_code}) and all associated admissions, vital signs, and alerts? This action is irreversible.`}
        confirmLabel="Delete Patient"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Quick Admit Modal */}
      <Modal
        isOpen={!!admitPatientTarget}
        onClose={() => setAdmitPatientTarget(null)}
        title="Admit Patient to Hospital Ward"
        subtitle={`Patient: ${admitPatientTarget?.patient_code} — ${admitPatientTarget?.name}`}
      >
        {admitPatientTarget && (
          <AdmissionForm
            defaultPatientId={admitPatientTarget.id}
            onSubmit={handleQuickAdmit}
            loading={admitLoading}
          />
        )}
      </Modal>
    </PageContainer>
  );
}

