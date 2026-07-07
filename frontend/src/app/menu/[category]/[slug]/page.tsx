import React from 'react';
import ProductDetailPage, {
  generateMetadata as productGenerateMetadata,
} from '../../../product/[id]/page';

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  return productGenerateMetadata({ params: Promise.resolve({ id: resolvedParams.slug }) });
}

export default async function MenuCategoryProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <ProductDetailPage params={Promise.resolve({ id: resolvedParams.slug })} />;
}
