'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ShoppingBag, MapPin, Map } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') || 'N/A';

  // Compute mock delivery time: current time + 30 mins
  const deliveryTime = new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      <Navbar />

      <section className="flex-1 flex items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-md w-full p-8 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-2xl text-center space-y-6 relative overflow-hidden"
        >
          {/* Subtle top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-emerald-500 rounded-full blur-[20px] pointer-events-none" />

          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
            className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.1)]"
          >
            <CheckCircle2 className="h-10 w-10" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Order Confirmed!
            </h1>
            <p className="text-xs text-foreground font-medium max-w-xs mx-auto">
              Your gourmet selections are now queued by our kitchen. Prepare for a mouthwatering
              arrival!
            </p>
          </div>

          {/* Order Details box */}
          <div className="p-4.5 rounded-2xl bg-background border border-neutral-900 text-left space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-neutral-900 pb-2">
              <span className="text-foreground font-bold">ORDER ID</span>
              <span className="text-foreground font-extrabold font-mono">#FEX-{orderId}</span>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <Clock className="h-4.5 w-4.5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-foreground font-bold block uppercase">
                  Estimated Delivery
                </span>
                <span className="text-foreground font-extrabold mt-0.5 block">
                  Arriving by {deliveryTime}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <MapPin className="h-4.5 w-4.5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-foreground font-bold block uppercase">Delivery Status</span>
                <span className="text-emerald-700 font-extrabold mt-0.5 block">
                  Preparing in Kitchen
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => router.push(`/order/${orderId}`)}
              className="w-full bg-red-600 hover:bg-red-700 text-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow cursor-pointer transition-colors"
            >
              <Map className="h-4 w-4" /> TRACK ORDER DETAILS
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/menu')}
              className="w-full bg-transparent border-neutral-800 text-foreground hover:text-primary rounded-xl py-3 text-xs font-bold cursor-pointer transition-colors"
            >
              <ShoppingBag className="h-4 w-4" /> CONTINUE SHOPPING
            </Button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none items-center justify-center">
          <div className="h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
