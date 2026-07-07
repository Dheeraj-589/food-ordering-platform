import React from 'react';
import { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us | Foodies Express',
  description:
    'Get in touch with Foodies Express. Contact details for support, feedback, catering, and business inquiries. Open 24/7.',
  alternates: {
    canonical: 'https://foodies-express.com/contact',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
