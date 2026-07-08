'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, ShoppingBag, Plus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Product } from '@/types';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { getProductImage } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);

  // Fetch products on load
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.get('/products');
        if (res.data && res.data.length > 0) {
          setProducts(res.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to load search catalog:', err);
        setProducts([]);
      }
    }
    if (isOpen) {
      loadProducts();

      // Load recent searches from localStorage
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('recent_searches');
          if (stored) {
            setRecentSearches(JSON.parse(stored));
          }
        } catch (e) {
          console.error('Failed to load recent searches:', e);
        }
      }
    }
  }, [isOpen]);

  // Handle local query filter
  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      return;
    }
    const lower = query.toLowerCase();
    const matches = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.description && p.description.toLowerCase().includes(lower)) ||
        p.category.toLowerCase().includes(lower),
    );
    setFiltered(matches);
  }, [query, products]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const cleaned = term.trim();
    const updated = [cleaned, ...recentSearches.filter((t) => t !== cleaned)].slice(0, 5);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent searches:', e);
      }
    }
  };

  const handleAddToCart = (product: Product) => {
    saveRecentSearch(query || product.name);
    addItem(product, 1);
    addToast(`${product.name} added to cart!`, 'success');
  };

  // Autocomplete matching text highlight helper
  const highlightMatch = (text: string, searchWord: string) => {
    if (!searchWord.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${searchWord})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchWord.toLowerCase() ? (
            <mark
              key={i}
              className="bg-red-500/20 text-red-500 font-extrabold rounded px-0.5 select-none"
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-background/95 border border-neutral-900 rounded-3xl p-5 shadow-2xl max-w-xl max-h-[80vh] overflow-hidden flex flex-col justify-start">
        {/* Search Input Head */}
        <div className="flex items-center gap-3 border-b border-neutral-900 pb-3 mt-2">
          <Search className="h-5 w-5 text-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search pizza, pasta, sides, drinks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-foreground text-sm placeholder-neutral-500 font-semibold font-sans"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-card text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 min-h-[250px]">
          {query.trim() === '' ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  Looking for something delicious?
                </p>
                <p className="text-xs text-foreground">
                  Start typing above to search our menu items.
                </p>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="w-full text-left space-y-2">
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                    Recent Searches
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((word) => (
                      <button
                        key={word}
                        onClick={() => setQuery(word)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-card border border-neutral-800 text-neutral-450 hover:text-primary hover:border-neutral-700 transition-all cursor-pointer"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Suggestions / Popular Searches */}
              <div className="w-full text-left space-y-2">
                <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Popular Searches
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Pepperoni', 'Margherita', 'Truffle Pasta', 'Sides', 'Brownie'].map((word) => (
                    <button
                      key={word}
                      onClick={() => setQuery(word)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-card border border-neutral-800 text-foreground hover:text-primary hover:border-neutral-700 transition-all cursor-pointer"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-10 w-10 text-neutral-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No matching items found</p>
              <p className="text-xs text-foreground mt-0.5">
                Try searching for other words like Pizza or Drinks.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="group flex gap-3 p-3.5 rounded-2xl bg-card/30 border border-neutral-900/60 hover:border-neutral-800 hover:bg-card/50 transition-all duration-200"
              >
                {/* Product Thumbnail */}
                <div className="h-16 w-16 rounded-xl bg-background overflow-hidden shrink-0 border border-neutral-800">
                  <img
                    src={getProductImage(item.imageUrl, item.category, item.name)}
                    alt={item.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {highlightMatch(item.name, query)}
                    </h4>
                    {/* Standard Veg/Non-Veg Badge */}
                    <span
                      className={`h-3 w-3 shrink-0 rounded-sm border flex items-center justify-center p-[1px] ${item.name.toLowerCase().includes('pepperoni') ||
                        item.name.toLowerCase().includes('chicken') ||
                        item.name.toLowerCase().includes('meat')
                        ? 'border-red-600/40 text-red-500'
                        : 'border-emerald-600/40 text-emerald-500'
                        }`}
                    >
                      <span className="h-1 w-1 rounded-full bg-current" />
                    </span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-1 mt-0.5 font-medium font-sans">
                    {highlightMatch(item.description || '', query)}
                  </p>
                  <p className="text-xs font-bold text-red-500 mt-1">₹{item.price}</p>
                </div>

                {/* Quick Add */}
                <button
                  onClick={() => handleAddToCart(item)}
                  className="self-center p-2 rounded-xl bg-card border border-neutral-800 text-foreground hover:text-primary hover:bg-red-600 hover:border-red-500 transition-all duration-200 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
