'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export default function ClientInitializer() {
  useEffect(() => {
    useAuthStore.getState().initialize();
    useCartStore.getState().initialize();

    // Register Service Worker for PWA Offline Caching
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log(
              '[PWA] Service Worker registered successfully with scope:',
              registration.scope,
            );
          })
          .catch((err) => {
            console.error('[PWA] Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
