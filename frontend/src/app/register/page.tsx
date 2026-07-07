'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[@$!%*?&#]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password', '');
  const confirmPassword = watch('confirmPassword', '');

  // Real-time criteria verification
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        phoneNumber: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      addToast(response.data.message || 'OTP verification sent to your email.', 'success');
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Registration failed.';
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="text-center mb-6">
              <Link
                href="/"
                className="inline-block text-2xl font-extrabold text-red-500 tracking-wider"
              >
                🍕 FOODIES EXPRESS
              </Link>
            </div>

            <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-900 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-neutral-100">Create an account</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  Get delicious food delivered in minutes
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-neutral-400">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="w-full bg-neutral-950/50 border-neutral-900 text-neutral-100 placeholder:text-neutral-700 focus:border-red-500 focus:ring-red-950/40"
                    disabled={isLoading}
                    {...register('name')}
                  />
                  {errors.name && (
                    <span className="text-xs font-medium text-red-500">{errors.name.message}</span>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-neutral-400">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="w-full bg-neutral-950/50 border-neutral-900 text-neutral-100 placeholder:text-neutral-700 focus:border-red-500 focus:ring-red-950/40"
                    disabled={isLoading}
                    {...register('email')}
                  />
                  {errors.email && (
                    <span className="text-xs font-medium text-red-500">{errors.email.message}</span>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-neutral-400">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+91 99999 99999"
                    className="w-full bg-neutral-950/50 border-neutral-900 text-neutral-100 placeholder:text-neutral-700 focus:border-red-500 focus:ring-red-950/40"
                    disabled={isLoading}
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <span className="text-xs font-medium text-red-500">{errors.phone.message}</span>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-neutral-400">
                    Password
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
                    <span className="text-xs font-medium text-red-500">
                      {errors.password.message}
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs font-semibold text-neutral-400"
                  >
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                    </>
                  ) : (
                    'Register Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-neutral-400">Already have an account? </span>
                <Link
                  href="/login"
                  className="text-red-500 hover:text-red-400 font-semibold transition-all"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </PublicRoute>
  );
}
