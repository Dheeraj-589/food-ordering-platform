'use client';

import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertCircle, RotateCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error occurred in layout page:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center space-y-6">
        <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
          <AlertCircle className="h-12 w-12" />
        </div>

        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight">System Error (500)</h1>
          <p className="text-sm text-foreground font-medium leading-relaxed">
            We encountered an internal application error while servicing your request. Our support
            staff has been alerted.
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/20 transition-all cursor-pointer"
        >
          <RotateCw className="h-4 w-4" /> Try Again
        </button>
      </section>

      <Footer />
    </div>
  );
}
