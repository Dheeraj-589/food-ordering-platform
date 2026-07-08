import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import ClientInitializer from '@/components/ClientInitializer';
import ToastContainer from '@/components/ToastContainer';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Foodies Express - Fresh Hot Pizzas & Sides Delivered Fast',
  description:
    'Order premium artisanal pizzas, delicious sides, desserts, and cold beverages online. Real-time delivery tracking inspired by Pizza Hut.',
  keywords: 'pizza, online ordering, food delivery, order pizza, fast food, foodies express',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/favicon.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: 'Foodies Express - Premium Food Ordering Platform',
    description:
      'Order premium artisanal pizzas, sides, desserts, and drinks online. Hot and fresh at your door in 30 minutes.',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`,
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
    images: [`${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-sans antialiased bg-background text-foreground`}>
        <ClientInitializer />
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
