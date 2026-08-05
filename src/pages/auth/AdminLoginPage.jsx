import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { loginAdmin, isAuthenticated, isAdminUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // Redirect if already authenticated as admin
  if (isAuthenticated && isAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    setIsLoading(true);
    const res = await loginAdmin(data.email, data.password);
    setIsLoading(false);
    
    if (res.success) {
      toast.success('Successfully authenticated staff session.');
      navigate('/dashboard');
    } else {
      toast.error(res.error || 'Invalid operational credentials.');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 relative bg-[#FAF6EE] text-[#1A1A1A] font-sans">
      <div className="glass-panel max-w-md w-full rounded-2xl p-8 sm:p-10 relative overflow-hidden shadow-sm border border-[#DED2BE] bg-[#FFFDF8]">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8 border-b border-[#DED2BE] pb-6">
          <div className="p-3 rounded-xl bg-[#2A473E] text-[#FAF6EE] shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#2A473E] font-serif tracking-wide mt-1">The Scriptorium</h2>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#5F5A52]">
            Staff & Operator Credentials Verification
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email input */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-sans font-bold text-[var(--color-archive-green)] uppercase tracking-widest block">
              Operator Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F5A52]" />
              <input
                type="email"
                placeholder="operator@arche.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="w-full pl-12 pr-4 py-3 bg-[#FAF6EE] border border-[#DED2BE] rounded-xl text-sm text-[#1A1A1A] placeholder-[#756F64] focus:outline-none focus:border-[#2A473E] transition-all font-sans"
              />
            </div>
            {errors.email && (
              <span className="text-xs text-[#8A2D3B] font-semibold">{errors.email.message}</span>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-sans font-bold text-[var(--color-archive-green)] uppercase tracking-widest block">
              Security Key Phrase
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F5A52]" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Security key must be at least 6 characters',
                  },
                })}
                className="w-full pl-12 pr-12 py-3 bg-[#FAF6EE] border border-[#DED2BE] rounded-xl text-sm text-[#1A1A1A] placeholder-[#756F64] focus:outline-none focus:border-[#2A473E] transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5F5A52] hover:text-[#1A1A1A] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-[#8A2D3B] font-semibold">{errors.password.message}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-xs font-sans font-bold uppercase tracking-widest text-[#FAF6EE] bg-[#2A473E] hover:bg-[#1E342D] disabled:bg-[#FAF6EE] disabled:text-[#5F5A52] disabled:border-[#DED2BE] border border-transparent disabled:scale-100 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-95 shadow-sm transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Authenticating Session...
              </>
            ) : (
              'Verify Staff Credentials'
            )}
          </button>
        </form>

        {/* Navigation alternatives */}
        <div className="mt-6 pt-4 border-t border-[#DED2BE] flex flex-col items-center gap-2 text-xs">
          <Link to="/login" className="text-[var(--color-archive-green)] hover:underline font-bold">
            Looking for Reader Login?
          </Link>
          <Link to="/" className="text-[var(--color-muted-ink)] hover:underline font-bold">
            ← Back to Public Library
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
