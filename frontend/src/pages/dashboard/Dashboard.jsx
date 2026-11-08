import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import NursePortal from '../nurse/NursePortal';
import DoctorPortal from '../doctor/DoctorPortal';
import AdminPortal from '../admin/AdminPortal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-12">
        <LoadingSpinner text="Checking hospital staff authorization..." />
      </div>
    );
  }

  return (
    <div>
      {user?.role === 'nurse' && <NursePortal />}
      {user?.role === 'doctor' && <DoctorPortal />}
      {user?.role === 'admin' && <AdminPortal />}
      {!['nurse', 'doctor', 'admin'].includes(user?.role) && <AdminPortal />}
    </div>
  );
}
