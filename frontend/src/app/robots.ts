import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/checkout', '/order/', '/order-success'],
    },
    sitemap: 'https://foodies-express.com/sitemap.xml',
  };
}
