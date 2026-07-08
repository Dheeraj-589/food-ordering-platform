import { MetadataRoute } from 'next';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://food-ordering-platform-frontend-omega.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/dashboard',
        '/checkout',
        '/order/',
        '/order-success',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
