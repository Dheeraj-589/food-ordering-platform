'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, Gift } from 'lucide-react';
import api from '@/lib/api';

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(
    '🔥 Welcome to Foodies Express! Loaded with premium artisan pizzas.',
  );

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const res = await api.get('/products/cms');
        if (res.data && res.data.announcement_bar) {
          setAnnouncement(res.data.announcement_bar);
        }
      } catch (err) {
        console.error('Failed to fetch announcement from CMS:', err);
      }
    }
    fetchAnnouncement();
  }, []);

  const icons = [Sparkles, ShoppingBag, Gift];
  const colors = [
    'from-red-500 to-rose-600',
    'from-amber-500 to-red-500',
    'from-purple-500 to-indigo-500',
  ];
  // Cycle icons just for visual flare
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % icons.length);
    }, 4050);
    return () => clearInterval(timer);
  }, []);

  const Icon = icons[cycleIndex];
  const color = colors[cycleIndex];

  return (
    <div className="relative w-full h-10 bg-background border-b border-neutral-900 overflow-hidden flex items-center justify-center z-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={cycleIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2 px-4 text-xs font-semibold text-foreground tracking-wide select-none"
        >
          <div className={`p-1 rounded-md bg-gradient-to-r ${color} text-foreground`}>
            <Icon className="h-3 w-3" />
          </div>
          <span>{announcement}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
