'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import CategoryGrid from './CategoryGrid';
import { Product } from '@/types';
import api from '@/lib/api';
import { ProductCardSkeleton } from './LoadingSkeleton';
import { Sparkles } from 'lucide-react';

export default function BestSellerSection() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const res = await api.get('/products');
        if (res.data && res.data.length > 0) {
          setProducts(res.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to retrieve catalog products from backend:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Filter products by category
  const filteredProducts = activeCategory
    ? products.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase())
    : products;

  return (
    <section id="menu" className="w-full py-16 md:py-24 bg-background/20 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-red-500 bg-red-500/10 px-3 py-1 rounded-full uppercase">
            <Sparkles className="h-3.5 w-3.5" /> Explore Our Menu
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Our Freshly Baked Bestsellers
          </h2>
          <p className="text-xs sm:text-sm text-foreground font-medium max-w-md mx-auto">
            Order top premium freshly prepared delicacies curated by our chefs and delivered within
            30 minutes.
          </p>
        </div>

        {/* Category Filters Grid */}
        <CategoryGrid activeCategory={activeCategory} onSelectCategory={setActiveCategory} />

        {/* Product Cards Responsive Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-card/10 border border-dashed border-neutral-900 rounded-3xl">
            <p className="text-sm font-semibold text-foreground">
              No items available in this category
            </p>
            <p className="text-xs text-foreground mt-1">
              Please select another category to view dishes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
