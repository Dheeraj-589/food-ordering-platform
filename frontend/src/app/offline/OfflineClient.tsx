'use client';

import React from 'react';
import { WifiOff, RotateCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function OfflineClient() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center space-y-6">
        <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 animate-bounce">
          <WifiOff className="h-12 w-12" />
        </div>

        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight">Connection Lost</h1>
          <p className="text-sm text-neutral-400 font-medium leading-relaxed">
            Oops! It looks like you are currently offline. Please check your network cables or Wi-Fi
            configurations and try again to order some hot fresh pizzas!
          </p>
        </div>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/20 transition-all cursor-pointer"
        >
          <RotateCw className="h-4 w-4" /> Try Reconnecting
        </button>
      </section>

      <Footer />
    </main>
  );
}
