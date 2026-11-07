import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admissionService } from '../../services/admissionService';
import { patientService } from '../../services/patientService';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import AdmissionForm from '../../components/patients/AdmissionForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AddAdmission() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Fetch patients who are not currently admitted
        const res = await patientService.getPatients({ status: 'discharged', per_page: 50 });
        setPatients(res.data?.data || []);
      } catch {
        toast.error('Failed to load eligible patient list.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (formData) => {
    setSaveLoading(true);
    try {
      const res = await admissionService.admitPatient(formData);
      toast.success('Patient admitted to ward successfully.');
      navigate(`/admissions/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.errors?.patient_id?.[0] || err.response?.data?.message || 'Admission failed.';
      toast.error(msg);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Hospital Ward Admission"
        subtitle="Assign an inpatient to a monitored ward and bed"
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 max-w-xl mx-auto">
        {loading ? (
          <LoadingSpinner text="Retrieving patient candidate roster..." />
        ) : (
          <AdmissionForm
            patients={patients}
            onSubmit={handleSubmit}
            loading={saveLoading}
          />
        )}
      </div>
    </PageContainer>
  );
}

