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
import { Loader2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password/request', {
        email: data.email,
      });

      addToast(response.data.message || 'Verification OTP code sent to your email.', 'success');
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Failed to send reset code.';
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicRoute>
      <main className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
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

            <div className="bg-card/40 backdrop-blur-xl border border-neutral-900 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Forgot Password</h2>
                <p className="text-sm text-foreground mt-1">
                  Enter your email address and we will send you a 6-digit OTP code to reset your
                  password.
                </p>
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-foreground font-medium py-3 rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-950/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-foreground">Back to </span>
                <Link
                  href="/login"
                  className="text-red-500 hover:text-red-700 font-semibold transition-all"
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
