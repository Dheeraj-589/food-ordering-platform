import React from 'react';
import { Metadata } from 'next';
import OfflineClient from './OfflineClient';

export const metadata: Metadata = {
  title: 'Offline | Foodies Express',
  description: 'You are currently offline. Please check your internet connection and try again.',
};

export default function OfflinePage() {
  return <OfflineClient />;
}
