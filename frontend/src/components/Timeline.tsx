'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Sliders, CreditCard, Gift, Sparkles } from 'lucide-react';

const STEPS = [
  {
    id: 1,
    title: 'Choose Food',
    description: 'Browse our signature artisan pizza range, sides, pastas, and dessert categories.',
    icon: Search,
    color: 'from-red-600 to-rose-600',
  },
  {
    id: 2,
    title: 'Customize Your Order',
    description: 'Select your preferred size, crust option, and load it up with organic toppings.',
    icon: Sliders,
    color: 'from-amber-500 to-red-500',
  },
  {
    id: 3,
    title: 'Instant Checkout',
    description: 'Checkout securely in seconds with Apple Pay, cards, or Saved Addresses.',
    icon: CreditCard,
    color: 'from-purple-600 to-indigo-600',
  },
  {
    id: 4,
    title: 'Oven-Hot Delivery',
    description: 'Track your express dispatch courier live and enjoy fresh food in under 30 mins.',
    icon: Gift,
    color: 'from-emerald-600 to-teal-600',
  },
];

export default function Timeline() {
  return (
    <section id="how-it-works" className="w-full py-16 md:py-24 bg-background/20 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-red-500 bg-red-500/10 px-3 py-1 rounded-full uppercase">
            <Sparkles className="h-3.5 w-3.5" /> Order Process
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-foreground font-medium max-w-md mx-auto">
            Order fresh hot food in four simple steps and track everything in real-time.
          </p>
        </div>

        {/* Steps Grid with Connectors */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 mt-8">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-card z-0">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500"
            />
          </div>

          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: idx * 0.15, ease: 'easeOut' }}
                className="relative flex flex-col items-center text-center space-y-4 z-10"
              >
                {/* Step Circle Badge */}
                <div
                  className={`h-16 w-16 rounded-2xl bg-gradient-to-tr ${step.color} p-4 flex items-center justify-center text-foreground shadow-xl shadow-neutral-950`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Step Details */}
                <div className="space-y-1.5 px-4">
                  <span className="text-[10px] font-black text-foreground font-mono tracking-widest uppercase">
                    STEP 0{step.id}
                  </span>
                  <h4 className="text-base font-extrabold text-foreground">{step.title}</h4>
                  <p className="text-xs text-foreground font-semibold leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
