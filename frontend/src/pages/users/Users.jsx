import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { UserPlus, Edit, ShieldCheck, RefreshCw } from 'lucide-react';
import { formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(res.data?.data || []);
    } catch {
      toast.error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error('You cannot deactivate your own active session account.');
      return;
    }
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await userService.toggleStatus(user.id, nextStatus);
      toast.success(`Account status set to ${nextStatus}.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed.');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Hospital Staff Accounts & Roles"
        subtitle="Manage doctors, nurses, and hospital system administrators"
        actions={
          <Link to="/users/add">
            <Button icon={UserPlus}>Add Staff Member</Button>
          </Link>
        }
      />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by staff name or email..."
          className="w-full sm:w-72"
        />

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-700"
          >
            <option value="">All Hospital Roles</option>
            <option value="admin">Administrators</option>
            <option value="doctor">Doctors (MD)</option>
            <option value="nurse">Nurses (RN)</option>
          </select>

          <Button size="sm" variant="outline" icon={RefreshCw} onClick={fetchUsers}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving staff registry..." />
      ) : users.length === 0 ? (
        <EmptyState title="No staff members found" description="No user accounts match current criteria." />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3 text-left">Staff Name</th>
                <th className="px-4 py-3 text-left">Email Address</th>
                <th className="px-4 py-3 text-left">Role Tier</th>
                <th className="px-4 py-3 text-center">Account Status</th>
                <th className="px-4 py-3 text-left">Created At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold capitalize text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={u.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(u.created_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/users/${u.id}/edit`}
                        className="p-1 text-slate-400 hover:text-amber-600 rounded transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`text-xs px-2.5 py-0.5 rounded font-semibold border ${
                            u.status === 'active'
                              ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}

