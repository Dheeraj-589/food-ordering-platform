'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, Play, QrCode } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

export default function Footer() {
  const addToast = useToastStore((state) => state.addToast);

  const handleDownloadClick = (store: string) => {
    addToast(`Redirecting to download Foodies Express on ${store}...`, 'info');
  };

  const socials = [
    {
      name: 'Facebook',
      href: '#',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.9.2-1 1-1h2V2h-3C10.5 2 9 3.5 9 5.5V8z" />
        </svg>
      ),
    },
    {
      name: 'Twitter',
      href: '#',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: '#',
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="w-full bg-neutral-950 border-t border-neutral-900 select-none">
      {/* Download App Promo Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-neutral-900/60 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left space-y-2 max-w-md">
          <h4 className="text-lg font-black text-neutral-100 flex items-center justify-center md:justify-start gap-2">
            <Smartphone className="h-5 w-5 text-red-500" />
            Download Foodies Express App
          </h4>
          <p className="text-xs text-neutral-500 font-medium leading-relaxed">
            Get instant order updates, exclusive app-only coupons, and track delivery routes live
            from our app. Available on iOS & Android.
          </p>
        </div>

        {/* Buttons and QR Wrapper */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* QR Code Placeholder */}
          <div
            className="h-16 w-16 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/20 p-2 flex items-center justify-center text-neutral-400 group hover:border-neutral-700 transition-colors"
            title="Scan to download"
          >
            <QrCode className="h-full w-full" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* App Store button */}
            <button
              onClick={() => handleDownloadClick('Apple App Store')}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer text-left"
            >
              <Smartphone className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-[8px] text-neutral-500 font-bold uppercase leading-none">
                  Download on the
                </p>
                <p className="text-xs font-black mt-0.5 leading-none">App Store</p>
              </div>
            </button>

            {/* Google Play Button */}
            <button
              onClick={() => handleDownloadClick('Google Play Store')}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer text-left"
            >
              <Play className="h-4 w-4 text-neutral-400 fill-current" />
              <div>
                <p className="text-[8px] text-neutral-500 font-bold uppercase leading-none">
                  Get it on
                </p>
                <p className="text-xs font-black mt-0.5 leading-none">Google Play</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Sitemap Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Logo Column */}
        <div className="col-span-2 space-y-4">
          <Link
            href="/"
            className="inline-block text-lg font-black tracking-widest bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent"
          >
            🍕 FOODIES EXPRESS
          </Link>
          <p className="text-xs text-neutral-500 font-medium leading-relaxed max-w-sm">
            Crafting premium pizzas using 100% natural organic sourdough and fresh ingredients.
            Experience fast, secure food ordering designed for foodies.
          </p>
          {/* Social Icons */}
          <div className="flex gap-3">
            {socials.map((soc, idx) => {
              return (
                <a
                  key={idx}
                  href={soc.href}
                  aria-label={soc.name}
                  className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                >
                  {soc.icon}
                </a>
              );
            })}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest">
            Menu
          </h5>
          <ul className="space-y-2 text-xs font-semibold text-neutral-500">
            <li>
              <button
                onClick={() =>
                  document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                Pizzas
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                Sides & Appetizers
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                Desserts
              </button>
            </li>
            <li>
              <button
                onClick={() =>
                  document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                Cold Drinks
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Corporate Info */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest">
            Company
          </h5>
          <ul className="space-y-2 text-xs font-semibold text-neutral-500">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Careers
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Store Locations
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Press & Media
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Help Desk */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest">
            Support
          </h5>
          <ul className="space-y-2 text-xs font-semibold text-neutral-500">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Contact Support
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Refund Guidelines
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Legal Bottom Bar */}
      <div className="bg-neutral-950/80 border-t border-neutral-900 py-6 text-center select-none text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>
            © {new Date().getFullYear()} Foodies Express Private Ltd. All Rights Reserved.
          </span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-neutral-300">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-neutral-300">
              Terms of Use
            </Link>
            <Link href="/" className="hover:text-neutral-300">
              Cookies Info
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
