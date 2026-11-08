import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { Activity, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      toast.success('Signed in successfully.');
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const errData = err.response?.data;
      let msg = errData?.message;
      if (errData?.errors?.email?.[0]) {
        msg = errData.errors.email[0];
      } else if (!msg) {
        msg = err.message || 'Authentication failed. Please check credentials.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">VitalWatch</h1>
              <p className="text-xs text-slate-400">Hospital Portal Sign In</p>
            </div>
          </Link>
        </div>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-white">
          Authorized Hospital Staff Login
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Sign in to access your designated clinical workspace
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-slate-100 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input
                label="Staff Email Address"
                id="email"
                type="email"
                placeholder="staff@vitalwatch.hospital"
                icon={Mail}
                required
                error={errors.email?.message}
                {...register('email', { required: 'Hospital email is required' })}
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Account Password"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  required
                  error={errors.password?.message}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Sign In to Hospital Portal
            </Button>
          </form>

          {/* Registration link */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-600">
            Authorized Nurse or Doctor?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 underline">
              Register with Hospital Badge
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
