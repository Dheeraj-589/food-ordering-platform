import React from 'react';
import { Metadata } from 'next';
import MenuClient from '../MenuClient';

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const categoryName =
    resolvedParams.category.charAt(0).toUpperCase() + resolvedParams.category.slice(1);
  const title = `${categoryName} Menu | Foodies Express`;
  const description = `Order fresh hot ${categoryName} from Foodies Express. Express 30-minute delivery.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://foodies-express.com/menu/${resolvedParams.category}`,
    },
    openGraph: {
      title,
      description,
      url: `https://foodies-express.com/menu/${resolvedParams.category}`,
      type: 'website',
    },
  };
}

export default async function MenuCategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <MenuClient preselectedCategory={resolvedParams.category} />;
}
