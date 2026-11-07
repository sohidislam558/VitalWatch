import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { admissionService } from '../../services/admissionService';
import { useAuth } from '../../hooks/useAuth';
import { usePagination } from '../../hooks/usePagination';
import { canAdmitPatient, canDischargePatient } from '../../utils/permissions';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import WardFilter from '../../components/dashboard/WardFilter';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { Bed, Plus, Eye, LogOut } from 'lucide-react';
import { formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function Admissions() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [ward, setWard] = useState('');
  const [status, setStatus] = useState('admitted'); // default view active

  // Pagination
  const { page, perPage, totalPages, totalItems, setPage, updatePaginationData } = usePagination(1, 10);

  // Discharge target
  const [dischargeTarget, setDischargeTarget] = useState(null);
  const [dischargeLoading, setDischargeLoading] = useState(false);

  const fetchAdmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await admissionService.getAdmissions({
        search: search || undefined,
        ward: ward || undefined,
        status: status || undefined,
        page,
        per_page: perPage,
      });
      setAdmissions(res.data?.data || []);
      updatePaginationData(res.data);
    } catch {
      toast.error('Failed to load admissions.');
    } finally {
      setLoading(false);
    }
  }, [search, ward, status, page, perPage]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  const handleDischargeConfirm = async () => {
    if (!dischargeTarget) return;
    setDischargeLoading(true);
    try {
      await admissionService.dischargePatient(dischargeTarget.id);
      toast.success('Patient discharged successfully.');
      setDischargeTarget(null);
      fetchAdmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Discharge failed.');
    } finally {
      setDischargeLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Ward Admissions & Bed Allocations"
        subtitle="Current inpatient assignments and discharge administration"
        actions={
          canAdmitPatient(user) && (
            <Link to="/admissions/add">
              <Button icon={Plus}>New Admission</Button>
            </Link>
          )
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by patient name or code..."
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
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-700"
          >
            <option value="">All Admissions</option>
            <option value="admitted">Currently Admitted</option>
            <option value="discharged">Discharged</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving admissions data..." />
      ) : admissions.length === 0 ? (
        <EmptyState title="No admissions found" description="No inpatient records match the current filter criteria." />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">Patient Code</th>
                  <th className="px-4 py-3 text-left">Patient Full Name</th>
                  <th className="px-4 py-3 text-left">Hospital Ward</th>
                  <th className="px-4 py-3 text-left">Bed</th>
                  <th className="px-4 py-3 text-left">Admitted At</th>
                  <th className="px-4 py-3 text-left">Discharged At</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {admissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      <Link to={`/patients/${adm.patient_id}`} className="hover:text-blue-600">
                        {adm.patient?.patient_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{adm.patient?.name}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{adm.ward}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">{adm.bed_number}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDateTime(adm.admitted_at)}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {adm.discharged_at ? formatDateTime(adm.discharged_at) : <span className="text-blue-600 font-semibold">Active</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={adm.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admissions/${adm.id}`}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {adm.status === 'admitted' && canDischargePatient(user) && (
                          <button
                            type="button"
                            onClick={() => setDischargeTarget(adm)}
                            className="text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded font-semibold"
                          >
                            Discharge
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        perPage={perPage}
        onPageChange={setPage}
      />

      <ConfirmDialog
        isOpen={!!dischargeTarget}
        onClose={() => setDischargeTarget(null)}
        onConfirm={handleDischargeConfirm}
        title="Confirm Patient Discharge"
        message={`Discharge ${dischargeTarget?.patient?.name} from ${dischargeTarget?.ward} (Bed: ${dischargeTarget?.bed_number})?`}
        confirmText="Discharge Patient"
        variant="danger"
        loading={dischargeLoading}
      />
    </PageContainer>
  );
}
