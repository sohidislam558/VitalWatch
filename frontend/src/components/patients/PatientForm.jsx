import React from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';

export default function PatientForm({
  initialValues = {},
  onSubmit,
  loading = false,
  isEdit = false,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: initialValues.name || '',
      date_of_birth: initialValues.date_of_birth || '',
      gender: initialValues.gender || 'male',
      contact: initialValues.contact || '',
      address: initialValues.address || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Patient Full Name"
        id="name"
        placeholder="e.g. Johnathan Doe"
        required
        error={errors.name?.message}
        {...register('name', { required: 'Patient full name is required' })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date of Birth"
          id="date_of_birth"
          type="date"
          required
          error={errors.date_of_birth?.message}
          {...register('date_of_birth', { required: 'Date of birth is required' })}
        />

        <Select
          label="Biological Gender"
          id="gender"
          required
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
          error={errors.gender?.message}
          {...register('gender', { required: 'Please select gender' })}
        />
      </div>

      <Input
        label="Emergency Contact Phone"
        id="contact"
        placeholder="+1 (555) 000-0000"
        error={errors.contact?.message}
        {...register('contact')}
      />

      <Textarea
        label="Residential Address"
        id="address"
        placeholder="Enter home address..."
        rows={2}
        error={errors.address?.message}
        {...register('address')}
      />

      <div className="pt-2 flex justify-end gap-3">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Patient Information' : 'Register New Patient'}
        </Button>
      </div>
    </form>
  );
}

