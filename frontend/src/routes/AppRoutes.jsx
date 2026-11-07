import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../hooks/useAuth';

// Public & Auth Pages
import LandingPage from '../pages/public/LandingPage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Unauthorized from '../pages/auth/Unauthorized';

// Clinical Pages
import Dashboard from '../pages/dashboard/Dashboard';
import Patients from '../pages/patients/Patients';
import AddPatient from '../pages/patients/AddPatient';
import EditPatient from '../pages/patients/EditPatient';
import PatientDetails from '../pages/patients/PatientDetails';

import Admissions from '../pages/admissions/Admissions';
import AddAdmission from '../pages/admissions/AddAdmission';
import AdmissionDetails from '../pages/admissions/AdmissionDetails';

import AddVitals from '../pages/vitals/AddVitals';
import VitalHistory from '../pages/vitals/VitalHistory';

import Alerts from '../pages/alerts/Alerts';
import AlertDetails from '../pages/alerts/AlertDetails';

import Reports from '../pages/reports/Reports';

// Administration & Settings
import Users from '../pages/users/Users';
import AddUser from '../pages/users/AddUser';
import EditUser from '../pages/users/EditUser';

import AlertRules from '../pages/settings/AlertRules';
import EmailSettings from '../pages/settings/EmailSettings';
import ProfileSettings from '../pages/settings/ProfileSettings';

import NotFound from '../pages/errors/NotFound';

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Landing & Authentication Routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Clinical App Shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Patients */}
        <Route path="patients" element={<Patients />} />
        <Route
          path="patients/add"
          element={
            <RoleRoute allowedRoles={['admin', 'nurse']}>
              <AddPatient />
            </RoleRoute>
          }
        />
        <Route path="patients/:id" element={<PatientDetails />} />
        <Route
          path="patients/:id/edit"
          element={
            <RoleRoute allowedRoles={['admin', 'nurse']}>
              <EditPatient />
            </RoleRoute>
          }
        />

        {/* Admissions */}
        <Route path="admissions" element={<Admissions />} />
        <Route
          path="admissions/add"
          element={
            <RoleRoute allowedRoles={['admin', 'nurse']}>
              <AddAdmission />
            </RoleRoute>
          }
        />
        <Route path="admissions/:id" element={<AdmissionDetails />} />

        {/* Vital Signs */}
        <Route
          path="vitals/add"
          element={
            <RoleRoute allowedRoles={['admin', 'nurse']}>
              <AddVitals />
            </RoleRoute>
          }
        />
        <Route path="vitals/history" element={<VitalHistory />} />

        {/* Early Warning Alerts */}
        <Route path="alerts" element={<Alerts />} />
        <Route path="alerts/:id" element={<AlertDetails />} />

        {/* Reports */}
        <Route path="reports" element={<Reports />} />

        {/* Administration: Users (Admin Only) */}
        <Route
          path="users"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <Users />
            </RoleRoute>
          }
        />
        <Route
          path="users/add"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AddUser />
            </RoleRoute>
          }
        />
        <Route
          path="users/:id/edit"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <EditUser />
            </RoleRoute>
          }
        />

        {/* Settings */}
        <Route path="settings/rules" element={<AlertRules />} />
        <Route path="settings/email" element={<EmailSettings />} />
        <Route path="settings/profile" element={<ProfileSettings />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

