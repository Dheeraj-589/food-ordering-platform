import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';
import { Product } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProductData(
  idOrSlug: string,
): Promise<{ product: Product; related: Product[] } | null> {
  try {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const productUrl = isNumeric
      ? `${API_BASE}/products/${idOrSlug}`
      : `${API_BASE}/products/slug/${idOrSlug}`;

    const res = await fetch(productUrl, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const product: Product = await res.json();

    // Fetch related products of same category
    const relatedRes = await fetch(`${API_BASE}/products?category=${product.category}`, {
      next: { revalidate: 60 },
    });
    let related: Product[] = [];
    if (relatedRes.ok) {
      const allCategoryProducts: Product[] = await relatedRes.json();
      related = allCategoryProducts.filter((p) => p.id !== product.id).slice(0, 3);
    }

    return { product, related };
  } catch (err) {
    console.error('Error fetching product data in server component:', err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getProductData(resolvedParams.id);
  if (!data) {
    return {
      title: 'Product Not Found - Foodies Express',
      description: 'The requested menu item could not be found.',
    };
  }

  const { product } = data;
  const title = `${product.name} | Foodies Express`;
  const description =
    product.description ||
    `Order fresh hot ${product.name} from Foodies Express. Fast 30-minute delivery.`;
  const slug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const url = `https://foodies-express.com/product/${slug}`;

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
          url: product.imageUrl || 'https://foodies-express.com/images/pizza-placeholder.jpg',
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.imageUrl || 'https://foodies-express.com/images/pizza-placeholder.jpg'],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const data = await getProductData(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { product, related } = data;

  const slug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrl || 'https://foodies-express.com/images/pizza-placeholder.jpg',
    description: product.description || 'Gourmet menu item.',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: product.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://foodies-express.com/product/${slug}`,
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
        name: product.name,
        item: `https://foodies-express.com/product/${slug}`,
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
      <ProductClient product={product} related={related} />
    </>
  );
}
