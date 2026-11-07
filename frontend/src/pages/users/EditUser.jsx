import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { userService } from '../../services/userService';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    async function load() {
      try {
        const res = await userService.getUser(id);
        const u = res.data;
        reset({
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          password: '',
        });
      } catch {
        toast.error('User account not found.');
        navigate('/users');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, reset, navigate]);

  const onSubmit = async (data) => {
    setSaveLoading(true);
    try {
      if (!data.password) {
        delete data.password;
      }
      await userService.updateUser(id, data);
      toast.success('Staff details updated successfully.');
      navigate('/users');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Retrieving account data..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Update Staff Account"
        subtitle="Modify permissions and staff information"
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Staff Full Name"
            id="name"
            required
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />

          <Input
            label="Email Address"
            id="email"
            type="email"
            required
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />

          <Input
            label="Reset Password (Leave blank to keep unchanged)"
            id="password"
            type="password"
            placeholder="••••••••"
            helperText="Only fill if you wish to overwrite the current password."
            {...register('password')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Staff Role Tier"
              id="role"
              required
              options={[
                { value: 'nurse', label: 'Ward Nurse (RN)' },
                { value: 'doctor', label: 'Attending Physician (MD)' },
                { value: 'admin', label: 'Hospital Administrator' },
              ]}
              {...register('role')}
            />

            <Select
              label="Account Status"
              id="status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              {...register('status')}
            />
          </div>

          <div className="pt-3 flex justify-end">
            <Button type="submit" loading={saveLoading}>
              Save Account Changes
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

