import React from 'react';
import { Metadata } from 'next';
import MenuClient from './MenuClient';

export const metadata: Metadata = {
  title: 'Explore Our Gourmet Menu | Foodies Express',
  description:
    'Browse our menu of artisanal pizzas, delicious pasta, sides, cold drinks, and premium desserts. Hot and fresh delivery in 30 minutes.',
  alternates: {
    canonical: 'https://foodies-express.com/menu',
  },
  openGraph: {
    title: 'Gourmet Pizza & Sides Menu | Foodies Express',
    description:
      'Browse our menu of fresh baked artisanal pizzas, sides, pasta, desserts, and drinks online.',
    url: 'https://foodies-express.com/menu',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gourmet Pizza & Sides Menu | Foodies Express',
    description:
      'Browse our menu of fresh baked artisanal pizzas, sides, pasta, desserts, and drinks online.',
  },
};

export default function MenuPage() {
  return <MenuClient />;
}
