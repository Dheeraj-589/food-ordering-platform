'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye, Star, Flame } from 'lucide-react';
import api from '@/lib/api';
import { Product, Order } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';

export default function ProductRecommendations() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);
  const { user, setAuth } = useAuthStore();

  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendationsAndHistory = async () => {
      try {
        const productsRes = await api.get('/products');
        const allProducts: Product[] = productsRes.data;

        // 1. Resolve recently viewed from localStorage
        const viewedStr = localStorage.getItem('recently_viewed');
        if (viewedStr) {
          const ids: number[] = JSON.parse(viewedStr);
          const productsList = allProducts.filter((p) => ids.includes(p.id));
          // Preserve the original order of IDs
          const sorted = ids
            .map((id) => productsList.find((p) => p.id === id))
            .filter((p): p is Product => p !== undefined);
          setRecentlyViewed(sorted.slice(0, 4));
        }

        // 2. Dynamic recommendations based on category preference
        // Find user's category interest (either side elements, or look at items they have ordered)
        let preferredCategory = 'pizza';

        try {
          const ordersRes = await api.get('/orders');
          const pastOrders: Order[] = ordersRes.data;
          if (pastOrders.length > 0) {
            const categories = pastOrders.flatMap((o) =>
              o.items.map((item) => item.product?.category),
            );
            if (categories.length > 0) {
              // Find most frequent category
              const frequency: Record<string, number> = {};
              categories.forEach((cat) => {
                if (cat) {
                  frequency[cat] = (frequency[cat] || 0) + 1;
                }
              });
              const sortedCats = Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]);
              preferredCategory = sortedCats[0];
            }
          }
        } catch (e) {
          // ignore order fetch failure
        }

        // If user likes pizza, recommend sides or drinks as cross-sell, and vice versa!
        let recommendCategory = preferredCategory;
        if (preferredCategory === 'pizza') {
          recommendCategory = 'sides'; // Recommends appetizers with pizza
        } else {
          recommendCategory = 'pizza'; // Recommend mains if they only bought sides
        }

        let recommendedList = allProducts.filter(
          (p) => p.category === recommendCategory && p.isAvailable,
        );

        if (recommendedList.length < 3) {
          // Fallback to popular items (just select first 4 available items)
          recommendedList = allProducts.filter((p) => p.isAvailable);
        }

        setRecommendations(recommendedList.slice(0, 4));
      } catch (err) {
        console.error('Failed to load recommendation data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendationsAndHistory();
  }, [addToast]);

  const handleAddToWishlist = async (productId: number) => {
    if (!user) {
      addToast('Please login to save items to your wishlist.', 'info');
      router.push('/login');
      return;
    }

    const currentWishlist: number[] = user.wishlist ? JSON.parse(user.wishlist) : [];

    if (currentWishlist.includes(productId)) {
      addToast('Product is already in your wishlist.', 'info');
      return;
    }

    const updated = [...currentWishlist, productId];
    addToast('Added to your wishlist! ❤️', 'success');

    try {
      const res = await api.patch('/users/wishlist', { wishlist: updated });
      const token = localStorage.getItem('auth_token') || '';
      const refreshToken = localStorage.getItem('auth_refresh_token') || '';
      setAuth(res.data, token, refreshToken);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 bg-neutral-900 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Dynamic Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-neutral-200 flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500 animate-bounce" /> Recommended For You
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -5 }}
                className="p-4 rounded-3xl bg-neutral-900/20 border border-neutral-900 flex flex-col justify-between h-72 shadow-lg relative group overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="h-32 w-full rounded-2xl bg-neutral-950 overflow-hidden flex items-center justify-center relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl">🍕</span>
                    )}
                    <button
                      onClick={() => handleAddToWishlist(product.id)}
                      className="absolute right-2.5 top-2.5 p-2 bg-neutral-950/80 backdrop-blur-md rounded-xl text-neutral-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-200 line-clamp-1">
                      {product.name}
                    </h4>
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block mt-0.5">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-neutral-950 pt-3.5 mt-2">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                      Price
                    </span>
                    <span className="text-sm font-extrabold text-red-500 block">
                      ₹{product.price}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => router.push(`/product/${product.id}`)}
                      className="p-2 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer border border-neutral-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        addItem(product, 1);
                        addToast(`${product.name} added to cart! 🍕`, 'success');
                      }}
                      className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-neutral-900/60">
          <h3 className="text-lg font-black text-neutral-200 flex items-center gap-2">
            <Eye className="h-5 w-5 text-red-500" /> Recently Viewed Pizzas & Sides
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlyViewed.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -5 }}
                className="p-4 rounded-3xl bg-neutral-900/20 border border-neutral-900 flex flex-col justify-between h-72 shadow-lg relative group overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="h-32 w-full rounded-2xl bg-neutral-950 overflow-hidden flex items-center justify-center relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl">🍕</span>
                    )}
                    <button
                      onClick={() => handleAddToWishlist(product.id)}
                      className="absolute right-2.5 top-2.5 p-2 bg-neutral-950/80 backdrop-blur-md rounded-xl text-neutral-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-200 line-clamp-1">
                      {product.name}
                    </h4>
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest block mt-0.5">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-neutral-950 pt-3.5 mt-2">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                      Price
                    </span>
                    <span className="text-sm font-extrabold text-red-500 block">
                      ₹{product.price}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => router.push(`/product/${product.id}`)}
                      className="p-2 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer border border-neutral-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        addItem(product, 1);
                        addToast(`${product.name} added to cart! 🍕`, 'success');
                      }}
                      className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
