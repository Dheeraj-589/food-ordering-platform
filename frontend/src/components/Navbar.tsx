'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Sparkles,
  MapPin,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore, getItemUnitPrice } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import UserMenu from './UserMenu';
import SearchModal from './SearchModal';
import api from '@/lib/api';
import { getProductImage } from '@/lib/utils';

export default function Navbar() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { items, updateQuantity, removeItem, getCartTotal, getCartItemCount, clearCart } =
    useCartStore();
  const addToast = useToastStore((state) => state.addToast);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(
    'Vizianagaram, Andhra Pradesh, 535003, India',
  );
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Monitor scroll for header background opacity shift
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync user home address if available
  useEffect(() => {
    if (user) {
      setDeliveryAddress('Vizianagaram, Andhra Pradesh, 535003, India');
    }
  }, [user]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      addToast('Please login to place an order.', 'info');
      router.push('/login');
      setIsCartOpen(false);
      return;
    }

    if (items.length === 0) {
      addToast('Your cart is empty.', 'error');
      return;
    }

    setIsCartOpen(false);
    router.push('/checkout');
  };

  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const totalItems = getCartItemCount();
  const subtotal = getCartTotal();
  const deliveryCharge = subtotal >= 499 ? 0 : 49;
  const grandTotal = subtotal + deliveryCharge;

  return (
    <>
      <nav
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${isScrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-neutral-900 shadow-[0_4px_30px_rgba(239,68,68,0.03)]'
          : 'bg-transparent border-b border-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="flex items-center gap-2 group text-xl font-extrabold tracking-wider bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent transition-all duration-300 hover:scale-105"
              >
                <span className="text-2xl text-red-500">🍕</span>
                <span>FOODIES EXPRESS</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { name: 'Home', action: () => router.push('/') },
                { name: 'Menu', action: () => router.push('/menu') },
                { name: 'Deals', action: () => router.push('/#deals') },
                { name: 'Why Us', action: () => router.push('/#why-us') },
                { name: 'How It Works', action: () => router.push('/#how-it-works') },
                { name: 'Reviews', action: () => router.push('/#reviews') },
              ].map((link) => (
                <button
                  key={link.name}
                  onClick={link.action}
                  className="text-sm font-semibold text-foreground hover:text-primary hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Icons & Actions */}
            <div className="flex items-center gap-4">
              {/* Search Trigger */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full bg-card/60 border border-neutral-800/40 text-foreground hover:text-primary hover:border-neutral-700 hover:bg-neutral-800 transition-all duration-200 cursor-pointer"
                aria-label="Search items"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Cart Trigger */}
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  setIsCartOpen(true);
                }}
                className="relative p-2 rounded-full bg-card/60 border border-neutral-800/40 text-foreground hover:text-primary hover:border-neutral-700 hover:bg-neutral-800 transition-all duration-200 cursor-pointer"
                aria-label="View shopping cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-extrabold text-foreground shadow-lg shadow-red-950/30"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </button>

              {/* Authentication Trigger */}
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-foreground font-bold text-sm tracking-wide shadow-lg shadow-red-950/20 hover:shadow-red-700/20 transition-all duration-250 cursor-pointer select-none"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Slide-over Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-neutral-900 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-neutral-900 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-bold text-foreground">Your Basket</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl bg-card/60 border border-neutral-800/40 text-foreground hover:text-primary hover:border-neutral-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {orderSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-12 space-y-4"
                  >
                    <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <CheckCircle className="h-10 w-10" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-foreground">Order Confirmed!</h4>
                      <p className="text-sm text-foreground mt-2 max-w-xs mx-auto">
                        Your delicious fresh pizzas are being prepared by our best chefs. Arriving
                        in 30 mins!
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-6 py-2.5 rounded-full bg-background border border-neutral-800 text-foreground font-bold text-xs hover:text-primary transition-all cursor-pointer"
                    >
                      Browse More Food
                    </button>
                  </motion.div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-20 space-y-3">
                    <div className="p-4 rounded-full bg-card border border-neutral-800 text-foreground">
                      <ShoppingCart className="h-10 w-10" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Your basket is empty</p>
                    <p className="text-xs text-foreground">
                      Add delicious freshly baked pizzas to start ordering!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Free shipping goal bar */}
                    {subtotal < 499 ? (
                      <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs font-medium text-amber-300/90 flex flex-col gap-1.5">
                        <div className="flex justify-between">
                          <span>Add ₹{499 - subtotal} more for Free Delivery!</span>
                          <span>{Math.round((subtotal / 499) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-card rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${(subtotal / 499) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs font-semibold text-emerald-700 flex items-center gap-1.5 justify-center">
                        <Sparkles className="h-4 w-4" /> Eligible for Free Delivery!
                      </div>
                    )}

                    {/* Cart Items List */}
                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div
                          key={`${item.product.id}-${idx}`}
                          className="p-3 rounded-2xl bg-card/30 border border-neutral-900 flex gap-3"
                        >
                          <div className="h-16 w-16 bg-background border border-neutral-800 rounded-xl overflow-hidden shrink-0">
                            <img
                              src={getProductImage(
                                item.product.imageUrl,
                                item.product.category,
                                item.product.name,
                              )}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-foreground truncate">
                                {item.product.name}
                              </h4>
                              {item.customization && (
                                <div className="text-[9px] text-foreground mt-0.5 leading-tight">
                                  {item.customization.size && (
                                    <span>Size: {item.customization.size}</span>
                                  )}
                                  {item.customization.crust && (
                                    <span> | Crust: {item.customization.crust}</span>
                                  )}
                                  {item.customization.extraCheese && <span> | Extra Cheese</span>}
                                  {item.customization.extraToppings &&
                                    item.customization.extraToppings.length > 0 && (
                                      <span>
                                        {' '}
                                        | Toppings: {item.customization.extraToppings.join(', ')}
                                      </span>
                                    )}
                                  {item.customization.comboSelections &&
                                    item.customization.comboSelections.length > 0 && (
                                      <div className="text-[8px] text-foreground mt-1">
                                        Combo:{' '}
                                        {item.customization.comboSelections
                                          .map((s) => s.name)
                                          .join(' + ')}
                                      </div>
                                    )}
                                </div>
                              )}
                              <p className="text-[10px] font-bold text-red-500 mt-0.5">
                                ₹{getItemUnitPrice(item.product, item.customization)}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              {/* Quantity adjustments */}
                              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-background border border-neutral-900">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.product.id,
                                      item.quantity - 1,
                                      item.customization,
                                    )
                                  }
                                  className="text-foreground hover:text-primary"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-bold text-foreground w-3 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.product.id,
                                      item.quantity + 1,
                                      item.customization,
                                    )
                                  }
                                  className="text-foreground hover:text-primary"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeItem(item.product.id, item.customization)}
                                className="text-foreground hover:text-red-500 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout Foot */}
              {!orderSuccess && items.length > 0 && (
                <div className="p-6 border-t border-neutral-900 bg-background space-y-4">
                  {/* Delivery Address Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-500" /> Delivery Address
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter delivery address"
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-card border border-neutral-800 text-foreground placeholder-neutral-600 focus:border-red-500/50 outline-none transition-colors"
                    />
                  </div>

                  {/* Summary Calculations */}
                  <div className="space-y-1.5 text-xs text-foreground font-semibold pt-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge</span>
                      <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-neutral-900">
                      <span>Grand Total</span>
                      <span className="text-red-500 text-base">₹{grandTotal}</span>
                    </div>
                  </div>

                  {/* CTA button */}
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-foreground font-bold text-sm tracking-wide shadow-lg shadow-red-950/20 hover:shadow-red-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      'PROCEED TO CHECKOUT'
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
