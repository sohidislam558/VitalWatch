import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { userService } from '../../services/userService';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export default function AddUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'nurse',
      status: 'active',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await userService.createUser(data);
      toast.success('Staff user created successfully.');
      navigate('/users');
    } catch (err) {
      const msg = err.response?.data?.errors?.email?.[0] || err.response?.data?.message || 'Failed to create user.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Provision New Staff Account"
        subtitle="Add a healthcare professional or administrator to VitalWatch"
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Staff Full Name & Title"
            id="name"
            placeholder="e.g. Dr. Emily Thorne, MD"
            required
            error={errors.name?.message}
            {...register('name', { required: 'Full name is required' })}
          />

          <Input
            label="Hospital Email Address"
            id="email"
            type="email"
            placeholder="e.g. emily.thorne@vitalwatch.hospital"
            required
            error={errors.email?.message}
            {...register('email', { required: 'Email address is required' })}
          />

          <Input
            label="Temporary Initial Password"
            id="password"
            type="password"
            placeholder="Minimum 8 characters"
            required
            helperText="The user will use this password to sign in."
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
            })}
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
              error={errors.role?.message}
              {...register('role', { required: 'Role tier is required' })}
            />

            <Select
              label="Initial Account Status"
              id="status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              {...register('status')}
            />
          </div>

          <div className="pt-3 flex justify-end">
            <Button type="submit" loading={loading}>
              Create Staff Account
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

