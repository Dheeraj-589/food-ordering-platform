'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Truck, ChefHat, ShieldCheck, Headphones, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    id: 1,
    title: 'Fresh Ingredients',
    description:
      'We source farm-fresh organic vegetables, premium sourdough starters, and local cheeses daily.',
    icon: Leaf,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 2,
    title: '30 Mins Fast Delivery',
    description:
      'Our custom hot-bags keep pizzas at oven-fresh temperature during the express courier delivery.',
    icon: Truck,
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
  },
  {
    id: 3,
    title: 'World-Class Chefs',
    description:
      'Our kitchens are helmed by award-winning pizzaiolos crafting original artisan recipes.',
    icon: ChefHat,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 4,
    title: 'Secure Payments',
    description:
      'Stripe-integrated military-grade bank encryptions ensuring safe checkout transactions.',
    icon: ShieldCheck,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 5,
    title: '24/7 Care Support',
    description:
      'Round-the-clock live chat concierge support available to assist you with order trackings.',
    icon: Headphones,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
];

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="w-full py-16 md:py-24 bg-neutral-950/40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Heading */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-red-500 bg-red-500/10 px-3 py-1 rounded-full uppercase">
            <Sparkles className="h-3.5 w-3.5" /> Our Standards
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-100 tracking-tight">
            Why Pizza Lovers Choose Us
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium max-w-md mx-auto">
            We hold ourselves to the highest standards of culinary hygiene, logistical speed, and
            transaction security.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.id}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="group p-5 rounded-3xl bg-neutral-900/30 border border-neutral-900/60 hover:border-neutral-800 hover:bg-neutral-900/50 flex flex-col items-center text-center space-y-4 shadow-lg"
              >
                {/* Icon Circle */}
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 ${feat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Info Text */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-neutral-200">{feat.title}</h4>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    {feat.description}
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
