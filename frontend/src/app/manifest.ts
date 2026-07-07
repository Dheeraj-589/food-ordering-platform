import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Foodies Express',
    short_name: 'FoodiesExpress',
    description: 'Premium Artisanal Pizzas & Gourmet Sides Delivered Hot & Fresh',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#dc2626',
    icons: [
      {
        src: '/images/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/images/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'View Menu',
        short_name: 'Menu',
        description: 'Explore our hand-tossed gourmet pizzas and sides',
        url: '/menu',
      },
      {
        name: 'Active Order Tracking',
        short_name: 'Track',
        description: 'Check active order prep and delivery status',
        url: '/dashboard',
      },
    ],
  };
}
