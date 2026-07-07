'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, Loader2 } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

export default function Newsletter() {
  const addToast = useToastStore((state) => state.addToast);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Simple validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    // Simulate API registration
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      addToast('Subscribed to newsletter!', 'success');
      setEmail('');
    }, 1200);
  };

  return (
    <section className="w-full py-16 md:py-24 bg-neutral-950/20 select-none border-t border-neutral-900/60 relative overflow-hidden">
      {/* Background Soft Blobs */}
      <div className="absolute -bottom-10 left-10 w-44 h-44 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-tr from-neutral-950 to-neutral-900/40 border border-neutral-900 p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-6">
          {/* Icon Circle */}
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Mail className="h-5 w-5" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-neutral-100">
              Join the Gourmet Circle
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium max-w-sm mx-auto">
              Subscribe to get exclusive access to chef specials, promo codes, and weekend flash
              sales.
            </p>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            {!subscribed ? (
              <motion.form
                key="subscription-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="w-full max-w-md flex flex-col sm:flex-row gap-2"
              >
                <div className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-neutral-950 border border-neutral-900 focus-within:border-red-500/50 transition-colors">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-neutral-200 placeholder-neutral-600 font-sans"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-red-950/20 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="subscribed-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400"
              >
                <Check className="h-4 w-4" /> Welcome on board! Check your inbox soon.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
