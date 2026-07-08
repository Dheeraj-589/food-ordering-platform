import { MetadataRoute } from 'next';
import { Product } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ['', '/menu', '/about', '/contact', '/privacy', '/terms'];
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://food-ordering-platform-frontend-omega.vercel.app';
  const staticUrls = staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1.0 : 0.8,
  }));

  try {
    const res = await fetch(`${API_BASE}/products`);
    if (res.ok) {
      const products: Product[] = await res.json();
      const productUrls = products.map((product: Product) => {
        const slug = product.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        const path = product.category === 'combos' ? `/combo/${slug}` : `/product/${slug}`;
        return {
          url: `${SITE_URL}${path}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      });

      // Add category sitemap pages E.g. /menu/pizza
      const categories = Array.from(new Set(products.map((p: Product) => p.category))) as string[];
      const categoryUrls = categories.map((cat) => ({
        url: `${SITE_URL}/menu/${cat}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }));

      return [...staticUrls, ...categoryUrls, ...productUrls];
    }
  } catch (err) {
    console.error('Error creating sitemap:', err);
  }

  return staticUrls;
}
