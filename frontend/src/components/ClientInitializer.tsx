'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export default function ClientInitializer() {
  useEffect(() => {
    useAuthStore.getState().initialize();
    useCartStore.getState().initialize();
  }, []);

  return null;
}
