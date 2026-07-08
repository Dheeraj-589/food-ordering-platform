import React from 'react';
import { Metadata } from 'next';
import AnnouncementBar from '@/components/AnnouncementBar';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import DeliverySelector from '@/components/DeliverySelector';
import BestSellerSection from '@/components/BestSellerSection';
import WhyChooseUs from '@/components/WhyChooseUs';
import Timeline from '@/components/Timeline';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Foodies Express - Fresh Hot Pizzas & Sides Delivered Fast',
  description:
    'Order premium artisanal pizzas, delicious sides, desserts, and cold beverages online. Real-time delivery tracking inspired by Pizza Hut.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/favicon.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  alternates: {
    canonical: 'https://foodies-express.com',
  },
  openGraph: {
    type: 'website',
    url: 'https://foodies-express.com',
    title: 'Foodies Express - Premium Food Ordering Platform',
    description:
      'Order premium artisanal pizzas, sides, desserts, and drinks online. Hot and fresh at your door in 30 minutes.',
    images: [
      {
        url: 'https://foodies-express.com/images/pizza-placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Foodies Express Gourmet Pizza',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foodies Express - Premium Food Ordering Platform',
    description:
      'Order premium artisanal pizzas, sides, desserts, and drinks online. Hot and fresh at your door in 30 minutes.',
    images: ['https://foodies-express.com/images/pizza-placeholder.jpg'],
  },
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: 'Foodies Express',
    image: 'https://foodies-express.com/images/pizza-placeholder.jpg',
    url: 'https://foodies-express.com',
    telephone: '+91-99999-99999',
    priceRange: '$$',
    servesCuisine: 'Pizza, Italian, Fast Food',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Vizianagaram',
      addressLocality: 'Vizianagaram',
      addressRegion: 'Andhra Pradesh',
      postalCode: '535003',
      addressCountry: 'IN',
    },
  };

  return (
    <>
      {/* JSON-LD Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-background text-foreground relative overflow-hidden select-none font-sans antialiased flex flex-col">
        {/* Top Announcements Scrolling Bar */}
        <AnnouncementBar />

        {/* Sticky Glassmorphic Navbar */}
        <Navbar />

        {/* Hero Section */}
        <Hero />

        {/* Delivery / Pickup Geolocation Select Row */}
        <div className="w-full px-4 relative z-25 mt-[-40px] md:mt-[-60px] mb-8 md:mb-12">
          <DeliverySelector />
        </div>

        {/* Dynamic Menu & Bestseller Grid */}
        <BestSellerSection />

        {/* Brand Standards / Why Choose Us */}
        <WhyChooseUs />

        {/* Step Timeline Order Workflow */}
        <Timeline />

        {/* Testimonials Customer Sliding reviews */}
        <Testimonials />

        {/* Newsletter Signup form */}
        <Newsletter />

        {/* Sitemap, social connections & Footer details */}
        <Footer />
      </main>
    </>
  );
}
