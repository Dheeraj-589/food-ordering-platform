'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface OtpInputProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  isSubmitting: boolean;
}

export default function OtpInput({ email, onVerify, onResend, isSubmitting }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [resendCooldown, setResendCooldown] = useState(30);
  const [expirationTime, setExpirationTime] = useState(300); // 5 minutes in seconds
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  // Cooldown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setExpirationTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Keep only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setErrorMsg(null);

    // Auto move next
    if (value && index < 5 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }

    // Trigger verification automatically when last box is filled
    if (newOtp.every((char) => char !== '') && index === 5) {
      onVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) {
        // Box is empty, go to previous box and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputsRef.current[index - 1]?.focus();
      } else {
        // Clear current box
        newOtp[index] = '';
        setOtp(newOtp);
      }
      setErrorMsg(null);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!/^\d{6}$/.test(pasteData)) return; // Ensure it's exactly 6 digits

    const chars = pasteData.split('');
    setOtp(chars);
    setErrorMsg(null);

    // Focus last box
    inputsRef.current[5]?.focus();

    // Verify immediately
    onVerify(pasteData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setErrorMsg('Please enter all 6 digits of the OTP.');
      return;
    }
    onVerify(fullOtp);
  };

  const handleResendClick = async () => {
    try {
      await onResend();
      setResendCooldown(30);
      setExpirationTime(300);
      setOtp(new Array(6).fill(''));
      inputsRef.current[0]?.focus();
      setErrorMsg(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to resend OTP code.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Enter Verification Code
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          We have sent a 6-digit code to{' '}
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              ref={(el) => {
                inputsRef.current[idx] = el;
              }}
              onChange={(e) => handleChange(e.target, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl font-bold rounded-lg border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950 outline-none transition-all duration-200"
              disabled={isSubmitting || expirationTime === 0}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {errorMsg && <p className="text-sm font-semibold text-red-500">{errorMsg}</p>}

        <div className="flex flex-col items-center justify-between text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 space-y-3">
          <div>
            {expirationTime > 0 ? (
              <span>
                Code expires in:{' '}
                <span className="font-bold text-red-500">{formatTime(expirationTime)}</span>
              </span>
            ) : (
              <span className="font-bold text-red-500">
                OTP Code expired! Please resend a new one.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>Didn&apos;t get the code?</span>
            <Button
              type="button"
              variant="link"
              onClick={handleResendClick}
              disabled={resendCooldown > 0 || isSubmitting}
              className="p-0 h-auto text-red-600 hover:text-red-700 font-semibold"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || otp.some((c) => c === '') || expirationTime === 0}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg flex items-center justify-center transition-all duration-200 shadow-md shadow-red-100 dark:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
            </>
          ) : (
            'Verify & Proceed'
          )}
        </Button>
      </form>
    </div>
  );
}
