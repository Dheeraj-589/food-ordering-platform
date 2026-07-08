import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HelpCircle, ChevronRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center space-y-6">
        <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
          <HelpCircle className="h-12 w-12" />
        </div>

        <div className="space-y-2 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight">404 - Page Not Found</h1>
          <p className="text-sm text-foreground font-medium leading-relaxed">
            The page you are looking for does not exist, has been removed, or is temporarily
            unavailable. Let&apos;s get you back to the menu!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-card border border-neutral-800 text-foreground hover:text-primary font-bold text-xs uppercase tracking-wider transition-all"
          >
            Go to Homepage
          </Link>
          <Link
            href="/menu"
            className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-foreground font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-950/20 transition-all"
          >
            Explore Menu <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
