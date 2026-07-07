'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useToastStore } from '@/store/toastStore';
import PublicRoute from '@/components/PublicRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[@$!%*?&#]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const addToast = useToastStore((state) => state.addToast);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password', '');
  const confirmPassword = watch('confirmPassword', '');

  useEffect(() => {
    if (!email) {
      addToast('No email address provided for password reset.', 'error');
      router.push('/forgot-password');
    }
  }, [email, router, addToast]);

  if (!email) {
    return null;
  }

  // Real-time indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const onSubmit = async (data: ResetPasswordValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password/reset', {
        email,
        otp: data.otp,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      addToast(response.data.message || 'Password reset successfully. Please log in.', 'success');
      router.push('/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Failed to reset password.';
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await api.post('/auth/resend-otp', {
        email,
        type: 'forgot_password',
      });
      addToast(response.data.message || 'Reset code resent successfully.', 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Failed to resend reset code.';
      addToast(errMsg, 'error');
    }
  };

  return (
    <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-900 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-100">Reset Password</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Provide the 6-digit OTP code sent to{' '}
          <span className="text-neutral-300 font-semibold">{email}</span> and configure a new
          password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* OTP Code */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="otp" className="text-xs font-semibold text-neutral-400">
              6-Digit OTP Code
            </Label>
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-xs text-red-500 hover:text-red-400 font-medium transition-all"
            >
              Resend Code?
            </button>
          </div>
          <Input
            id="otp"
            type="text"
            maxLength={6}
            placeholder="123456"
            className="w-full bg-neutral-950/50 border-neutral-900 text-neutral-100 placeholder:text-neutral-700 focus:border-red-500 focus:ring-red-950/40 text-center tracking-widest text-lg font-bold"
            disabled={isLoading}
            {...register('otp')}
          />
          {errors.otp && (
            <span className="text-xs font-medium text-red-500">{errors.otp.message}</span>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-neutral-400">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full bg-neutral-950/50 border-neutral-900 text-neutral-100 placeholder:text-neutral-700 focus:border-red-500 focus:ring-red-950/40 pr-10"
              disabled={isLoading}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs font-medium text-red-500">{errors.password.message}</span>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-neutral-400">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full bg-neutral-950/50 border-neutral-900 text-neutral-100 placeholder:text-neutral-700 focus:border-red-500 focus:ring-red-950/40"
            disabled={isLoading}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <span className="text-xs font-medium text-red-500">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {/* Real-time Checklist for strong password */}
        {password.length > 0 && (
          <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-900/60 space-y-2 mt-2 text-xs">
            <p className="font-semibold text-neutral-400 mb-1">Password must include:</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-red-500 shrink-0" />
                )}
                <span className={hasMinLength ? 'text-emerald-500' : 'text-neutral-500'}>
                  8+ Characters
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasUppercase ? (
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-red-500 shrink-0" />
                )}
                <span className={hasUppercase ? 'text-emerald-500' : 'text-neutral-500'}>
                  Uppercase Letter
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasLowercase ? (
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-red-500 shrink-0" />
                )}
                <span className={hasLowercase ? 'text-emerald-500' : 'text-neutral-500'}>
                  Lowercase Letter
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasNumber ? (
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-red-500 shrink-0" />
                )}
                <span className={hasNumber ? 'text-emerald-500' : 'text-neutral-500'}>
                  One Digit
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasSpecial ? (
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-red-500 shrink-0" />
                )}
                <span className={hasSpecial ? 'text-emerald-500' : 'text-neutral-500'}>
                  Special Character
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {passwordsMatch ? (
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-red-500 shrink-0" />
                )}
                <span className={passwordsMatch ? 'text-emerald-500' : 'text-neutral-500'}>
                  Passwords Match
                </span>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg flex items-center justify-center transition-all duration-200 mt-4 shadow-lg shadow-red-950/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Password...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/login')}
          className="text-neutral-400 hover:text-neutral-200"
        >
          &larr; Back to Login
        </Button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <PublicRoute>
      <main className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
        {/* Glow circles */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-neutral-800/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-center mb-8">
              <Link
                href="/"
                className="inline-block text-2xl font-extrabold text-red-500 tracking-wider"
              >
                🍕 FOODIES EXPRESS
              </Link>
            </div>

            <Suspense
              fallback={
                <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-900 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl flex flex-col items-center justify-center min-h-[300px]">
                  <div className="h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              }
            >
              <ResetPasswordContent />
            </Suspense>
          </motion.div>
        </div>
      </main>
    </PublicRoute>
  );
}
