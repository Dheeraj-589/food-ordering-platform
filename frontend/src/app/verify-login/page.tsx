'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import PublicRoute from '@/components/PublicRoute';
import OtpInput from '@/components/OtpInput';
import { Button } from '@/components/ui/button';

function VerifyLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const addToast = useToastStore((state) => state.addToast);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!email) {
      addToast('No email address provided for verification.', 'error');
      router.push('/login');
    }
  }, [email, router, addToast]);

  if (!email) {
    return null;
  }

  const handleVerifyOtp = async (otp: string) => {
    setIsVerifying(true);
    try {
      const response = await api.post('/auth/login/verify', {
        email,
        otp,
      });

      const { accessToken, refreshToken } = response.data;

      // Now fetch user details
      const userResponse = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setAuth(userResponse.data, accessToken, refreshToken);
      addToast('Verification successful! Welcome back.', 'success');
      router.push('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Invalid or expired OTP code.';
      addToast(errMsg, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await api.post('/auth/resend-otp', {
        email,
        type: 'login',
      });
      addToast(response.data.message || 'OTP resent successfully.', 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Failed to resend OTP.';
      addToast(errMsg, 'error');
      throw err; // Forward to OtpInput error boundary to reset countdown if needed
    }
  };

  return (
    <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-900 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl">
      <OtpInput
        email={email}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        isSubmitting={isVerifying}
      />
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

export default function VerifyLoginPage() {
  return (
    <PublicRoute>
      <main className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
        {/* Glowing background circles */}
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
              <VerifyLoginContent />
            </Suspense>
          </motion.div>
        </div>
      </main>
    </PublicRoute>
  );
}
