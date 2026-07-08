'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, Sparkles } from 'lucide-react';

interface Review {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatarColor: string;
}

const REVIEWS: Review[] = [
  {
    id: 1,
    name: 'Aishwarya Roy',
    role: 'Local Guide & Food Blogger',
    content:
      "The sourdough base is an absolute gamechanger! Crispy crust yet incredibly light. Easily beats any Pizza Hut or McDonald's. The delivery took exactly 24 minutes!",
    rating: 5,
    avatarColor: 'from-pink-500 to-rose-500',
  },
  {
    id: 2,
    name: 'Dheeraj',
    role: 'Customer',
    content:
      'Stunningly clean checkout and live tracking. The Cheese Burst option actually uses premium stretchy mozzarella, not liquid cheese fillers. Best pizzas in Vizianagaram.',
    rating: 5,
    avatarColor: 'from-amber-500 to-red-500',
  },
  {
    id: 3,
    name: 'Aisha Khan',
    role: 'Customer',
    content:
      'Very authentic woodfired taste. The Pepperoni Supreme has just the right amount of spice and grease. Strongly recommend ordering the Truffle Mushroom Pasta alongside.',
    rating: 5,
    avatarColor: 'from-blue-500 to-indigo-500',
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = REVIEWS[index];

  return (
    <section id="reviews" className="w-full py-16 md:py-24 bg-background/40 select-none">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-red-500 bg-red-500/10 px-3 py-1 rounded-full uppercase">
            <Sparkles className="h-3.5 w-3.5" /> Reviews
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            What Foodies Express Says
          </h2>
        </div>

        {/* Sliding Card Frame */}
        <div className="relative min-h-[260px] bg-card/30 border border-neutral-900 rounded-3xl p-6 sm:p-10 flex flex-col justify-between items-center text-center shadow-xl">
          {/* Quote Icon Background */}
          <div className="absolute top-6 left-6 text-neutral-800 opacity-20 pointer-events-none">
            <Quote className="h-10 w-10 fill-current" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 z-10 w-full"
            >
              {/* Star Ratings */}
              <div className="flex justify-center items-center gap-1">
                {Array.from({ length: current.rating }).map((_, rIdx) => (
                  <Star key={rIdx} className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Content Description */}
              <p className="text-sm sm:text-base text-foreground font-medium italic leading-relaxed max-w-2xl mx-auto">
                &ldquo;{current.content}&rdquo;
              </p>

              {/* User Avatar + Tag */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div
                  className={`h-11 w-11 rounded-full bg-gradient-to-tr ${current.avatarColor} flex items-center justify-center text-foreground text-xs font-black uppercase shadow-lg shadow-neutral-950`}
                >
                  {current.name.substring(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{current.name}</h4>
                  <p className="text-[10px] text-foreground font-bold uppercase tracking-wider mt-0.5">
                    {current.role}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel indicators dots */}
        <div className="flex justify-center items-center gap-1.5 mt-4">
          {REVIEWS.map((_, rIdx) => (
            <button
              key={rIdx}
              onClick={() => setIndex(rIdx)}
              className={`h-2 rounded-full transition-all ${rIdx === index ? 'w-6 bg-red-500' : 'w-2 bg-neutral-800'}`}
              aria-label={`Go to slide ${rIdx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
