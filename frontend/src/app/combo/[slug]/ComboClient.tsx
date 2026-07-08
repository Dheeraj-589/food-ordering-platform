'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Sparkles, Check, Info } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { Product, ComboSlot, CartItemCustomization } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/button';
import { getProductImage } from '@/lib/utils';

interface ComboClientProps {
  combo: Product;
}

export default function ComboClient({ combo }: ComboClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [comboSelections, setComboSelections] = useState<
    {
      slotId: number;
      productId: number;
      name: string;
      category: string;
    }[]
  >([]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await api.get('/products');
        setProducts(res.data);

        // Pre-initialize combo selections from comboItems
        const initial = (combo.comboItems || []).map((slot: ComboSlot) => {
          const match = res.data.find(
            (p: Product) => p.category === slot.category && p.isAvailable,
          );
          return {
            slotId: slot.slotId,
            productId: match?.id || 0,
            name: match?.name || `Select ${slot.name}`,
            category: slot.category,
          };
        });
        setComboSelections(initial);
      } catch (err) {
        console.error('Failed to load menu products for combo customizer:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [combo]);

  const handleSelectComboItem = (slotId: number, productItem: Product) => {
    setComboSelections((prev) =>
      prev.map((sel) =>
        sel.slotId === slotId ? { ...sel, productId: productItem.id, name: productItem.name } : sel,
      ),
    );
  };

  const handleAddComboToCart = () => {
    const incomplete = comboSelections.some((s) => s.productId === 0);
    if (incomplete) {
      addToast('Please select an item for every slot in the combo pack.', 'error');
      return;
    }

    const customization: CartItemCustomization = {
      comboSelections: comboSelections.map((s) => ({
        slotId: s.slotId,
        productId: s.productId,
        name: s.name,
      })),
    };

    addItem(combo, 1, customization);
    addToast(`${combo.name} custom platter added to cart!`, 'success');
    router.push('/cart');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      <Navbar />

      <section className="max-w-4xl mx-auto px-4 py-8 md:py-16 w-full flex-1 flex flex-col gap-8">
        {/* Back Link */}
        <button
          onClick={() => router.push('/menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer w-max"
        >
          <ChevronLeft className="h-4 w-4" /> BACK TO MENU
        </button>

        {/* Combo Details Header */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-red-950/20 via-neutral-900/40 to-transparent border border-neutral-900 shadow-xl space-y-4">
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-extrabold uppercase tracking-widest border border-red-500/20 w-max block">
            Exclusive Combo Pack
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-none text-foreground">
            {combo.name}
          </h2>
          <p className="text-sm text-foreground font-medium leading-relaxed max-w-2xl">
            {combo.description ||
              'Custom pick your favorite items below to build the ultimate meal combination.'}
          </p>
          <div className="flex items-center gap-6 pt-2">
            <div>
              <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                Special Combo Price
              </span>
              <p className="text-2xl font-extrabold text-amber-500">₹{combo.price}</p>
            </div>
            {combo.nutrition?.calories && (
              <div>
                <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Nutrition info
                </span>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {combo.nutrition.calories} kcal | {combo.nutrition.protein} Protein
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Slot Selection Stack */}
        <div className="space-y-8">
          {(combo.comboItems || []).map((slot: ComboSlot) => {
            const selectedItemId = comboSelections.find((s) => s.slotId === slot.slotId)?.productId;
            const candidateProducts = products.filter(
              (p) => p.category === slot.category && p.isAvailable,
            );

            return (
              <div
                key={slot.slotId}
                className="p-5 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-red-500" />
                    {slot.name} {slot.size ? `(${slot.size} Size)` : ''}
                  </h3>
                  <span className="text-[10px] font-extrabold text-foreground bg-card px-2.5 py-1 rounded-full uppercase">
                    Required Selection
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {candidateProducts.map((p) => {
                    const isSelected = selectedItemId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectComboItem(slot.slotId, p)}
                        className={`group p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between items-center text-center relative overflow-hidden ${isSelected
                          ? 'border-red-600 bg-red-600/10 text-foreground font-bold shadow-md'
                          : 'border-neutral-900 bg-background/60 text-foreground hover:border-neutral-800 hover:text-primary hover:bg-card/30'
                          }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 p-0.5 rounded-full bg-red-600 text-foreground shadow">
                            <Check className="h-2.5 w-2.5 stroke-[4px]" />
                          </span>
                        )}
                        <div className="h-16 w-16 bg-card border border-neutral-800/80 rounded-xl overflow-hidden mb-3 shrink-0">
                          <img
                            src={getProductImage(p.imageUrl, p.category, p.name)}
                            alt={p.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <span className="text-[11px] font-bold leading-tight line-clamp-2">
                          {p.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Add Button */}
        <div className="p-6 rounded-3xl bg-card/40 border border-neutral-900 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div>
            <span className="text-xs text-foreground font-bold">
              Bundle Price (Calculated Discount)
            </span>
            <p className="text-2xl font-extrabold text-amber-500">₹{combo.price}</p>
          </div>
          <Button
            onClick={handleAddComboToCart}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-foreground font-bold py-3.5 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 transition-all cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" /> ADD COMBO BUNDLE (₹{combo.price})
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
