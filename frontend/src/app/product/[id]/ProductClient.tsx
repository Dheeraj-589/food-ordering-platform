'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Star, Info, MessageSquare, Plus, Minus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Product, CartItemCustomization } from '@/types';
import { useCartStore, getItemUnitPrice } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/button';
import { getProductImage } from '@/lib/utils';

interface ProductClientProps {
  product: Product;
  related: Product[];
}

export default function ProductClient({ product, related }: ProductClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);

  // Customization selection states
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedCrust, setSelectedCrust] = useState<string>(() => {
    return product.crusts && product.crusts.length > 0 ? product.crusts[0] : 'Classic Hand Tossed';
  });
  const [extraCheese, setExtraCheese] = useState<boolean>(false);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'details' | 'ingredients' | 'reviews'>('details');

  const hasVariants = Boolean((product.variants || []).length);
  const selectedVariant =
    (product.variants || []).find((variant) => variant.size === selectedSize) || null;

  // Build the customization payload
  const customization: CartItemCustomization = {
    size: product.category === 'pizza' ? selectedSize : undefined,
    crust: product.category === 'pizza' ? selectedCrust : undefined,
    extraCheese: product.category === 'pizza' ? extraCheese : undefined,
    extraToppings: product.category === 'pizza' ? selectedToppings : undefined,
  };

  // Compute live price
  const unitPrice = getItemUnitPrice(product, customization);
  const totalPrice = unitPrice * quantity;

  // Handle topping selection
  const handleToggleTopping = (toppingName: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingName) ? prev.filter((t) => t !== toppingName) : [...prev, toppingName],
    );
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      addToast('Please select a variant before adding to cart.', 'error');
      return;
    }

    addItem(product, quantity, customization);
    addToast(`${product.name} (customized) added to cart!`, 'success');
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      <Navbar />

      {/* Main Container */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-16 w-full flex-1 flex flex-col gap-10">
        {/* Back Link */}
        <button
          onClick={() => router.push('/menu')}
          className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer w-max"
        >
          <ChevronLeft className="h-4 w-4" /> BACK TO MENU
        </button>

        {/* Product Configurations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Left Column: Image Gallery & Previews */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-96 w-full bg-card border border-neutral-900 rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <img
                src={getProductImage(product.imageUrl, product.category, product.name)}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </motion.div>

            {/* Thumbnail Placeholders for gallery */}
            {/* <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 w-20 rounded-2xl bg-card/40 border border-neutral-900/60 hover:border-red-500/50 cursor-pointer overflow-hidden shrink-0 transition-colors"
                >
                  <img
                    src={getProductImage(product.imageUrl, product.category, product.name)}
                    alt="Gallery"
                    className="h-full w-full object-cover opacity-60 hover:opacity-100"
                  />
                </div>
              ))}
            </div> */}
          </div>

          {/* Right Column: Descriptions, Configs, Live Price & Cart triggers */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Categories badge */}
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-extrabold uppercase tracking-widest border border-red-500/20 w-max block">
                {product.category}
              </span>

              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-none">
                {product.name}
              </h2>

              <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                {product.description || 'No description available for this premium selection.'}
              </p>

              {/* Pizza Customizer options */}
              {product.category === 'pizza' && (
                <div className="space-y-5 pt-4 border-t border-neutral-900">
                  {/* Size selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                      Select Size
                    </label>
                    <div className="flex gap-2">
                      {(product.variants || []).map((v) => (
                        <button
                          key={v.size}
                          onClick={() => setSelectedSize(v.size)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${selectedSize === v.size
                            ? 'bg-primary border-primary text-primary-foreground shadow-md'
                            : 'bg-secondary border-border text-foreground hover:bg-secondary/80 hover:text-primary'
                            }`}
                        >
                          {v.size} (+₹
                          {Number(v.price) - Number(product.price) > 0
                            ? Number(v.price) - Number(product.price)
                            : 0}
                          )
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Crust Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                      Choose Crust
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        product.crusts || ['Classic Hand Tossed', 'Thin Crust', 'Cheese Burst']
                      ).map((crust) => (
                        <button
                          key={crust}
                          onClick={() => setSelectedCrust(crust)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${selectedCrust === crust
                            ? 'bg-primary border-primary text-primary-foreground shadow-md'
                            : 'bg-secondary border-border text-foreground hover:bg-secondary/80 hover:text-primary'
                            }`}
                        >
                          {crust}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Extras Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Extra Cheese Checkbox */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                        Extra Cheese
                      </label>
                      <button
                        onClick={() => setExtraCheese(!extraCheese)}
                        className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${extraCheese
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary text-foreground hover:border-neutral-300'
                          }`}
                      >
                        <span>Add Extra Mozzarella</span>
                        <span>+₹75</span>
                      </button>
                    </div>

                    {/* Extra Toppings Checklist */}
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                        Customize Toppings
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(product.extraToppings || []).map((topping) => {
                          const isSelected = selectedToppings.includes(topping.name);
                          return (
                            <button
                              key={topping.name}
                              onClick={() => handleToggleTopping(topping.name)}
                              className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex justify-between items-center ${isSelected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-secondary text-foreground hover:border-neutral-350 hover:text-primary'
                                }`}
                            >
                              <span>{topping.name}</span>
                              <span className="text-[10px] font-extrabold text-foreground">
                                +₹{topping.price}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price Calculations and Quantity controls */}
            <div className="p-5 rounded-3xl bg-card/30 border border-neutral-900/80 shadow-lg space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                    Live Calculated Price
                  </span>
                  <p className="text-2xl font-extrabold text-amber-500">₹{totalPrice}</p>
                </div>

                {/* Quantity adjuster */}
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-background border border-neutral-900">
                  <button
                    onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                    className="text-foreground hover:text-primary"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-bold text-foreground w-4 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="text-foreground hover:text-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleAddToCart}
                className="w-full bg-red-600 hover:bg-red-700 text-foreground font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 transition-all cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" /> ADD TO BASKET (₹{totalPrice})
              </Button>
            </div>
          </div>
        </div>

        {/* Tabbed Info: Details, Ingredients, Nutrition, Reviews */}
        <div className="border-t border-neutral-900 pt-10">
          <div className="flex border-b border-neutral-900 pb-2 gap-6 text-sm font-bold">
            {[
              { id: 'details', label: 'Nutritional Facts' },
              { id: 'ingredients', label: 'Ingredients' },
              { id: 'reviews', label: `Reviews (${product.reviews?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'details' | 'ingredients' | 'reviews')}
                className={`pb-2 relative cursor-pointer ${activeTab === tab.id ? 'text-foreground' : 'text-foreground'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="detailTabIndicator"
                    className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-red-600"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="py-6">
            {activeTab === 'details' && (
              <div className="max-w-md bg-card/20 border border-neutral-900 p-5 rounded-2xl flex gap-6 items-center shadow-lg">
                <Info className="h-8 w-8 text-amber-500 shrink-0" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs font-semibold text-foreground">
                  <div>
                    Calories:{' '}
                    <span className="text-foreground font-bold">
                      {product.nutrition?.calories || 250} kcal
                    </span>
                  </div>
                  <div>
                    Protein:{' '}
                    <span className="text-foreground font-bold">
                      {product.nutrition?.protein || '12g'}
                    </span>
                  </div>
                  <div>
                    Fat:{' '}
                    <span className="text-foreground font-bold">
                      {product.nutrition?.fat || '9g'}
                    </span>
                  </div>
                  <div>
                    Carbohydrates:{' '}
                    <span className="text-foreground font-bold">
                      {product.nutrition?.carbs || '30g'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="flex flex-wrap gap-2">
                {(
                  product.ingredients || [
                    'Fresh Dough',
                    'Organic Mozzarella',
                    'Classic Marinara',
                    'Olive Oil',
                  ]
                ).map((ing) => (
                  <span
                    key={ing}
                    className="px-3.5 py-2 rounded-xl bg-card/60 border border-neutral-900 text-xs font-bold text-foreground"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4 max-w-2xl">
                {!product.reviews || product.reviews.length === 0 ? (
                  <p className="text-xs text-foreground font-medium">
                    No reviews written for this product yet.
                  </p>
                ) : (
                  product.reviews.map(
                    (r: { user: string; rating: number; comment: string }, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-card/20 border border-neutral-900 flex gap-4 items-start shadow-md"
                      >
                        <div className="h-10 w-10 rounded-full bg-card border border-neutral-800 flex items-center justify-center text-xs font-bold text-foreground font-mono uppercase">
                          {r.user.substring(0, 2)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{r.user}</span>
                            <span className="flex text-amber-500">
                              {Array.from({ length: r.rating }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-amber-500" />
                              ))}
                            </span>
                          </div>
                          <p className="text-xs text-foreground font-medium leading-relaxed">
                            {r.comment}
                          </p>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Grid */}
        {related.length > 0 && (
          <div className="border-t border-neutral-900 pt-10">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-red-500" /> You Might Also Like
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/product/${p.id}`)}
                  className="group p-4 rounded-3xl bg-card/30 border border-neutral-900/60 hover:border-neutral-800 cursor-pointer flex flex-col gap-3 shadow-md transition-all duration-300"
                >
                  <div className="h-36 w-full bg-background border border-neutral-800/80 rounded-2xl overflow-hidden shrink-0">
                    <img
                      src={getProductImage(p.imageUrl, p.category, p.name)}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground truncate">{p.name}</h4>
                    <p className="text-[10px] font-bold text-amber-500 mt-1">₹{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
