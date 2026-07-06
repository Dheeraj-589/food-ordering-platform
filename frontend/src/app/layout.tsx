import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import ClientInitializer from '@/components/ClientInitializer';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Pizza Platform - Fresh Hot Pizzas & Sides Delivered Fast',
  description:
    'Order premium artisanal pizzas, delicious sides, desserts, and cold beverages online. Real-time delivery tracking inspired by Pizza Hut.',
  keywords: 'pizza, online ordering, food delivery, pizza hut, order pizza, fast food',
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
        {children}
      </body>
    </html>
  );
}
