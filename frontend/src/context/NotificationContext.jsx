import React, { createContext, useContext, useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { dashboardService } from '../services/settingsService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  const fetchAlertCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await dashboardService.getActiveAlerts({ limit: 1 });
      // Total active alerts
      const summary = await dashboardService.getSummary();
      setUnreadAlertCount(summary.data?.active_alerts || 0);
    } catch {
      // Background poll failure handled gracefully
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlertCount();
      const interval = setInterval(fetchAlertCount, 30000); // 30s background refresh
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);
  const notifyWarning = (message) => toast(message, { icon: '⚠️' });

  return (
    <NotificationContext.Provider
      value={{
        unreadAlertCount,
        refreshAlerts: fetchAlertCount,
        notifySuccess,
        notifyError,
        notifyWarning,
      }}
    >
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

