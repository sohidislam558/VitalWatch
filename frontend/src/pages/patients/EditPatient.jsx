import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import PatientForm from '../../components/patients/PatientForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await patientService.getPatient(id);
        setPatient(res.data);
      } catch {
        toast.error('Patient record not found.');
        navigate('/patients');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    setSaveLoading(true);
    try {
      await patientService.updatePatient(id, formData);
      toast.success('Patient record updated successfully.');
      navigate(`/patients/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Retrieving patient record..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Patient: ${patient?.patient_code}`}
        subtitle={`Updating demographic information for ${patient?.name}`}
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 max-w-2xl mx-auto">
        <PatientForm
          initialValues={patient}
          onSubmit={handleSubmit}
          loading={saveLoading}
          isEdit
        />
      </div>
    </PageContainer>
  );
}

