import React from 'react';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Foodies Express',
  description:
    'Understand how Foodies Express collects, stores, processes, and secures your user information and ordering details.',
  alternates: {
    canonical: 'https://foodies-express.com/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      <section className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-8 flex-1">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-neutral-500 font-bold">Last Updated: July 7, 2026</p>

        <div className="space-y-6 text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed border-t border-neutral-900 pt-6">
          <p>
            At Foodies Express, accessible from foodies-express.com, one of our main priorities is
            the privacy of our visitors. This Privacy Policy document contains types of information
            that is collected and recorded by Foodies Express and how we use it.
          </p>

          <h2 className="text-lg font-bold text-neutral-200 mt-6">1. Information We Collect</h2>
          <p>
            We collect personal information that you provide to us when you register on our
            platform, place orders, update address configurations, or communicate with customer
            support. This includes name, phone number, email address, physical delivery addresses,
            and encrypted authentication details.
          </p>

          <h2 className="text-lg font-bold text-neutral-200 mt-6">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Process, prepare, ship, and deliver your food orders safely.</li>
            <li>Maintain live-tracking geolocation integrations for delivery riders.</li>
            <li>Send email/SMS verification OTP codes and order receipts.</li>
            <li>Improve dashboard and admin catalog analytics.</li>
            <li>Detect and prevent transaction fraud or safety breaches.</li>
          </ul>

          <h2 className="text-lg font-bold text-neutral-200 mt-6">3. Cookies and Caching</h2>
          <p>
            Foodies Express uses standard browser cookies, local storage items, and service worker
            caches. These files enable shopping cart persistence across tabs, maintain active JWT
            authorization sessions, and service layout assets offline to enable Progressive Web App
            functionality.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
