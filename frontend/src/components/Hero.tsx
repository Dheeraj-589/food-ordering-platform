'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Star, Clock, ArrowRight, Sparkles } from 'lucide-react';
import api from '@/lib/api';

export default function Hero() {
  const router = useRouter();
  const [heroContent, setHeroContent] = useState({
    title: 'Fresh Pizza Delivered Fast',
    subtitle:
      'Experience food ordering redesigned. Artisanal pizzas handcrafted with 100% organic sourdough, local farm cheeses, and premium ingredients. Hot and fresh at your door in under half an hour.',
    buttonText: 'Order Now',
    buttonLink: '/menu',
    imageUrl: '/images/products/margherita.jpg',
  });

  useEffect(() => {
    async function fetchHero() {
      try {
        const res = await api.get('/products/cms');
        if (res.data && res.data.hero_banner) {
          const banner = JSON.parse(res.data.hero_banner);
          setHeroContent({
            title: banner.title || 'Fresh Pizza Delivered Fast',
            subtitle:
              banner.subtitle ||
              'Experience food ordering redesigned. Artisanal pizzas handcrafted with 100% organic sourdough, local farm cheeses, and premium ingredients.',
            buttonText: banner.buttonText || 'Order Now',
            buttonLink: banner.buttonLink || '/menu',
            imageUrl: banner.imageUrl || '/images/products/margherita.jpg',
          });
        }
      } catch (err) {
        console.error('Failed to fetch hero from CMS:', err);
      }
    }
    fetchHero();
  }, []);

  // Parallax spring coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 100 };
  const parallaxX = useSpring(mouseX, springConfig);
  const parallaxY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientWidth, clientHeight } = document.documentElement;
      // Get offset from center (-0.5 to 0.5)
      const x = (e.clientX / clientWidth - 0.5) * 40;
      const y = (e.clientY / clientHeight - 0.5) * 40;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleScrollToMenu = () => {
    const el = document.getElementById('menu');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center overflow-hidden py-12 md:py-20 select-none">
      {/* Background Soft Blobs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        {/* Left Content Column */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col space-y-6 text-center lg:text-left"
        >
          {/* Quick Info Badges */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <span className="flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full uppercase">
              <Clock className="h-3.5 w-3.5" /> 30 Mins Fast Delivery
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase">
              <Star className="h-3.5 w-3.5 fill-current" /> 4.9 Rating (15k+ Reviews)
            </span>
          </div>

          {/* Premium Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            {heroContent.title.split(' Delivered ').length > 1 ? (
              <>
                {heroContent.title.split(' Delivered ')[0]} <br />
                <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                  Delivered {heroContent.title.split(' Delivered ')[1]}
                </span>
              </>
            ) : heroContent.title.split(' Crafted ').length > 1 ? (
              <>
                {heroContent.title.split(' Crafted ')[0]} <br />
                <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                  Crafted {heroContent.title.split(' Crafted ')[1]}
                </span>
              </>
            ) : (
              heroContent.title
            )}
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-foreground font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
            {heroContent.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={() => {
                if (heroContent.buttonLink.startsWith('#') || heroContent.buttonLink === '/menu') {
                  handleScrollToMenu();
                } else {
                  router.push(heroContent.buttonLink);
                }
              }}
              className="group w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-foreground font-bold text-sm tracking-wide shadow-xl shadow-red-950/20 hover:shadow-red-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {heroContent.buttonText}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
            </button>
            <button
              onClick={handleScrollToMenu}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-card border border-neutral-800 text-foreground font-bold text-sm tracking-wide hover:text-primary hover:border-neutral-700 hover:bg-neutral-800/80 transition-all cursor-pointer"
            >
              Explore Menu
            </button>
          </div>

          {/* Trust points */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-900/60 max-w-md mx-auto lg:mx-0">
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground">100%</p>
              <p className="text-[10px] text-foreground font-bold uppercase tracking-wider mt-0.5">
                Fresh Sourdough
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground">30m</p>
              <p className="text-[10px] text-foreground font-bold uppercase tracking-wider mt-0.5">
                Delivery Time
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground">24/7</p>
              <p className="text-[10px] text-foreground font-bold uppercase tracking-wider mt-0.5">
                Customer Care
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Parallax Media Column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-center min-h-[350px] sm:min-h-[450px]"
        >
          {/* Parallax Container */}
          <motion.div
            style={{ x: parallaxX, y: parallaxY }}
            className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] flex items-center justify-center"
          >
            {/* Spinning Pizza Base */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
              className="absolute w-full h-full rounded-full border border-neutral-900/40 p-4 bg-background/20 backdrop-blur-sm cursor-pointer shadow-2xl shadow-neutral-950"
            >
              <img
                src={heroContent.imageUrl}
                alt={heroContent.title}
                className="w-full h-full object-cover rounded-full select-none"
              />
            </motion.div>

            {/* Floating Ingredients (Animated with Framer Motion) */}
            {/* Basil Leaves */}
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 left-1/4 text-3xl pointer-events-none drop-shadow-xl"
            >
              🌿
            </motion.div>
            {/* Tomato Slice */}
            <motion.div
              animate={{ y: [0, 15, 0], rotate: [0, -12, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-4 right-1/4 text-4xl pointer-events-none drop-shadow-xl"
            >
              🍅
            </motion.div>
            {/* Mushroom */}
            <motion.div
              animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute top-1/3 -right-6 text-3xl pointer-events-none drop-shadow-xl"
            >
              🍄
            </motion.div>
            {/* Chili/Pepper */}
            <motion.div
              animate={{ x: [0, -12, 0], y: [0, 12, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              className="absolute bottom-1/3 -left-6 text-3xl pointer-events-none drop-shadow-xl"
            >
              🌶️
            </motion.div>
            {/* Cheese block */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-12 right-12 text-3xl pointer-events-none drop-shadow-xl"
            >
              🧀
            </motion.div>

            {/* Floating Offer Card */}
            <motion.div
              style={{ x: useSpring(useMotionValue(10)), y: useSpring(useMotionValue(-10)) }}
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-8 -right-8 p-3.5 rounded-2xl bg-background/90 backdrop-blur-xl border border-neutral-800 shadow-2xl flex items-center gap-3 select-none pointer-events-none"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-foreground font-extrabold uppercase tracking-wider">
                  OFFER CODES
                </p>
                <p className="text-xs font-black text-foreground">50% OFF FIRST ORDER</p>
              </div>
            </motion.div>

            {/* Animated Delivery Scooter Card */}
            <motion.div
              animate={{ x: [-8, 8, -8] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-8 -left-8 p-3.5 rounded-2xl bg-background/90 backdrop-blur-xl border border-neutral-800 shadow-2xl flex items-center gap-3 select-none pointer-events-none"
            >
              <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
                🏍️
              </div>
              <div>
                <p className="text-[10px] text-foreground font-extrabold uppercase tracking-wider">
                  ON THE ROAD
                </p>
                <p className="text-xs font-black text-foreground">Live Delivery Tracking</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
