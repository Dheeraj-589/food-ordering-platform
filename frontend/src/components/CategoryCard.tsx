'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CategoryCardProps {
  name: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}

export default function CategoryCard({ name, icon, isActive, onClick }: CategoryCardProps) {
  return (
    <motion.button
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative px-6 py-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 w-28 sm:w-32 shrink-0 select-none ${
        isActive
          ? 'bg-red-600/10 border-red-500 text-neutral-100 shadow-[0_4px_20px_rgba(220,38,38,0.15)]'
          : 'bg-neutral-900/40 border-neutral-900 hover:border-neutral-800 text-neutral-400 hover:text-neutral-200'
      }`}
    >
      {/* Background Soft Color Glow */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-tr from-red-600/5 to-amber-500/5 rounded-2xl pointer-events-none" />
      )}

      {/* Emoji Indicator */}
      <span className="text-3xl filter drop-shadow-md select-none">{icon}</span>

      {/* Name */}
      <span className="text-xs font-bold uppercase tracking-wider">{name}</span>
    </motion.button>
  );
}
