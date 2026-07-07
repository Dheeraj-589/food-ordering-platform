import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ComboClient from './ComboClient';
import { Product } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getComboData(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products/slug/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const combo: Product = await res.json();
    if (combo.category !== 'combos') return null; // Ensure it's a combo
    return combo;
  } catch (err) {
    console.error('Error fetching combo data in server component:', err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const combo = await getComboData(resolvedParams.slug);
  if (!combo) {
    return {
      title: 'Combo Not Found - Foodies Express',
      description: 'The requested combo deal could not be found.',
    };
  }

  const title = `${combo.name} Custom Platter | Foodies Express`;
  const description =
    combo.description ||
    `Build and customize your own ${combo.name} meal combination. Fast 30-minute delivery.`;
  const url = `https://foodies-express.com/combo/${resolvedParams.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [
        {
          url: combo.imageUrl || 'https://foodies-express.com/images/pizza-placeholder.jpg',
          alt: combo.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [combo.imageUrl || 'https://foodies-express.com/images/pizza-placeholder.jpg'],
    },
  };
}

export default async function ComboPage({ params }: PageProps) {
  const resolvedParams = await params;
  const combo = await getComboData(resolvedParams.slug);

  if (!combo) {
    notFound();
  }

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: combo.name,
    image: combo.imageUrl || 'https://foodies-express.com/images/pizza-placeholder.jpg',
    description: combo.description || 'Gourmet Combo Meal Platter.',
    offers: {
      '@type': 'Offer',
      price: combo.price,
      priceCurrency: 'INR',
      availability: combo.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://foodies-express.com/combo/${resolvedParams.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://foodies-express.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Menu',
        item: 'https://foodies-express.com/menu',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Combos',
        item: 'https://foodies-express.com/menu/combos',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: combo.name,
        item: `https://foodies-express.com/combo/${resolvedParams.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ComboClient combo={combo} />
    </>
  );
}
