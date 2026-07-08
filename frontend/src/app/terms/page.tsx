import React from 'react';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Foodies Express',
  description:
    'Read the terms of service, payment refund conditions, and delivery rules of the Foodies Express platform.',
  alternates: {
    canonical: 'https://foodies-express.com/terms',
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      <section className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-8 flex-1">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Terms and Conditions</h1>
        <p className="text-xs text-foreground font-bold">Last Updated: July 7, 2026</p>

        <div className="space-y-6 text-xs sm:text-sm text-foreground font-medium leading-relaxed border-t border-neutral-900 pt-6">
          <p>
            Welcome to Foodies Express! These terms and conditions outline the rules and regulations
            for the use of Foodies Express&apos;s Website, located at foodies-express.com.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-6">1. Acceptance of Terms</h2>
          <p>
            By accessing this website, we assume you accept these terms and conditions in full. Do
            not continue to use Foodies Express if you do not agree to take all of the terms and
            conditions stated on this page.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-6">2. Ordering & Customization</h2>
          <p>
            When ordering products (such as customizable pizzas or combo platters), you are
            responsible for validating the selections made. Double cheese selections, extra
            toppings, and crust modifications will reflect live price increases which must be
            cleared at checkout.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-6">3. Refund and Cancellation</h2>
          <p>
            Due to the perishable nature of fresh food items, orders cannot be cancelled once
            preparation begins in the kitchen. If an order fails to deliver or is cancelled by
            management, any payments processed via the payment portal demo will be refunded
            according to standard banking hours.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
