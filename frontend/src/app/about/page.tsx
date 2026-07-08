import React from 'react';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'About Us | Foodies Express',
  description:
    'Learn about Foodies Express, our history of hand-tossed sourdough pizza, fresh local ingredients, and commitment to fast, hot delivery.',
  alternates: {
    canonical: 'https://foodies-express.com/about',
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      <section className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12 flex-1">
        <div className="space-y-4 text-center">
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider border border-red-500/20 w-max mx-auto block">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Craving for Perfection
          </h1>
          <p className="text-foreground max-w-xl mx-auto text-sm md:text-base font-medium">
            Founded with a passion for traditional Italian culinary arts, crafted for modern fast
            delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8 border-t border-neutral-900">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">The Sourdough Secret</h2>
            <p className="text-xs md:text-sm text-foreground leading-relaxed font-medium">
              Every single pizza base at Foodies Express starts with our custom sourdough starter,
              fermented for 48 hours to create a crispy, light, and flavor-packed crust that is easy
              to digest.
            </p>
            <p className="text-xs md:text-sm text-foreground leading-relaxed font-medium">
              Combined with San Marzano tomatoes, fresh local mozzarella cheese, and extra virgin
              olive oil, it delivers the true, uncompromised artisanal pizza experience.
            </p>
          </div>
          <div className="h-64 w-full bg-card rounded-3xl border border-neutral-900 overflow-hidden shadow-2xl">
            <img
              src="/images/products/margherita.jpg"
              alt="Artisanal sourdough pizza dough"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8 border-t border-neutral-900">
          <div className="h-64 w-full bg-card rounded-3xl border border-neutral-900 overflow-hidden shadow-2xl order-last md:order-first">
            <img
              src="/images/products/deluxe-veggie.jpg"
              alt="Hot pizza delivery rider"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">30 Minutes Delivery Promise</h2>
            <p className="text-xs md:text-sm text-foreground leading-relaxed font-medium">
              We understand that pizza is best enjoyed hot right out of the brick oven. That is why
              we have engineered a state-of-the-art dispatch and live-tracking network inspired by
              global delivery standards.
            </p>
            <p className="text-xs md:text-sm text-foreground leading-relaxed font-medium">
              Our riders utilize custom-fitted thermal backpacks to lock in heat, guaranteeing that
              your food arrives fresh, steamy, and delicious every single time.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
