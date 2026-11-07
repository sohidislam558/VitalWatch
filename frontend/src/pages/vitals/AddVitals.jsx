import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { vitalService } from '../../services/vitalService';
import { useNotification } from '../../context/NotificationContext';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import VitalEntryForm from '../../components/vitals/VitalEntryForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Select from '../../components/common/Select';
import toast from 'react-hot-toast';

export default function AddVitals() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshAlerts } = useNotification();

  const preselectedPatientId = searchParams.get('patient_id');

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Load admitted patients list
  useEffect(() => {
    async function loadAdmitted() {
      try {
        const res = await patientService.getPatients({ status: 'admitted', per_page: 50 });
        const list = res.data?.data || [];
        setPatients(list);

        if (preselectedPatientId) {
          const match = list.find((p) => p.id === Number(preselectedPatientId));
          if (match) {
            setPatientData(match);
          } else {
            // Fetch directly
            const single = await patientService.getPatient(preselectedPatientId);
            setPatientData(single.data);
          }
        } else if (list.length > 0) {
          setSelectedPatientId(list[0].id);
          setPatientData(list[0]);
        }
      } catch {
        toast.error('Failed to load admitted patients list.');
      } finally {
        setLoading(false);
      }
    }
    loadAdmitted();
  }, [preselectedPatientId]);

  const handlePatientSelect = async (patientId) => {
    setSelectedPatientId(patientId);
    if (!patientId) {
      setPatientData(null);
      return;
    }
    try {
      const res = await patientService.getPatient(patientId);
      setPatientData(res.data);
    } catch {
      toast.error('Failed to load patient record.');
    }
  };

  const handleRecordSubmit = async (formData) => {
    setSaveLoading(true);
    try {
      const res = await vitalService.recordVitals(formData);
      const alerts = res.data?.alerts_triggered || [];

      if (alerts.length > 0) {
        toast(
          `Vital signs recorded. ${alerts.length} Early Warning Alert(s) generated!`,
          { icon: '⚠️', duration: 6000 }
        );
        refreshAlerts();
      } else {
        toast.success('Vital signs recorded successfully. All values within normal boundaries.');
      }

      navigate(`/patients/${patientData.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record vital signs.';
      toast.error(msg);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Loading patient admission list..." />
      </PageContainer>
    );
  }

  if (patients.length === 0 && !patientData) {
    return (
      <PageContainer>
        <EmptyState
          title="No Admitted Patients Available"
          description="Patients must have an active ward admission to record bedside vital signs."
          actionLabel="View Patient Directory"
          onAction={() => navigate('/patients')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Bedside Manual Vital Signs Recording"
        subtitle="Record routine rounding observations and evaluate early warning triggers"
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <Select
            label="Select Monitored Inpatient"
            id="patient_select"
            value={selectedPatientId}
            onChange={(e) => handlePatientSelect(e.target.value)}
            options={patients.map((p) => ({
              value: p.id,
              label: `${p.patient_code} — ${p.name} (${p.active_admission?.ward || 'Ward'}, Bed ${p.active_admission?.bed_number || 'N/A'})`,
            }))}
            required
          />
        </div>

        {patientData && patientData.active_admission ? (
          <VitalEntryForm
            key={patientData.id}
            patient={patientData}
            onSubmit={handleRecordSubmit}
            loading={saveLoading}
          />
        ) : (
          <div className="p-4 bg-amber-50 text-amber-800 text-xs rounded-md">
            The selected patient does not have an active ward admission. Please select an admitted patient.
          </div>
        )}
      </div>
    </PageContainer>
  );
}

