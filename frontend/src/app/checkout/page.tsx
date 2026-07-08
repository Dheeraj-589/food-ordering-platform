'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Compass,
  Clock,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Loader2,
  X,
  Check,
  HelpCircle,
  Tag,
  Trash2,
  Ticket,
  Percent,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCartStore, getItemUnitPrice } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { items, getCartTotal, clearCart } = useCartStore();
  const addToast = useToastStore((state) => state.addToast);

  // Address & slot inputs
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('ASAP'); // ASAP or scheduled slot
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'upi' | 'wallet'>('card');

  // Coupon states
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [inputCode, setInputCode] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationType, setValidationType] = useState<'success' | 'error' | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Loading & dialog states
  const [submitting, setSubmitting] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Fetch available public coupons on mount
  useEffect(() => {
    async function fetchAvailableCoupons() {
      setLoadingCoupons(true);
      try {
        const res = await api.get('/products/coupons');
        setAvailableCoupons(res.data);
      } catch (err) {
        console.error('Failed to fetch public coupons:', err);
      } finally {
        setLoadingCoupons(false);
      }
    }
    fetchAvailableCoupons();
  }, []);

  // Load coupon discount if saved in local storage from cart page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const code = localStorage.getItem('checkout_coupon_code');
      const discount = localStorage.getItem('checkout_coupon_discount');
      if (code && discount) {
        setCouponCode(code);
        setCouponDiscount(Number(discount));
        setInputCode(code);
        setValidationMessage('Coupon Applied Successfully');
        setValidationType('success');
      }
    }
  }, []);

  // Load user default saved address from MySQL
  useEffect(() => {
    if (user && user.addresses) {
      try {
        const savedAddresses = JSON.parse(user.addresses);
        if (Array.isArray(savedAddresses) && savedAddresses.length > 0) {
          const defaultAddr = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0];
          if (defaultAddr) {
            const formatted =
              `${defaultAddr.doorNo || ''}, ${defaultAddr.street || ''}, ${defaultAddr.city || ''}, ${defaultAddr.state || ''} - ${defaultAddr.zipCode || ''}`
                .replace(/^,\s*/, '')
                .replace(/^[,\s-]+|[,\s-]+$/g, '');
            setAddress(formatted);
          }
        }
      } catch (err) {
        console.error('Failed to parse user saved addresses:', err);
      }
    }
  }, [user]);

  // Protect page
  useEffect(() => {
    if (!isAuthenticated) {
      addToast('Please log in to continue to checkout.', 'info');
      router.push('/login');
    }
  }, [isAuthenticated, router, addToast]);

  const subtotal = getCartTotal();
  const deliveryCharge =
    subtotal - couponDiscount >= 499 || subtotal - couponDiscount === 0 ? 0 : 49;
  const taxes = Math.round((subtotal - couponDiscount) * 0.05);
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryCharge + taxes);

  // Time slot options
  const timeSlots = [
    { id: 'ASAP', label: 'As Soon As Possible (ASAP - 30 mins)' },
    { id: 'slot-1', label: '12:30 PM - 01:30 PM' },
    { id: 'slot-2', label: '02:00 PM - 03:00 PM' },
    { id: 'slot-3', label: '06:00 PM - 07:00 PM' },
    { id: 'slot-4', label: '08:00 PM - 09:00 PM' },
  ];

  // Validate coupon
  const handleValidateCoupon = async (codeToValidate: string) => {
    const code = codeToValidate.trim().toUpperCase();
    if (!code) {
      addToast('Please enter a coupon code.', 'error');
      return false;
    }

    setValidationMessage(null);
    setValidationType(null);

    try {
      const response = await api.post('/orders/validate-coupon', {
        code,
        subtotal,
      });
      const data = response.data;
      if (data.valid) {
        setCouponCode(data.coupon.code);
        setCouponDiscount(Number(data.discount));
        setValidationMessage('Coupon Applied Successfully');
        setValidationType('success');
        addToast(`Coupon ${data.coupon.code} applied successfully!`, 'success');
        return true;
      } else {
        setCouponCode(null);
        setCouponDiscount(0);
        setValidationMessage(data.message || 'Coupon Invalid');
        setValidationType('error');
        addToast(data.message || 'Coupon Invalid', 'error');
        return false;
      }
    } catch (err: any) {
      setCouponCode(null);
      setCouponDiscount(0);
      const msg = err.response?.data?.message || 'Coupon Invalid';
      setValidationMessage(msg);
      setValidationType('error');
      addToast(msg, 'error');
      return false;
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setCouponCode(null);
    setCouponDiscount(0);
    setInputCode('');
    setValidationMessage(null);
    setValidationType(null);
    addToast('Coupon removed successfully.', 'info');
  };

  // Apply best coupon
  const handleApplyBestCoupon = async () => {
    if (availableCoupons.length === 0) {
      addToast('No promotional coupons currently available.', 'info');
      return;
    }

    const candidates = availableCoupons
      .filter((c) => subtotal >= Number(c.minOrder))
      .map((c) => {
        let potentialDiscount = 0;
        if (c.type === 'percentage') {
          potentialDiscount = Math.round((subtotal * Number(c.value)) / 100);
        } else {
          potentialDiscount = Number(c.value);
        }
        potentialDiscount = Math.min(potentialDiscount, subtotal);
        return { coupon: c, benefit: potentialDiscount };
      })
      .sort((a, b) => b.benefit - a.benefit);

    if (candidates.length === 0) {
      addToast('No coupons met the minimum order requirements.', 'error');
      return;
    }

    addToast('Checking best available coupon code...', 'info');

    for (const candidate of candidates) {
      const success = await handleValidateCoupon(candidate.coupon.code);
      if (success) {
        setInputCode(candidate.coupon.code);
        return;
      }
    }

    addToast('No eligible coupons could be applied.', 'error');
  };

  // Initiate payment dialog
  const handlePayNow = () => {
    if (!address.trim()) {
      addToast('Please enter a delivery address.', 'error');
      return;
    }
    setPaymentDialogOpen(true);
  };

  // Complete Order Creation
  const handleProcessPayment = async (status: 'successful' | 'failed' | 'pending') => {
    setPaymentDialogOpen(false);
    setSubmitting(true);

    // Map dialog action to DB payment status
    let dbPaymentStatus: 'paid' | 'failed' | 'pending' = 'pending';
    if (status === 'successful') dbPaymentStatus = 'paid';
    if (status === 'failed') dbPaymentStatus = 'failed';
    if (status === 'pending') dbPaymentStatus = 'pending'; // Cash on Delivery

    try {
      // Serialize customizations into specialInstructions JSON for persistence
      const payloadItems = items.map((item) => {
        let customizationText = '';
        if (item.customization) {
          customizationText = JSON.stringify(item.customization);
        }

        return {
          productId: item.product.id,
          quantity: item.quantity,
          specialInstructions: customizationText || item.specialInstructions || '',
        };
      });

      const orderPayload = {
        deliveryAddress:
          `${address.trim()} (Time: ${deliveryTime})` +
          (instructions.trim() ? ` | Inst: ${instructions.trim()}` : ''),
        items: payloadItems,
        paymentStatus: dbPaymentStatus,
        couponCode: couponCode || undefined,
      };

      const response = await api.post('/orders', orderPayload);
      const createdOrder = response.data;

      // Clean local checkout coupon details
      localStorage.removeItem('checkout_coupon_code');
      localStorage.removeItem('checkout_coupon_discount');

      if (dbPaymentStatus === 'paid') {
        clearCart();
        addToast('Payment Successful! Order created. 🍕', 'success');
        router.push(`/order-success?orderId=${createdOrder.id}`);
      } else if (dbPaymentStatus === 'failed') {
        // DO NOT clear cart because user will want to retry
        addToast('Payment Failed! Order stored. You can retry payment.', 'error');
        router.push(`/order/${createdOrder.id}`);
      } else {
        // COD
        clearCart();
        addToast('Order placed successfully (Cash on Delivery)! 🍕', 'success');
        router.push(`/order-success?orderId=${createdOrder.id}`);
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Could not place order. Please try again.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="py-12 bg-gradient-to-b from-red-600/5 via-transparent to-transparent border-b border-neutral-900">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-red-500" /> Secure Checkout
          </h1>
          <p className="text-xs text-foreground font-medium mt-1">
            Complete your delivery information and checkout using our demo sandbox options.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 flex flex-col lg:flex-row gap-8">
        {/* Left: Input sections */}
        <div className="flex-1 space-y-6">
          {/* Address input */}
          <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-neutral-900 pb-3">
              <MapPin className="h-4.5 w-4.5 text-red-500" /> Delivery Address
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                Home / Office Address
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete door no., street, and locality details"
                className="w-full bg-background border border-neutral-900 rounded-2xl px-4 py-3 text-xs font-semibold text-foreground placeholder:text-foreground outline-none focus:border-red-500/50 resize-none"
              />
            </div>
          </div>

          {/* Delivery instructions & slot */}
          <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-neutral-900 pb-3">
              <Compass className="h-4.5 w-4.5 text-red-500" /> Instructions & Timing
            </h3>

            {/* Special delivery instructions */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="E.g. Leave with security guard, do not ring bell"
                className="w-full bg-background border border-neutral-900 rounded-xl px-4 py-3 text-xs font-semibold text-foreground placeholder:text-foreground outline-none focus:border-red-500/50"
              />
            </div>

            {/* Time Slot Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> Select Delivery Time
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setDeliveryTime(slot.id)}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${deliveryTime === slot.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary text-foreground hover:border-neutral-350 hover:text-primary'
                      }`}
                  >
                    <span>{slot.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-neutral-900 pb-3">
              <CreditCard className="h-4.5 w-4.5 text-red-500" /> Payment Sandbox
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'card', label: 'Credit Card' },
                { id: 'upi', label: 'Demo UPI' },
                { id: 'wallet', label: 'Demo Wallet' },
                { id: 'cod', label: 'Cash on Delivery' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as 'cod' | 'card' | 'upi' | 'wallet')}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${paymentMethod === method.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary text-foreground hover:border-neutral-350 hover:text-primary'
                    }`}
                >
                  <span className="text-xs font-bold">{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Checkout summary card */}
        <div className="w-full lg:w-96 shrink-0 space-y-6">
          {/* Coupon / Voucher Section */}
          <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-neutral-900 pb-3">
              <Ticket className="h-4.5 w-4.5 text-red-500" /> Apply Coupon
            </h3>

            {/* Input code & Validate button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="PROMO CODE"
                disabled={!!couponCode}
                className="flex-1 bg-background border border-neutral-900 rounded-xl px-3 py-2 text-xs font-bold text-foreground placeholder:text-foreground uppercase outline-none focus:border-red-500/50 font-sans"
              />
              {couponCode ? (
                <Button
                  onClick={handleRemoveCoupon}
                  variant="outline"
                  className="bg-transparent border-red-500/30 hover:bg-red-500/10 text-red-500 font-bold px-3 text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              ) : (
                <Button
                  onClick={() => handleValidateCoupon(inputCode)}
                  className="bg-red-600 hover:bg-red-700 text-foreground font-bold px-4 text-xs rounded-xl cursor-pointer"
                >
                  Apply
                </Button>
              )}
            </div>

            {/* Validation Message */}
            {validationMessage && (
              <p
                className={`text-[10px] font-bold ${validationType === 'success' ? 'text-emerald-500' : 'text-red-500'
                  }`}
              >
                {validationMessage}
              </p>
            )}

            {/* Apply Best Coupon Button */}
            {!couponCode && availableCoupons.length > 0 && (
              <div className="pt-1">
                <Button
                  onClick={handleApplyBestCoupon}
                  className="w-full bg-card hover:bg-neutral-850 border border-neutral-800 text-neutral-350 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" /> Apply Best Coupon
                </Button>
              </div>
            )}

            {/* Available Coupons list */}
            {availableCoupons.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block font-sans">
                  Available Coupons
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
                  {availableCoupons.map((coupon) => {
                    const isApplicable = subtotal >= Number(coupon.minOrder);
                    return (
                      <button
                        key={coupon.id}
                        onClick={() => {
                          if (!couponCode) {
                            setInputCode(coupon.code);
                            handleValidateCoupon(coupon.code);
                          }
                        }}
                        disabled={!!couponCode}
                        className={`w-full p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all font-sans ${couponCode === coupon.code
                          ? 'border-emerald-500 bg-emerald-950/10 text-emerald-700'
                          : isApplicable
                            ? 'border-neutral-300/50 bg-background hover:border-red-500/30 text-foreground cursor-pointer'
                            : 'border-neutral-900 bg-background/40 text-foreground cursor-not-allowed'
                          }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold text-xs flex items-center gap-1">
                            <Tag className="h-3 w-3" /> {coupon.code}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase bg-red-600/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">
                            {coupon.type === 'percentage'
                              ? `${coupon.value}% OFF`
                              : `₹${coupon.value} OFF`}
                          </span>
                        </div>
                        <p className="text-[9px] text-foreground leading-tight">
                          Min order: ₹{coupon.minOrder} • Limit: {coupon.usageLimit}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-neutral-900 pb-3">
              Checkout Summary
            </h3>

            {/* List of items */}
            <div className="max-h-56 overflow-y-auto space-y-2 border-b border-neutral-900 pb-3 pr-1 scrollbar-none">
              {items.map((item, idx) => (
                <div
                  key={`${item.product.id}-${idx}`}
                  className="flex justify-between text-xs font-medium text-foreground font-sans"
                >
                  <span className="truncate max-w-xs">
                    {item.product.name} x {item.quantity}
                  </span>
                  <span className="shrink-0 font-bold">
                    ₹{getItemUnitPrice(item.product, item.customization) * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculation breakdown */}
            <div className="space-y-2 text-xs font-semibold text-foreground font-sans">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {couponDiscount > 0 && (
                <>
                  <div className="flex justify-between text-primary">
                    <span>Coupon Discount ({couponCode})</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-500">
                    <span>Amount Saved</span>
                    <span>₹{couponDiscount}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (GST 5%)</span>
                <span>₹{taxes}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="border-t border-neutral-900 pt-3 flex justify-between items-center text-sm font-extrabold text-foreground font-sans">
              <span>Grand Total</span>
              <span className="text-red-500 text-lg">₹{grandTotal}</span>
            </div>

            {/* Pay Now Button */}
            <Button
              onClick={handlePayNow}
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-foreground font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 transition-all cursor-pointer font-sans"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                `CONFIRM & PAY ₹${grandTotal}`
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Payment Gateway Sandbox Modal */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-white border border-border text-foreground max-w-md rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="border-b border-border pb-4 text-center">
            <DialogTitle className="text-lg font-bold flex items-center justify-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-primary" /> Demo Payment Gateway
            </DialogTitle>
            <p className="text-xs text-foreground mt-1">
              Select an outcome below to simulate the billing transaction process.
            </p>
          </DialogHeader>

          {/* Dialog info details */}
          <div className="py-4 space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-secondary border border-border inline-block w-full">
              <span className="text-xs text-foreground font-bold block">
                Grand Total to Charge
              </span>
              <p className="text-2xl font-extrabold text-primary">₹{grandTotal}</p>
              <span className="text-[10px] font-bold text-foreground mt-1 block uppercase">
                Method: {paymentMethod}
              </span>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              {paymentMethod !== 'cod' ? (
                <>
                  {/* Successful transaction option */}
                  <Button
                    onClick={() => handleProcessPayment('successful')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow shadow-emerald-950/10"
                  >
                    <Check className="h-4.5 w-4.5" /> Simulation: Payment Successful
                  </Button>

                  {/* Failed transaction option */}
                  <Button
                    onClick={() => handleProcessPayment('failed')}
                    className="w-full bg-red-600 hover:bg-red-700 text-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow shadow-red-950/10"
                  >
                    <X className="h-4.5 w-4.5" /> Simulation: Payment Failed
                  </Button>
                </>
              ) : (
                /* Cash on delivery order confirmation */
                <Button
                  onClick={() => handleProcessPayment('pending')}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow shadow-red-950/10"
                >
                  <Check className="h-4.5 w-4.5" /> Confirm COD (Pending Payment)
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
}
