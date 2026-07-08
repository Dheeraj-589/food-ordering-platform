'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Plus, Minus, Info, ShoppingBag } from 'lucide-react';
import { Product, CartItemCustomization } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getProductImage } from '@/lib/utils';

const SIZES = [
  { id: 'small', label: 'Small', details: 'Base - ₹50' },
  { id: 'medium', label: 'Medium', details: 'Regular' },
  { id: 'large', label: 'Large', details: '+₹150' },
] as const;

const CRUSTS = [
  { id: 'classic', label: 'Classic Hand Tossed', details: 'Traditional recipe crust' },
  { id: 'thin', label: 'Thin Crust', details: 'Light and crispy wheat base' },
  { id: 'cheese-burst', label: 'Cheese Burst', details: 'Stuffed with melted mozzarella (+₹99)' },
] as const;

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);
  const { user, setAuth } = useAuthStore();

  // States
  const [isFavorite, setIsFavorite] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Customization States inside Quick View
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [selectedCrust, setSelectedCrust] = useState<'classic' | 'thin' | 'cheese-burst'>(
    'classic',
  );
  const [extraToppings, setExtraToppings] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);

  // Determine Veg vs Non-Veg
  const isNonVeg =
    product.name.toLowerCase().includes('pepperoni') ||
    product.name.toLowerCase().includes('chicken') ||
    product.name.toLowerCase().includes('meat') ||
    product.name.toLowerCase().includes('bacon');

  // Load favorite state from user object or local storage
  useEffect(() => {
    try {
      if (user) {
        const wishlist = user.wishlist ? JSON.parse(user.wishlist) : [];
        setIsFavorite(wishlist.includes(product.id));
      } else {
        const favs = JSON.parse(localStorage.getItem('fav_products') || '[]');
        setIsFavorite(favs.includes(product.id));
      }
    } catch (e) {
      console.error(e);
    }
  }, [product.id, user]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (user) {
        const currentWishlist = user.wishlist ? JSON.parse(user.wishlist) : [];
        let updatedWishlist = [];
        if (isFavorite) {
          updatedWishlist = currentWishlist.filter((id: number) => id !== product.id);
          addToast(`Removed ${product.name} from wishlist.`, 'info');
        } else {
          updatedWishlist = [...currentWishlist, product.id];
          addToast(`Added ${product.name} to wishlist! ❤️`, 'success');
        }
        setIsFavorite(!isFavorite);
        const res = await api.patch('/users/wishlist', { wishlist: updatedWishlist });
        const token = localStorage.getItem('auth_token') || '';
        const refreshToken = localStorage.getItem('auth_refresh_token') || '';
        setAuth(res.data, token, refreshToken);
      } else {
        const favs = JSON.parse(localStorage.getItem('fav_products') || '[]');
        let updatedFavs = [];
        if (isFavorite) {
          updatedFavs = favs.filter((id: number) => id !== product.id);
          addToast(`Removed ${product.name} from favorites.`, 'info');
        } else {
          updatedFavs = [...favs, product.id];
          addToast(`Added ${product.name} to favorites! ❤️`, 'success');
        }
        localStorage.setItem('fav_products', JSON.stringify(updatedFavs));
        setIsFavorite(!isFavorite);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Pricing calculations
  const basePrice = Number(product.price);
  const sizeCost = selectedSize === 'small' ? -50 : selectedSize === 'large' ? 150 : 0;
  const crustCost = selectedCrust === 'cheese-burst' ? 99 : 0;
  const toppingsCost = extraToppings.length * 39;
  const singleUnitPrice = basePrice + sizeCost + crustCost + toppingsCost;
  const totalPrice = singleUnitPrice * quickViewQuantity;

  const oldPrice = Math.round((basePrice + sizeCost) * 1.25);

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addItem(product, 1);
    addToast(`${product.name} added to cart!`, 'success');
  };

  const handleQuickViewAdd = () => {
    // Construct instructions mapping customizations
    const customizationDesc = [
      `Size: ${selectedSize.toUpperCase()}`,
      `Crust: ${selectedCrust.replace('-', ' ')}`,
      extraToppings.length > 0 ? `Toppings: ${extraToppings.join(', ')}` : '',
      specialInstructions.trim() ? `Instructions: ${specialInstructions}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    // Adjust product details based on size/options for cart display
    const customizedProduct: Product = {
      ...product,
      name: `${product.name} (${selectedSize.toUpperCase()})`,
      price: singleUnitPrice,
    };

    const customizationObj: CartItemCustomization = {
      size: selectedSize === 'small' ? 'Regular' : selectedSize === 'large' ? 'Large' : 'Medium',
      crust:
        selectedCrust === 'thin'
          ? 'Thin Crust'
          : selectedCrust === 'cheese-burst'
            ? 'Cheese Burst'
            : 'Classic Hand Tossed',
      extraCheese: false,
      extraToppings: extraToppings,
    };

    addItem(customizedProduct, quickViewQuantity, customizationObj, customizationDesc);
    addToast(`Added customized ${product.name} to cart! 🍕`, 'success');
    setIsQuickViewOpen(false);

    // Reset customizations
    setSelectedSize('medium');
    setSelectedCrust('classic');
    setExtraToppings([]);
    setSpecialInstructions('');
    setQuickViewQuantity(1);
  };

  const handleToppingToggle = (topping: string) => {
    if (extraToppings.includes(topping)) {
      setExtraToppings(extraToppings.filter((t) => t !== topping));
    } else {
      setExtraToppings([...extraToppings, topping]);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="group relative flex flex-col justify-between p-4 rounded-3xl bg-card/30 border border-neutral-900/60 hover:border-neutral-800 hover:bg-card/50 shadow-lg select-none"
      >
        <div>
          {/* Card Top Image Block */}
          <div className="relative aspect-square w-full rounded-2xl bg-background overflow-hidden border border-neutral-900 mb-4">
            <img
              src={getProductImage(product.imageUrl, product.category, product.name)}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Floating Actions overlay */}
            <div className="absolute inset-0 p-3 flex justify-between items-start pointer-events-none">
              {/* Veg / Non-Veg Badge */}
              <div
                className={`h-6 w-6 rounded-md bg-white/90 backdrop-blur-md border flex items-center justify-center p-[4px] pointer-events-auto ${isNonVeg
                  ? 'border-primary/40 text-primary'
                  : 'border-emerald-600/40 text-emerald-500'
                  }`}
                title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-sm bg-current ${isNonVeg ? 'clip-triangle' : 'rounded-full'}`}
                />
              </div>

              {/* Heart Button */}
              <motion.button
                whileTap={{ scale: 0.7 }}
                onClick={toggleFavorite}
                className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:text-primary transition-colors pointer-events-auto cursor-pointer"
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-primary text-primary' : ''}`}
                />
              </motion.button>
            </div>

            {/* Quick View Button overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
              <button
                onClick={() => setIsQuickViewOpen(true)}
                className="pointer-events-auto px-4 py-2 bg-white text-foreground rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
              >
                <Info className="h-3.5 w-3.5" /> Quick View
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>4.8</span>
              </div>
            </div>

            <h4 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h4>

            <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
              {product.description ||
                'No description provided. Experience our handcrafted artisan dishes.'}
            </p>
          </div>
        </div>

        {/* Pricing & Add to Cart Footer */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-primary">₹{basePrice}</span>
              <span className="text-xs text-foreground line-through">₹{oldPrice}</span>
            </div>
            <span className="text-[8px] text-foreground font-bold uppercase tracking-widest">
              Exclude Tax
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-primary border border-border hover:border-primary text-foreground hover:text-primary-foreground font-bold text-xs transition-all flex items-center gap-1 cursor-pointer select-none"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </motion.div>

      {/* Quick View Customization Modal */}
      <Dialog open={isQuickViewOpen} onOpenChange={(open) => !open && setIsQuickViewOpen(false)}>
        <DialogContent className="bg-white border border-neutral-200 text-neutral-900 max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-neutral-800">
              🍕 Customize Your Pizza
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Left Preview Column */}
            <div className="space-y-4">
              <div className="aspect-square w-full rounded-2xl bg-neutral-50 border border-neutral-200 overflow-hidden relative">
                <img
                  src={getProductImage(product.imageUrl, product.category, product.name)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                    <p className="text-xs text-foreground mt-1">{product.description}</p>
                  </div>
                </div>
              </div>

              {/* Price calculations review */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs font-semibold text-foreground">
                <div className="flex justify-between">
                  <span>Base Price</span>
                  <span>₹{basePrice}</span>
                </div>
                {selectedSize !== 'medium' && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Size Upgrade ({selectedSize.toUpperCase()})</span>
                    <span>{sizeCost > 0 ? `+₹${sizeCost}` : `-₹${Math.abs(sizeCost)}`}</span>
                  </div>
                )}
                {selectedCrust !== 'classic' && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Crust Upgrade</span>
                    <span>+₹{crustCost}</span>
                  </div>
                )}
                {extraToppings.length > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Extra Toppings ({extraToppings.length})</span>
                    <span>+₹{toppingsCost}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-neutral-800 pt-1.5 border-t border-neutral-200">
                  <span>Total Unit Price</span>
                  <span>₹{singleUnitPrice}</span>
                </div>
              </div>
            </div>

            {/* Right Options Column */}
            <div className="space-y-5">
              {/* Size option selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                  Select Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${selectedSize === size.id
                        ? 'bg-primary/10 border-primary text-primary font-extrabold shadow-sm'
                        : 'bg-secondary border-border text-foreground hover:bg-secondary/80 hover:text-primary'
                        }`}
                    >
                      <p className="text-xs">{size.label}</p>
                      <p className="text-[9px] text-foreground font-semibold mt-0.5">
                        {size.details}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crust Option Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                  Select Crust
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {CRUSTS.map((crust) => (
                    <button
                      key={crust.id}
                      onClick={() => setSelectedCrust(crust.id)}
                      className={`px-4 py-2.5 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${selectedCrust === crust.id
                        ? 'bg-primary/10 border-primary text-primary font-extrabold shadow-sm'
                        : 'bg-secondary border-border text-foreground hover:bg-secondary/80 hover:text-primary'
                        }`}
                    >
                      <span className="text-xs">{crust.label}</span>
                      <span className="text-[9px] text-foreground font-semibold">
                        {crust.details}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Toppings checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                  Add Extra Toppings (+₹39 each)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Mozzarella Cheese',
                    'Fresh Basil',
                    'Mushrooms',
                    'Jalapenos',
                    'Sweet Corn',
                    'Black Olives',
                  ].map((topping) => (
                    <button
                      key={topping}
                      onClick={() => handleToppingToggle(topping)}
                      className={`px-3 py-2 rounded-xl border text-left text-xs font-semibold flex justify-between items-center transition-all cursor-pointer ${extraToppings.includes(topping)
                        ? 'bg-primary/10 border-primary text-primary font-extrabold shadow-sm'
                        : 'bg-secondary border-border text-foreground hover:bg-secondary/80 hover:text-primary'
                        }`}
                    >
                      <span>{topping}</span>
                      {extraToppings.includes(topping) && (
                        <span className="text-red-600 font-extrabold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions textbox */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                  Special Instructions
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Please bake well, cut into 8 slices..."
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder-muted-foreground focus:border-primary/50 outline-none transition-colors resize-none h-16"
                />
              </div>

              {/* Checkout buttons bottom */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                {/* Quantity triggers */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary border border-border">
                  <button
                    onClick={() => setQuickViewQuantity((q) => (q > 1 ? q - 1 : 1))}
                    className="text-foreground hover:text-primary cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-bold text-foreground w-4 text-center">
                    {quickViewQuantity}
                  </span>
                  <button
                    onClick={() => setQuickViewQuantity((q) => q + 1)}
                    className="text-foreground hover:text-primary cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleQuickViewAdd}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-foreground font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" /> ADD TO CART (₹{totalPrice})
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
