'use client';

import React, { useState, useEffect } from 'react';
import CategoryCard from './CategoryCard';
import api from '@/lib/api';

const CATEGORY_ICONS: Record<string, string> = {
  pizza: '🍕',
  combos: '🎁',
  pasta: '🍝',
  drinks: '🥤',
  desserts: '🍰',
  sides: '🍟',
  rice: '🍛',
};

interface CategoryGridProps {
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategoryGrid({ activeCategory, onSelectCategory }: CategoryGridProps) {
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/products/categories');
        const list = res.data.map((cat: { name: string; displayName: string }) => ({
          id: cat.name,
          name: cat.displayName,
          icon: CATEGORY_ICONS[cat.name.toLowerCase()] || '🍔',
        }));
        setCategories(list);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="w-full">
      {/* Centered Category list with scroll */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none justify-start lg:justify-center px-4 max-w-7xl mx-auto">
        <CategoryCard
          name="All Menu"
          icon="🍽️"
          isActive={activeCategory === null}
          onClick={() => onSelectCategory(null)}
        />
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            name={cat.name}
            icon={cat.icon}
            isActive={activeCategory === cat.id}
            onClick={() => onSelectCategory(cat.id)}
          />
        ))}
      </div>
    </div>
  );
}
