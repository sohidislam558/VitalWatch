import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import {
  Activity,
  Lock,
  Mail,
  User,
  Stethoscope,
  HeartHandshake,
  ShieldCheck,
  Eye,
  EyeOff,
  ShieldAlert,
  BadgeAlert,
  Info,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      hospital_id_number: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'nurse',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    if (data.password !== data.password_confirmation) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!data.hospital_id_number?.trim()) {
      toast.error('Hospital Identity Number is required for staff verification.');
      return;
    }

    setLoading(true);
    try {
      await authRegister({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        hospital_id_number: data.hospital_id_number.trim().toUpperCase(),
        password: data.password,
        role: data.role,
      });

      toast.success('Hospital badge verified! Staff account registered successfully.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      const errData = err.response?.data;
      let msg = errData?.message;
      if (errData?.errors) {
        const firstKey = Object.keys(errData.errors)[0];
        if (firstKey && errData.errors[firstKey]?.[0]) {
          msg = errData.errors[firstKey][0];
        }
      }
      if (!msg) {
        msg = err.message || 'Registration failed. Please check form data.';
      }
      toast.error(msg, { duration: 7000 });
    } finally {
      setLoading(false);
    }
  };

  const fillBadge = (badge) => {
    setValue('hospital_id_number', badge);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">VitalWatch</h1>
              <p className="text-xs text-slate-400">Hospital Medical Staff Verification</p>
            </div>
          </Link>
        </div>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-white">
          Medical Staff Registration
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Hospital Identity Verification required. Administrator accounts cannot be self-registered.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-slate-100 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Role Selection Cards (Nurse or Doctor ONLY - No Admin) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Medical Role Selection <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nurse */}
                <div
                  onClick={() => {
                    setValue('role', 'nurse');
                    setValue('hospital_id_number', '');
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    selectedRole === 'nurse'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedRole === 'nurse' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Registered Nurse / Caregiver</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Record bedside vital signs & observe plain-English patient telemetry.
                    </div>
                  </div>
                </div>

                {/* Doctor */}
                <div
                  onClick={() => {
                    setValue('role', 'doctor');
                    setValue('hospital_id_number', '');
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    selectedRole === 'doctor'
                      ? 'border-cyan-600 bg-cyan-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedRole === 'doctor' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Registered Doctor / Physician</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Read-only vitals, Gmail SMTP alerts & 'Doctor in Action' bedside response.
                    </div>
                  </div>
                </div>
              </div>
              <input type="hidden" {...register('role', { required: true })} />
            </div>

            {/* Hospital Identity Number Verification Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Hospital Identity Number (Badge / Staff ID) <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Staff Registry</span>
                </span>
              </div>
              <Input
                id="hospital_id_number"
                type="text"
                placeholder={selectedRole === 'doctor' ? 'e.g. VW-DOC-1001' : 'e.g. VW-NUR-2001'}
                icon={ShieldCheck}
                required
                error={errors.hospital_id_number?.message}
                {...register('hospital_id_number', {
                  required: 'Hospital Identity Number is required to verify employment.',
                })}
              />

              {/* Quick Sample Badges Helper */}
              <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] flex flex-col gap-1.5">
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>Sample Authorized Hospital Badges in Registry:</span>
                </div>
                {selectedRole === 'nurse' ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['VW-NUR-2001', 'VW-NUR-2002', 'VW-NUR-2003', 'VW-NUR-2004'].map((badge) => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => fillBadge(badge)}
                        className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded font-mono text-[10px] text-blue-700 font-bold transition-colors"
                      >
                        {badge}
                      </button>
                    ))}
                    <span className="text-[10px] text-slate-400">(Click to auto-fill)</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['VW-DOC-1001', 'VW-DOC-1002', 'VW-DOC-1003', 'VW-DOC-1004'].map((badge) => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => fillBadge(badge)}
                        className="px-2 py-0.5 bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 rounded font-mono text-[10px] text-cyan-700 font-bold transition-colors"
                      >
                        {badge}
                      </button>
                    ))}
                    <span className="text-[10px] text-slate-400">(Click to auto-fill)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <Input
                label="Full Staff Name"
                id="name"
                type="text"
                placeholder={
                  selectedRole === 'doctor'
                    ? 'Dr. Gregory House, MD'
                    : 'Nurse Florence Nightingale, RN'
                }
                icon={User}
                required
                error={errors.name?.message}
                {...register('name', { required: 'Full name is required' })}
              />
            </div>

            {/* Email */}
            <div>
              <Input
                label="Hospital Email Address"
                id="email"
                type="email"
                placeholder="staff.name@vitalwatch.hospital"
                icon={Mail}
                required
                error={errors.email?.message}
                {...register('email', { required: 'Hospital email is required' })}
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Password (min 8 chars)"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  required
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  id="password_confirmation"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  required
                  error={errors.password_confirmation?.message}
                  {...register('password_confirmation', { required: 'Please confirm password' })}
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Verify Hospital Badge & Activate Account
            </Button>
          </form>

          {/* Back to Login link */}
          <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 underline">
              Sign In to Hospital Portal
            </Link>
          </div>
        </div>

        {/* Notice on Administrator accounts */}
        <div className="mt-5 flex items-start gap-2.5 px-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-400 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Security Notice:</strong> Hospital administrator accounts are pre-seeded and cannot be created via public registration.
          </p>
        </div>
      </div>
    </div>
  );
}
