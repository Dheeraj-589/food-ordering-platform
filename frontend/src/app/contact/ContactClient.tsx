'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function ContactClient() {
  const [storeDetails, setStoreDetails] = useState({
    name: 'Foodies Express',
    email: 'support@foodies-express.com',
    phone: '+91-99999-99999',
    address: 'Vizianagaram, Andhra Pradesh, 535003, India',
  });
  const [businessHours, setBusinessHours] = useState({
    open: '11:00 AM',
    close: '11:59 PM',
    days: 'Mon - Sun',
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/products/settings');
        if (res.data) {
          if (res.data.store_details) {
            const details = JSON.parse(res.data.store_details);
            setStoreDetails(details);
          }
          if (res.data.business_hours) {
            const hours = JSON.parse(res.data.business_hours);
            setBusinessHours(hours);
          }
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
      }
    }
    loadSettings();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      <section className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12 flex-1 w-full">
        <div className="space-y-4 text-center">
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider border border-red-500/20 w-max mx-auto block">
            Customer Support
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Get in Touch</h1>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm md:text-base font-medium">
            Have questions about your order, feedback, or business inquiries? We are available 24
            hours a day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-neutral-900">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-neutral-900/30 border border-neutral-900 flex gap-4 items-start shadow-lg">
            <Phone className="h-6 w-6 text-red-500 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-neutral-200">Call Support</h3>
              <p className="text-xs text-neutral-400 font-medium">
                For instant delivery updates & changes
              </p>
              <p className="text-sm font-extrabold text-amber-500 pt-1">{storeDetails.phone}</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-neutral-900/30 border border-neutral-900 flex gap-4 items-start shadow-lg">
            <Mail className="h-6 w-6 text-red-500 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-neutral-200">Email Support</h3>
              <p className="text-xs text-neutral-400 font-medium">
                For complaints, feedback or corporate orders
              </p>
              <p className="text-sm font-extrabold text-amber-500 pt-1">{storeDetails.email}</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-neutral-900/30 border border-neutral-900 flex gap-4 items-start shadow-lg">
            <MapPin className="h-6 w-6 text-red-500 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-neutral-200">Headquarters</h3>
              <p className="text-xs text-neutral-400 font-medium">Foodies Express Culinary Labs</p>
              <p className="text-sm font-extrabold text-neutral-350 pt-1 leading-relaxed">
                {storeDetails.address}
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-3xl bg-neutral-900/30 border border-neutral-900 flex gap-4 items-start shadow-lg">
            <Clock className="h-6 w-6 text-red-500 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-neutral-200">Kitchen Timings</h3>
              <p className="text-xs text-neutral-400 font-medium">Hot kitchen prep hours</p>
              <p className="text-sm font-extrabold text-neutral-350 pt-1">
                {businessHours.days}: {businessHours.open} - {businessHours.close}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
