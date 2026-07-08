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
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      if (response.data.requireOtp) {
        addToast(response.data.message || 'OTP verification required.', 'success');
        router.push(`/verify-login?email=${encodeURIComponent(data.email)}`);
      } else {
        // Fallback (if backend didn't require OTP)
        addToast('Login successful!', 'success');
        router.push('/');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Invalid email or password.';
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicRoute>
      <main className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
        {/* Apple/Stripe-like subtle glow gradients */}
        <div className="absolute top-1/4 right-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-neutral-800/10 rounded-full blur-[120px] pointer-events-none" />

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

            <div className="bg-card/40 backdrop-blur-xl border border-neutral-900 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Welcome back</h2>
                <p className="text-sm text-foreground mt-1">Log in to your account to continue</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="w-full bg-background/50 border-neutral-900 text-foreground placeholder:text-neutral-700 focus:border-red-500 focus:ring-red-950/40"
                    disabled={isLoading}
                    {...register('email')}
                  />
                  {errors.email && (
                    <span className="text-xs font-medium text-red-500">{errors.email.message}</span>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-all"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full bg-background/50 border-neutral-900 text-foreground placeholder:text-neutral-700 focus:border-red-500 focus:ring-red-950/40 pr-10"
                      disabled={isLoading}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground hover:text-primary focus:outline-none"
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-foreground font-medium py-3 rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-950/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    'Verify Credentials'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-foreground">Don&apos;t have an account? </span>
                <Link
                  href="/register"
                  className="text-red-500 hover:text-red-700 font-semibold transition-all"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </PublicRoute>
  );
}
