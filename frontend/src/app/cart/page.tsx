'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Heart,
  ArrowRight,
  Sparkles,
  Tag,
  HelpCircle,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCartStore, getItemUnitPrice } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/types';
import { getProductImage } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, updateQuantity, removeItem, getCartTotal, clearCart } = useCartStore();
  const addToast = useToastStore((state) => state.addToast);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<{
    code: string;
    discount: number;
    type: 'flat' | 'percent';
  } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Save for Later states
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);

  // Load save for later items
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saved_later_items');
      if (saved) {
        try {
          setSavedItems(JSON.parse(saved) as CartItem[]);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Sync save for later items helper
  const syncSavedItems = (newSaved: CartItem[]) => {
    setSavedItems(newSaved);
    localStorage.setItem('saved_later_items', JSON.stringify(newSaved));
  };

  // Save item for later
  const handleSaveForLater = (item: CartItem) => {
    // Add to saved
    const updatedSaved = [...savedItems];
    const exists = updatedSaved.some(
      (s) =>
        s.product.id === item.product.id &&
        JSON.stringify(s.customization) === JSON.stringify(item.customization),
    );
    if (!exists) {
      updatedSaved.push({ ...item, quantity: 1 });
      syncSavedItems(updatedSaved);
    }

    // Remove from cart
    removeItem(item.product.id, item.customization);
    addToast(`${item.product.name} saved for later!`, 'success');
  };

  // Move saved item back to cart
  const handleMoveToCart = (item: CartItem) => {
    // Add to cart
    useCartStore.getState().addItem(item.product, 1, item.customization);

    // Remove from saved
    const updatedSaved = savedItems.filter(
      (s) =>
        !(
          s.product.id === item.product.id &&
          JSON.stringify(s.customization) === JSON.stringify(item.customization)
        ),
    );
    syncSavedItems(updatedSaved);
    addToast(`${item.product.name} moved back to cart!`, 'success');
  };

  // Remove from saved
  const handleRemoveSaved = (item: CartItem) => {
    const updatedSaved = savedItems.filter(
      (s) =>
        !(
          s.product.id === item.product.id &&
          JSON.stringify(s.customization) === JSON.stringify(item.customization)
        ),
    );
    syncSavedItems(updatedSaved);
    addToast(`${item.product.name} removed from saved list.`, 'info');
  };

  // Apply coupon code
  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'PIZZA50') {
      setActiveCoupon({ code: 'PIZZA50', discount: 50, type: 'flat' });
      addToast('PIZZA50 coupon applied: ₹50 flat discount!', 'success');
    } else if (code === 'FEAST10') {
      setActiveCoupon({ code: 'FEAST10', discount: 10, type: 'percent' });
      addToast('FEAST10 coupon applied: 10% discount!', 'success');
    } else {
      setCouponError('Invalid coupon code. Try PIZZA50 or FEAST10');
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setActiveCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Sums calculations
  const subtotal = getCartTotal();
  const deliveryCharge = subtotal >= 499 || subtotal === 0 ? 0 : 49;

  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.type === 'flat') {
      discountAmount = activeCoupon.discount;
    } else if (activeCoupon.type === 'percent') {
      discountAmount = Math.round((subtotal * activeCoupon.discount) / 100);
    }
  }

  // Ensure discount is not greater than subtotal
  discountAmount = Math.min(discountAmount, subtotal);
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);

  // Navigate to checkout
  const handleProceedCheckout = () => {
    if (!isAuthenticated) {
      addToast('Please login to place an order.', 'info');
      router.push('/login');
      return;
    }
    if (items.length === 0) {
      addToast('Your cart is empty.', 'error');
      return;
    }
    // Save coupon status in localStorage or pass it via url/checkout context
    if (activeCoupon) {
      localStorage.setItem('checkout_coupon_code', activeCoupon.code);
      localStorage.setItem('checkout_coupon_discount', discountAmount.toString());
    } else {
      localStorage.removeItem('checkout_coupon_code');
      localStorage.removeItem('checkout_coupon_discount');
    }
    router.push('/checkout');
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      <Navbar />

      {/* Hero Header */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-red-600/5 via-transparent to-transparent border-b border-neutral-900">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-red-500" />
            Shopping Cart
          </h1>
          <p className="text-xs text-foreground font-medium mt-1">
            Review your custom order, apply coupons, and checkout securely.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 flex flex-col lg:flex-row gap-8">
        {/* Left Side: Basket Items */}
        <div className="flex-1 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-20 bg-card/10 border border-dashed border-neutral-900 rounded-3xl space-y-4">
              <div className="p-4 rounded-full bg-card border border-neutral-800 text-neutral-700 w-max mx-auto">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Your basket is empty</h3>
                <p className="text-xs text-foreground mt-1">
                  Add delicious pizzas, sides and desserts to start ordering!
                </p>
              </div>
              <Button
                onClick={() => router.push('/menu')}
                className="bg-red-600 hover:bg-red-700 text-foreground rounded-xl text-xs py-2.5 px-6 font-bold cursor-pointer"
              >
                Browse Gourmet Menu
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="hidden sm:grid grid-cols-12 text-xs font-bold text-foreground uppercase tracking-widest pb-2 px-4 border-b border-neutral-900">
                <div className="col-span-6">Product Details</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-3 text-right">Total Price</div>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${idx}`}
                    className="p-4 rounded-3xl bg-card/20 border border-neutral-900 flex flex-col sm:grid sm:grid-cols-12 items-center gap-4 shadow-md"
                  >
                    {/* Item details */}
                    <div className="col-span-6 flex gap-4 w-full">
                      <div className="h-20 w-20 bg-background border border-neutral-800 rounded-2xl overflow-hidden shrink-0">
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
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {item.product.name}
                        </h4>

                        {item.customization && (
                          <div className="text-[10px] text-foreground font-bold mt-1 leading-tight space-y-0.5">
                            {item.customization.size && <div>Size: {item.customization.size}</div>}
                            {item.customization.crust && (
                              <div>Crust: {item.customization.crust}</div>
                            )}
                            {item.customization.extraCheese && <div>+ Extra Mozzarella</div>}
                            {item.customization.extraToppings &&
                              item.customization.extraToppings.length > 0 && (
                                <div>Toppings: {item.customization.extraToppings.join(', ')}</div>
                              )}
                            {item.customization.comboSelections &&
                              item.customization.comboSelections.length > 0 && (
                                <div className="text-primary mt-1">
                                  Contains:{' '}
                                  {item.customization.comboSelections
                                    .map((s) => s.name)
                                    .join(' + ')}
                                </div>
                              )}
                          </div>
                        )}

                        <p className="text-xs font-semibold text-red-500 mt-1">
                          ₹{getItemUnitPrice(item.product, item.customization)}
                        </p>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="col-span-3 flex items-center justify-center gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-background border border-neutral-900">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1, item.customization)
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
                            updateQuantity(item.product.id, item.quantity + 1, item.customization)
                          }
                          className="text-foreground hover:text-primary"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Total column */}
                    <div className="col-span-3 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto border-t sm:border-t-0 border-neutral-900 pt-3 sm:pt-0">
                      <span className="sm:hidden text-xs font-bold text-foreground uppercase">
                        Subtotal
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-foreground">
                          ₹{getItemUnitPrice(item.product, item.customization) * item.quantity}
                        </p>
                        <div className="flex gap-2.5 mt-1">
                          <button
                            onClick={() => handleSaveForLater(item)}
                            className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-0.5"
                          >
                            <Heart className="h-3 w-3" /> Save
                          </button>
                          <button
                            onClick={() => removeItem(item.product.id, item.customization)}
                            className="text-[10px] font-bold text-foreground hover:text-red-500 flex items-center gap-0.5"
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save for Later Shelf */}
          {savedItems.length > 0 && (
            <div className="pt-10 border-t border-neutral-900">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                <Heart className="h-4.5 w-4.5 text-primary fill-primary" /> Saved for Later (
                {savedItems.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedItems.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${idx}`}
                    className="p-3.5 rounded-2xl bg-card/10 border border-neutral-900 flex gap-3.5 items-center shadow"
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
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-foreground truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-foreground font-medium">
                        ₹{getItemUnitPrice(item.product, item.customization)}
                      </p>

                      <div className="flex gap-3 mt-1.5">
                        <button
                          onClick={() => handleMoveToCart(item)}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Move to Basket
                        </button>
                        <button
                          onClick={() => handleRemoveSaved(item)}
                          className="text-[10px] font-bold text-foreground hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Order Summary */}
        {items.length > 0 && (
          <div className="w-full lg:w-96 shrink-0 space-y-6">
            {/* Promo Code Input */}
            <div className="p-5 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-3.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-red-500" /> Have a Coupon?
              </label>

              {activeCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-bold">
                  <span>Coupon {activeCoupon.code} Active</span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-foreground hover:text-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="E.g. PIZZA50, FEAST10"
                    className="flex-1 bg-background border border-neutral-900 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-foreground outline-none focus:border-red-500/50"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    className="bg-card hover:bg-neutral-800 border border-neutral-800 text-foreground text-xs font-bold px-4 rounded-xl cursor-pointer"
                  >
                    Apply
                  </Button>
                </div>
              )}
              {couponError && <p className="text-[10px] font-bold text-red-500">{couponError}</p>}
            </div>

            {/* Billing Breakdown */}
            <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-foreground border-b border-neutral-900 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs font-semibold text-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (GST 5%)</span>
                  <span>₹{Math.round(subtotal * 0.05)}</span>
                </div>
              </div>

              {/* Total display */}
              <div className="border-t border-neutral-900 pt-3 flex justify-between items-center text-sm font-extrabold text-foreground">
                <span>Grand Total</span>
                <span className="text-red-500 text-lg">
                  ₹{grandTotal + Math.round(subtotal * 0.05)}
                </span>
              </div>

              {/* Free delivery indicator */}
              {subtotal < 499 && (
                <div className="p-3 rounded-2xl bg-background/60 border border-neutral-900 text-[10px] text-foreground font-semibold text-center">
                  Add <span className="text-primary font-bold">₹{499 - subtotal}</span> more for
                  FREE Delivery!
                </div>
              )}

              {/* Checkout Trigger */}
              <Button
                onClick={handleProceedCheckout}
                className="w-full bg-red-600 hover:bg-red-700 text-foreground font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 transition-all cursor-pointer"
              >
                PROCEED TO CHECKOUT <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
