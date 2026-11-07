import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { admissionService } from '../../services/admissionService';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import VitalHistoryTable from '../../components/vitals/VitalHistoryTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatDate';
import { Bed, Calendar, User, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdmissionDetails() {
  const { id } = useParams();
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await admissionService.getAdmission(id);
        setAdmission(res.data);
      } catch {
        toast.error('Admission record not found.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Retrieving admission details..." />
      </PageContainer>
    );
  }

  if (!admission) return null;

  return (
    <PageContainer>
      <PageHeader
        title={`Admission #${admission.id}: ${admission.ward}`}
        subtitle={`Patient: ${admission.patient?.patient_code} — ${admission.patient?.name}`}
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{admission.ward}</h3>
              <p className="text-xs text-slate-500 font-mono">Bed Assignment: {admission.bed_number}</p>
            </div>
          </div>
          <StatusBadge status={admission.status} size="md" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Admitted Time</span>
            <strong className="text-slate-800">{formatDateTime(admission.admitted_at)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Discharge Time</span>
            <strong className="text-slate-800">
              {admission.discharged_at ? formatDateTime(admission.discharged_at) : 'Active Admission'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Patient Profile</span>
            <Link to={`/patients/${admission.patient_id}`} className="text-blue-600 font-bold hover:underline">
              {admission.patient?.name} ({admission.patient?.patient_code})
            </Link>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Total Vitals Recorded</span>
            <strong className="text-slate-800">{admission.vital_records?.length || 0} measurements</strong>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Vital Signs Observations During This Admission</h3>
        <VitalHistoryTable vitals={admission.vital_records || []} />
      </div>
    </PageContainer>
  );
}

