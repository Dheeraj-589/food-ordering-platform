'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Navigation, Search } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

export default function DeliverySelector() {
  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const addToast = useToastStore((state) => state.addToast);

  const handleUseLocation = () => {
    setAddress('Vizianagaram, Andhra Pradesh, 535003, India');
    addToast('Location updated via GPS.', 'success');
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white backdrop-blur-xl border border-neutral-200/80 rounded-3xl p-5 shadow-xl relative overflow-hidden select-none">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Toggle Buttons */}
      <div className="relative flex p-1 rounded-2xl bg-neutral-100 border border-neutral-200">
        <button
          onClick={() => setMode('delivery')}
          className={`flex-1 relative py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer z-10 ${mode === 'delivery'
            ? 'text-primary-foreground font-extrabold'
            : 'text-foreground hover:text-primary'
            }`}
        >
          Delivery
        </button>
        <button
          onClick={() => setMode('pickup')}
          className={`flex-1 relative py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer z-10 ${mode === 'pickup'
            ? 'text-primary-foreground font-extrabold'
            : 'text-foreground hover:text-primary'
            }`}
        >
          Pickup
        </button>
        {/* Animated highlight */}
        <motion.div
          animate={{ x: mode === 'delivery' ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-primary rounded-xl shadow-sm"
        />
      </div>

      {/* Inputs and Info */}
      <div className="mt-5 space-y-4">
        {mode === 'delivery' ? (
          <>
            {/* Address input */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-secondary border border-border focus-within:border-primary/40 transition-colors">
                <Search className="h-4 w-4 text-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Enter your delivery address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-xs font-semibold text-foreground placeholder-muted-foreground font-sans"
                />
                {address && (
                  <button
                    onClick={() => setAddress('')}
                    className="text-xs font-bold text-foreground hover:text-primary cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                onClick={handleUseLocation}
                className="p-2.5 rounded-2xl bg-secondary border border-border text-foreground hover:text-primary hover:border-neutral-300 transition-colors cursor-pointer shrink-0"
                title="Use current location"
              >
                <Navigation className="h-4 w-4" />
              </button>
            </div>

            {/* Time estimation and indicators */}
            <div className="flex items-center gap-3 text-xs font-semibold text-foreground pt-1 flex-wrap">
              <div className="flex items-center gap-1.5 bg-secondary px-3.5 py-2 rounded-xl border border-border shadow-sm">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>30 Mins Express Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 bg-secondary px-3.5 py-2 rounded-xl border border-border shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-amber-500" />
                <span>Vizianagaram</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Store details */}
            <div className="p-3.5 rounded-2xl bg-secondary border border-border flex justify-between items-center shadow-sm">
              <div>
                <p className="text-xs font-bold text-foreground">Express Hub - Vizianagaram</p>
                <p className="text-[10px] text-foreground font-semibold mt-0.5">
                  Vizianagaram, Andhra Pradesh, 535003, India
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                Open Now
              </span>
            </div>

            {/* Pickup time estimation */}
            <div className="flex items-center gap-3 text-xs font-semibold text-foreground flex-wrap">
              <div className="flex items-center gap-1.5 bg-secondary px-3.5 py-2 rounded-xl border border-border shadow-sm">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Ready for pickup in 15 mins</span>
              </div>
              <div className="flex items-center gap-1.5 bg-secondary px-3.5 py-2 rounded-xl border border-border shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>0.8 km away</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
