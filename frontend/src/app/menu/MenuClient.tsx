'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Heart,
  ShoppingBag,
  Leaf,
  Flame,
  Sparkles,
  X,
  Plus,
  Check,
  Clock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { Product, ProductCategory, CartItemCustomization, ComboSlot } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getProductImage } from '@/lib/utils';

// Veg / Non-Veg detection helper
const isProductVeg = (product: Product): boolean => {
  if (product.category === 'drinks' || product.category === 'desserts') return true;
  const nameLower = product.name.toLowerCase();
  const descLower = (product.description || '').toLowerCase();
  const keywords = ['chicken', 'pepperoni', 'wings', 'meatball', 'alfredo', 'beef', 'pork'];
  return !keywords.some((k) => nameLower.includes(k) || descLower.includes(k));
};

interface MenuClientProps {
  preselectedCategory?: string;
}

export default function MenuClient({ preselectedCategory = 'all' }: MenuClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);

  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([
    { id: 'all', name: 'All Items' },
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(preselectedCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price-low' | 'price-high'>(
    'popular',
  );
  const [maxPrice, setMaxPrice] = useState<number>(1600);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [availabilityFilter, setAvailabilityFilter] = useState<boolean>(false);
  const [offersFilter, setOffersFilter] = useState<boolean>(false);

  // Combo Builder states
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<Product | null>(null);
  const [comboSelections, setComboSelections] = useState<
    {
      slotId: number;
      productId: number;
      name: string;
      category: string;
    }[]
  >([]);

  // Fetch products and categories on mount
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/products/categories'),
        ]);
        setProducts(prodRes.data);
        if (catRes.data && catRes.data.length > 0) {
          const list = catRes.data.map((cat: { name: string; displayName: string }) => ({
            id: cat.name,
            name: cat.displayName,
          }));
          setCategoriesList([{ id: 'all', name: 'All Items' }, ...list]);
        }
      } catch (err) {
        console.error('Error fetching menu data:', err);
        addToast('Failed to load menu. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  }, [addToast]);

  // State for recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && products.length > 0) {
      try {
        const viewedStr = localStorage.getItem('recently_viewed');
        if (viewedStr) {
          const viewedIds: number[] = JSON.parse(viewedStr);
          // Find matching products from state catalog
          const matched = viewedIds
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is Product => !!p);
          setRecentlyViewed(matched.slice(0, 4));
        }
      } catch (e) {
        console.error('Failed to load recently viewed:', e);
      }
    }
  }, [products]);

  // Synchronize category updates if page category parameter changes
  useEffect(() => {
    setSelectedCategory(preselectedCategory);
  }, [preselectedCategory]);

  // categoriesList is now a dynamic state variable initialized on mount

  // Filter & Sort Logic
  const filteredProducts = products
    .filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;

      // Search filter
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Veg/Non-Veg filter
      const isVeg = isProductVeg(product);
      if (vegFilter === 'veg' && !isVeg) return false;
      if (vegFilter === 'non-veg' && isVeg) return false;

      // Max price
      if (Number(product.price) > maxPrice) return false;

      // Rating filter
      if (ratingFilter > 0) {
        const ratings = product.reviews?.map((r) => r.rating) || [];
        const avgRating =
          ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 4.5;
        if (avgRating < ratingFilter) return false;
      }

      // Availability filter
      if (availabilityFilter && !product.isAvailable) return false;

      // Offers/Combo filter
      if (offersFilter && product.category !== 'combos') return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
      if (sortBy === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      // Popular (descending reviews size or default)
      const reviewsA = a.reviews?.length || 0;
      const reviewsB = b.reviews?.length || 0;
      return reviewsB - reviewsA;
    });

  // Add standard product to cart
  const handleAddToCart = (product: Product) => {
    if (product.category === 'combos') {
      // Open combo builder modal
      setSelectedCombo(product);
      const initialSelections = (product.comboItems || []).map((slot: ComboSlot) => {
        // Find default or first available item in category
        const match = products.find((p) => p.category === slot.category && p.isAvailable);
        return {
          slotId: slot.slotId,
          productId: match?.id || 0,
          name: match?.name || `Select ${slot.name}`,
          category: slot.category,
        };
      });
      setComboSelections(initialSelections);
      setComboModalOpen(true);
      return;
    }

    // Regular product details: go to detail page for size/crust customization or add direct regular
    if (product.category === 'pizza') {
      router.push(`/product/${product.id}`);
    } else {
      addItem(product, 1);
      addToast(`${product.name} added to cart!`, 'success');
    }
  };

  // Select item in Combo Builder
  const handleSelectComboItem = (slotId: number, productItem: Product) => {
    setComboSelections((prev) =>
      prev.map((sel) =>
        sel.slotId === slotId ? { ...sel, productId: productItem.id, name: productItem.name } : sel,
      ),
    );
  };

  // Add Combo to Cart
  const handleAddComboToCart = () => {
    if (!selectedCombo) return;
    const incomplete = comboSelections.some((s) => s.productId === 0);
    if (incomplete) {
      addToast('Please make selections for all items in the combo.', 'error');
      return;
    }

    const customization: CartItemCustomization = {
      comboSelections: comboSelections.map((s) => ({
        slotId: s.slotId,
        productId: s.productId,
        name: s.name,
      })),
    };

    addItem(selectedCombo, 1, customization);
    addToast(`${selectedCombo.name} custom bundle added to cart!`, 'success');
    setComboModalOpen(false);
    setSelectedCombo(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      <Navbar />

      {/* Hero Banner Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-red-600/10 via-amber-500/5 to-transparent border-b border-neutral-900 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 text-center z-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-max mx-auto border border-primary/20 mb-4">
              <Sparkles className="h-3 w-3" /> Freshly Baked & Delivered Hot
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight">
              Explore Our{' '}
              <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Gourmet Menu
              </span>
            </h1>
            <p className="text-sm md:text-base text-foreground mt-3 max-w-2xl mx-auto font-medium leading-relaxed">
              From signature double-cheese sourdough pizzas to tasty pastas and sweet molten
              desserts. Customize it your way.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Catalog Area */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12 w-full flex-1 flex flex-col lg:flex-row gap-8">
        {/* Left Side: Categories sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-4 lg:pb-0 scrollbar-none">
          <div className="hidden lg:block mb-4 text-xs font-bold text-foreground uppercase tracking-widest px-3">
            Menu Categories
          </div>
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap text-left flex items-center justify-between ${selectedCategory === cat.id
                ? 'bg-red-600 text-foreground shadow-lg shadow-red-950/20 scale-[1.02]'
                : 'bg-card/40 text-foreground hover:text-primary hover:bg-card/80 border border-neutral-900/60'
                }`}
            >
              <span>{cat.name}</span>
              {selectedCategory === cat.id && (
                <motion.div
                  layoutId="activeCatIndicator"
                  className="h-1.5 w-1.5 rounded-full bg-white hidden lg:block"
                />
              )}
            </button>
          ))}
        </aside>

        {/* Right Side: Products Grid & Filters */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Controls Bar */}
          <div className="p-4 rounded-3xl bg-card/20 border border-neutral-900/60 flex flex-col gap-4 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Input */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search food, toppings, sides..."
                  className="w-full bg-background/60 border border-neutral-900 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-foreground placeholder:text-foreground focus:border-red-500/50 outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground hover:text-primary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Veg / Non-Veg Select */}
                <div className="flex rounded-xl bg-background border border-neutral-900 p-1 text-[10px] font-bold">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'veg', label: 'Veg' },
                    { id: 'non-veg', label: 'Non-Veg' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setVegFilter(option.id as 'all' | 'veg' | 'non-veg')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${vegFilter === option.id
                        ? 'bg-card text-foreground'
                        : 'text-foreground hover:text-primary'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'popular' | 'newest' | 'price-low' | 'price-high')
                  }
                  className="bg-background border border-neutral-900 rounded-xl px-3 py-2 text-[10px] font-bold text-foreground focus:border-red-500 outline-none cursor-pointer"
                >
                  <option value="popular">Popularity</option>
                  <option value="newest">Newest Arrived</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                {/* Price Slider */}
                <div className="flex items-center gap-2 bg-background border border-neutral-900 px-3 py-1.5 rounded-xl text-[10px] font-bold text-foreground w-full sm:w-auto justify-between">
                  <span>Max Price: ₹{maxPrice}</span>
                  <input
                    type="range"
                    min="40"
                    max="1600"
                    step="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-20 md:w-24 accent-red-500 cursor-pointer h-1 bg-neutral-800 rounded-lg appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Filters Row */}
            <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-neutral-900/60">
              {/* Rating Filter */}
              <div className="flex items-center gap-1 bg-background border border-neutral-900 px-3 py-1.5 rounded-xl text-[10px] font-bold text-foreground">
                <span>Min Rating:</span>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(Number(e.target.value))}
                  className="bg-transparent border-0 text-foreground outline-none cursor-pointer"
                >
                  <option value="0">All Ratings</option>
                  <option value="4">4.0+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.8">4.8+ Stars</option>
                </select>
              </div>

              {/* Available Toggle */}
              <button
                onClick={() => setAvailabilityFilter(!availabilityFilter)}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${availabilityFilter
                  ? 'border-red-500 bg-red-500/10 text-red-500'
                  : 'border-neutral-900 bg-background text-foreground hover:text-primary'
                  }`}
              >
                In Stock Only
              </button>

              {/* Combo Platter Toggle */}
              <button
                onClick={() => setOffersFilter(!offersFilter)}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${offersFilter
                  ? 'border-red-500 bg-red-500/10 text-red-500'
                  : 'border-neutral-900 bg-background text-foreground hover:text-primary'
                  }`}
              >
                Offers & Combos
              </button>
            </div>
          </div>

          {/* Catalog Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-3xl bg-card/30 border border-neutral-900/60 animate-pulse space-y-4"
                >
                  <div className="h-44 w-full bg-background rounded-2xl" />
                  <div className="h-4 w-2/3 bg-neutral-800 rounded" />
                  <div className="h-3 w-full bg-neutral-800 rounded" />
                  <div className="h-8 w-full bg-neutral-800 rounded-xl mt-2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-card/10 border border-dashed border-neutral-900 rounded-3xl">
              <ShoppingBag className="h-12 w-12 text-neutral-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No items match your filters</h3>
              <p className="text-xs text-foreground mt-1">
                Try resetting search query, veg status, or maximum price.
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setVegFilter('all');
                  setMaxPrice(1600);
                  setRatingFilter(0);
                  setAvailabilityFilter(false);
                  setOffersFilter(false);
                }}
                className="mt-4 bg-card border border-neutral-800 hover:bg-neutral-800 text-foreground text-xs py-2 px-4 rounded-xl"
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const isVeg = isProductVeg(product);
                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="group p-4 rounded-3xl bg-card/30 border border-neutral-900/60 hover:border-neutral-800 hover:bg-card/50 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300"
                    >
                      <div>
                        {/* Food Badges */}
                        <div className="absolute top-6 left-6 z-10 flex gap-1.5 items-center">
                          {product.category === 'pizza' && (
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold text-foreground flex items-center gap-0.5 shadow-md ${isVeg ? 'bg-emerald-600' : 'bg-red-600'}`}
                            >
                              {isVeg ? (
                                <Leaf className="h-2.5 w-2.5" />
                              ) : (
                                <Flame className="h-2.5 w-2.5" />
                              )}
                              {isVeg ? 'VEG' : 'CHICKEN'}
                            </span>
                          )}
                          {product.category === 'combos' && (
                            <span className="px-2 py-0.5 rounded-lg bg-primary text-primary-foreground text-[9px] font-extrabold flex items-center gap-0.5 shadow-md">
                              <Sparkles className="h-2.5 w-2.5" /> COMBO BUILDER
                            </span>
                          )}
                        </div>

                        {/* Image Frame */}
                        <div
                          onClick={() =>
                            product.category === 'pizza'
                              ? router.push(`/product/${product.id}`)
                              : handleAddToCart(product)
                          }
                          className="h-44 w-full bg-background border border-neutral-900/60 rounded-2xl overflow-hidden mb-4 relative cursor-pointer"
                        >
                          <img
                            src={getProductImage(product.imageUrl, product.category, product.name)}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                            <span className="text-[10px] font-bold bg-background/80 backdrop-blur border border-neutral-800 px-3 py-1.5 rounded-full text-foreground">
                              {product.category === 'combos'
                                ? 'CONFIGURE COMBO'
                                : product.category === 'pizza'
                                  ? 'CUSTOMIZE OPTIONS'
                                  : 'QUICK ADD'}
                            </span>
                          </div>
                        </div>

                        {/* Text */}
                        <div className="px-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {product.name}
                            </h4>
                            <span className="text-xs font-extrabold text-primary">
                              ₹{product.price}
                            </span>
                          </div>
                          <p className="text-[11px] text-foreground font-medium leading-relaxed mt-1.5 line-clamp-2">
                            {product.description ||
                              'No description available for this delicious menu item.'}
                          </p>
                        </div>
                      </div>

                      {/* Buy Control */}
                      <div className="mt-4 px-1">
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full bg-card border border-neutral-800/80 hover:bg-red-600 hover:text-primary hover:border-red-600 text-foreground text-xs font-bold py-2.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 group-hover:shadow-[0_4px_15px_rgba(227,24,55,0.15)] cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add to Order
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Combo Builder Modal */}
      <Dialog open={comboModalOpen} onOpenChange={setComboModalOpen}>
        <DialogContent className="bg-white border border-border text-foreground max-w-3xl rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-none">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Customize Combo: {selectedCombo?.name}
            </DialogTitle>
            <p className="text-xs text-foreground mt-1">
              {selectedCombo?.description ||
                'Select your items below to build your customized combo platter.'}
            </p>
          </DialogHeader>

          {/* Slots Builder */}
          <div className="py-4 space-y-6">
            {(selectedCombo?.comboItems || []).map((slot: ComboSlot) => {
              const selectedItemId = comboSelections.find(
                (s) => s.slotId === slot.slotId,
              )?.productId;
              // Get candidate products in category
              const candidateProducts = products.filter(
                (p) => p.category === slot.category && p.isAvailable,
              );

              return (
                <div key={slot.slotId} className="space-y-2.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-widest block">
                    {slot.name} {slot.size ? `(${slot.size} size)` : ''}
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {candidateProducts.map((p) => {
                      const isSelected = selectedItemId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectComboItem(slot.slotId, p)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between items-center text-center relative overflow-hidden ${isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                            : 'border-border bg-secondary text-foreground hover:border-neutral-350 hover:text-primary'
                            }`}
                        >
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-primary text-primary-foreground">
                              <Check className="h-2 w-2 stroke-[4px]" />
                            </span>
                          )}
                          <div className="h-14 w-14 bg-secondary border border-border rounded-xl overflow-hidden mb-2 shrink-0">
                            <img
                              src={getProductImage(p.imageUrl, p.category, p.name)}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span className="text-[10px] font-bold leading-tight line-clamp-1">
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

          {/* Foot Action */}
          <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-center sm:text-left">
              <span className="text-xs text-foreground font-bold">Combo Platter Total</span>
              <p className="text-lg font-extrabold text-primary">₹{selectedCombo?.price}</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setComboModalOpen(false)}
                className="flex-1 sm:flex-initial bg-transparent border-border text-foreground hover:bg-secondary rounded-xl py-2 px-4 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddComboToCart}
                className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-2 px-6 text-xs font-bold shadow-lg shadow-red-950/20 cursor-pointer"
              >
                Add Combo Platter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <section className="border-t border-neutral-900 pt-12 mt-12 w-full max-w-7xl mx-auto px-4 mb-8">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-red-500" /> Recently Viewed Items
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentlyViewed.map((p) => (
              <div
                key={p.id}
                onClick={() =>
                  p.category === 'pizza' ? router.push(`/product/${p.id}`) : handleAddToCart(p)
                }
                className="group p-3 rounded-2xl bg-card/20 border border-neutral-900 hover:border-neutral-800 cursor-pointer flex gap-3 shadow-md transition-all duration-300 items-center"
              >
                <div className="h-12 w-12 bg-background border border-neutral-900 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={getProductImage(p.imageUrl, p.category, p.name)}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-[10px] font-bold text-amber-500 mt-0.5">₹{p.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
