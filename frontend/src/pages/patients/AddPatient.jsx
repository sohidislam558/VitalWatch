import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import PatientForm from '../../components/patients/PatientForm';
import toast from 'react-hot-toast';

export default function AddPatient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await patientService.createPatient(data);
      toast.success('Patient registered successfully.');
      navigate(`/patients/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register patient.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Register New Hospital Patient"
        subtitle="Add a new patient to the master hospital database"
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 max-w-2xl mx-auto">
        <PatientForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </PageContainer>
  );
}

