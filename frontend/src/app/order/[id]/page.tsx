'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  MapPin,
  CreditCard,
  Clock,
  Check,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ShoppingBag,
  X,
  Printer,
  Bike,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '@/types';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { orderSocketService, TimelineStage } from '@/lib/orderSocketService';

const getOrderItemPrice = (item: OrderItem): number => {
  return Number(item.price) * item.quantity;
};

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  // Simulated live status stage state
  const [currentStage, setCurrentStage] = useState<TimelineStage>('received');

  // Fetch order details from database
  const fetchOrder = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      addToast('Failed to load order details.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Handle tracking simulation subscription
  useEffect(() => {
    if (order) {
      if (order.status !== 'cancelled' && order.status !== 'delivered') {
        // Start simulation timer (progreses every 30s)
        orderSocketService.startTracking(order.id, order.status, order.createdAt);

        const unsubscribe = orderSocketService.subscribe(order.id, (stage) => {
          setCurrentStage(stage);
          // Refetch order details to align components if status changes to major phases
          if (stage === 'preparing' || stage === 'out_for_delivery' || stage === 'delivered') {
            fetchOrder();
          }
        });
        return () => unsubscribe();
      } else {
        setCurrentStage(order.status === 'cancelled' ? 'cancelled' : 'delivered');
      }
    }
  }, [order?.id, order?.status]);

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

  if (!order) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <div>
            <h3 className="text-base font-bold text-foreground">Order not found</h3>
            <p className="text-xs text-foreground mt-1">
              This order ID may not exist or belongs to another user.
            </p>
          </div>
          <Button
            onClick={() => router.push('/menu')}
            className="bg-card border border-neutral-800 text-foreground text-xs py-2 px-4 rounded-xl"
          >
            Return to Menu
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  const handleRetryPayment = async (status: 'paid' | 'failed') => {
    setPaymentDialogOpen(false);
    setPaying(true);
    try {
      await api.patch(`/orders/${orderId}/payment`, { paymentStatus: status });
      addToast(
        status === 'paid' ? 'Payment Completed! Order is now active. 🍕' : 'Payment Retry Failed.',
        status === 'paid' ? 'success' : 'error',
      );
      fetchOrder();
    } catch (err) {
      console.error(err);
      addToast('Failed to update payment status.', 'error');
    } finally {
      setPaying(false);
    }
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Popup blocked! Please allow popups to print.', 'error');
      return;
    }

    const itemsRows = order.items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #f1f1f1;">
        <td style="padding: 12px; font-size: 13px; color: #333;">${item.product.name}</td>
        <td style="padding: 12px; font-size: 13px; color: #666; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; font-size: 13px; color: #666; text-align: right;">₹${item.price}</td>
        <td style="padding: 12px; font-size: 13px; color: #333; font-weight: bold; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `,
      )
      .join('');

    const subtotal =
      order.subtotal !== undefined && order.subtotal !== null
        ? Number(order.subtotal)
        : Number(order.totalAmount);
    const discount =
      order.discountAmount !== undefined && order.discountAmount !== null
        ? Number(order.discountAmount)
        : 0;
    const delivery =
      order.deliveryCharge !== undefined && order.deliveryCharge !== null
        ? Number(order.deliveryCharge)
        : subtotal >= 499
          ? 0
          : 49;
    const tax =
      order.gstAmount !== undefined && order.gstAmount !== null
        ? Number(order.gstAmount)
        : Math.round((subtotal - discount) * 0.05);
    const grandTotal =
      order.subtotal !== undefined && order.subtotal !== null
        ? Number(order.totalAmount)
        : subtotal - discount + delivery + tax;

    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice #FEX-${order.id}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ff3e3e; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #ff3e3e; }
            .invoice-details { text-align: right; font-size: 13px; line-height: 1.6; }
            .meta-section { display: flex; justify-content: space-between; margin-top: 30px; margin-bottom: 40px; font-size: 14px; }
            .meta-card { width: 45%; }
            .meta-title { font-weight: bold; font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f9f9f9; padding: 12px; font-size: 12px; color: #666; font-weight: bold; text-align: left; text-transform: uppercase; }
            .totals { float: right; width: 300px; margin-top: 30px; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
            .grand-total { border-top: 2px solid #ff3e3e; padding-top: 10px; font-weight: bold; font-size: 16px; color: #ff3e3e; }
            .footer { margin-top: 80px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">🍕 FOODIES EXPRESS</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Premium Fast-Delivery Pizzeria</div>
            </div>
            <div class="invoice-details">
              <strong>Invoice #:</strong> FEX-${order.id}<br>
              <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
              <strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}<br>
            </div>
          </div>
          
          <div class="meta-section">
            <div class="meta-card">
              <div class="meta-title">Billed To</div>
              <strong>${order.user.name}</strong><br>
              ${order.user.email}<br>
              Phone: ${order.user.phoneNumber || 'N/A'}
            </div>
            <div class="meta-card">
              <div class="meta-title">Delivery Location</div>
              ${order.deliveryAddress}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Product Details</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 20%; text-align: right;">Unit Price</th>
                <th style="width: 20%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${subtotal}</span>
            </div>
            ${discount > 0
        ? `
            <div class="total-row" style="color: #dc2626;">
              <span>Coupon Discount (${order.couponCode || 'Promo'}):</span>
              <span>-₹${discount}</span>
            </div>
            <div class="total-row" style="color: #16a34a; font-weight: bold;">
              <span>Amount Saved:</span>
              <span>₹${discount}</span>
            </div>
            `
        : ''
      }
            <div class="total-row">
              <span>Delivery Fee:</span>
              <span>₹${delivery}</span>
            </div>
            <div class="total-row">
              <span>GST (5%):</span>
              <span>₹${tax}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>₹${grandTotal}</span>
            </div>
          </div>

          <div class="footer">
            Thank you for ordering with Foodies Express!<br>
            &copy; ${new Date().getFullYear()} Foodies Express. All rights reserved.
          </div>
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  // Status steps sequence
  const timelineStages: { id: TimelineStage; label: string; desc: string }[] = [
    { id: 'received', label: 'Order Received', desc: 'Kitchen confirmed your order request' },
    { id: 'preparing', label: 'Preparing', desc: 'Rolling fresh dough & spreading toppings' },
    { id: 'baking', label: 'Baking', desc: 'Baking at 450°C in our stone deck oven' },
    {
      id: 'quality_check',
      label: 'Quality Check',
      desc: 'Inspecting cheese melt and boxing it hot',
    },
    {
      id: 'out_for_delivery',
      label: 'Out for Delivery',
      desc: 'Our rider carries your box in hot bag',
    },
    { id: 'delivered', label: 'Delivered', desc: 'Hot pizzas delivered. Enjoy your meal!' },
  ];

  const currentStageIndex = timelineStages.findIndex((s) => s.id === currentStage);

  // Map progress bar percentage
  const totalStages = timelineStages.length;
  const progressPercent =
    currentStage === 'cancelled' ? 0 : Math.round(((currentStageIndex + 1) / totalStages) * 100);

  // Calculate simulated ETA countdown minutes remaining
  const orderCreatedAt = new Date(order.createdAt).getTime();
  const elapsedMinutes = Math.floor((Date.now() - orderCreatedAt) / 60000);
  const totalETAMinutes = 30; // 30-minute fast guarantee
  const minutesRemaining = Math.max(2, totalETAMinutes - elapsedMinutes);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      <Navbar />

      {/* Page Header */}
      <section className="py-12 bg-gradient-to-b from-red-600/5 via-transparent to-transparent border-b border-neutral-900">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.push('/dashboard?tab=orders')}
              className="flex items-center gap-1.5 text-[10px] font-bold text-foreground hover:text-primary transition-colors cursor-pointer mb-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> BACK TO DASHBOARD
            </button>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              Live Order Tracker: #FEX-{order.id}
            </h1>
            <p className="text-xs text-foreground font-semibold mt-1 uppercase tracking-wider">
              Real-time progression status using Sandbox Simulation Fallback
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePrintInvoice}
              className="bg-card hover:bg-neutral-800 border border-neutral-800 text-foreground text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Printer className="h-3.5 w-3.5" /> Print Invoice
            </Button>
            <Button
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              className="bg-card hover:bg-neutral-800 border border-neutral-800 text-foreground text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* Main Track Details */}
      <section className="max-w-5xl mx-auto px-4 py-8 w-full flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left section: status timeline and map */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Retry payment check */}
          {order.paymentStatus === 'failed' && (
            <div className="p-5 rounded-3xl bg-red-600/10 border border-red-500/20 text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-fade-in">
              <div className="flex gap-3">
                <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold">Transaction Failed</h4>
                  <p className="text-xs text-foreground mt-1 max-w-md leading-relaxed">
                    This order was saved, but payment failed. Simulating retry will update the
                    payment flag.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={paying}
                className="bg-red-600 hover:bg-red-700 text-foreground font-bold text-xs py-2 px-5 rounded-xl cursor-pointer"
              >
                RETRY PAYMENT
              </Button>
            </div>
          )}

          {/* Stepper tracking design */}
          <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
              <h3 className="text-sm font-bold text-foreground">Delivery Status Timeline</h3>
              {currentStage !== 'delivered' && currentStage !== 'cancelled' && (
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                  <Clock className="h-3 w-3" /> ETA: {minutesRemaining} Mins
                </span>
              )}
            </div>

            {currentStage === 'cancelled' ? (
              <div className="p-4 rounded-2xl bg-background border border-neutral-900 text-center text-xs font-bold text-red-500">
                This order has been CANCELLED.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Horizontal Progress bar */}
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold inline-block py-1 px-2.5 uppercase rounded-full bg-red-600/10 text-red-500">
                        Progress
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-red-500">{progressPercent}%</span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-background border border-neutral-900">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-foreground justify-center bg-gradient-to-r from-red-600 to-amber-500"
                    />
                  </div>
                </div>

                {/* Timeline vertical list */}
                <div className="relative pl-6 space-y-6 border-l border-neutral-900/80">
                  {timelineStages.map((step, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isActive = idx === currentStageIndex;
                    const isFuture = idx > currentStageIndex;

                    // Calculate simulated stage timestamp
                    const timestamp = new Date(orderCreatedAt + idx * 30000);

                    return (
                      <div key={step.id} className="relative">
                        {/* Bullet indicators */}
                        <span
                          className={`absolute left-[-31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border transition-all ${isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-foreground shadow shadow-emerald-950/20'
                            : isActive
                              ? 'bg-red-600 border-red-600 text-foreground animate-pulse'
                              : 'bg-background border-neutral-900 text-foreground'
                            }`}
                        >
                          {isCompleted ? (
                            <Check className="h-3 w-3 stroke-[3px]" />
                          ) : isActive ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-white block" />
                          ) : null}
                        </span>

                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4
                              className={`text-xs font-extrabold flex items-center gap-2 ${isCompleted
                                ? 'text-foreground'
                                : isActive
                                  ? 'text-red-500'
                                  : 'text-foreground'
                                }`}
                            >
                              {step.label}
                              {isActive && (
                                <span className="px-2 py-0.5 rounded-md bg-red-600/10 border border-red-500/20 text-red-500 text-[8px] uppercase font-black animate-pulse">
                                  Active Stage
                                </span>
                              )}
                            </h4>
                            <p
                              className={`text-[10px] leading-relaxed ${isFuture ? 'text-neutral-700' : 'text-foreground'
                                }`}
                            >
                              {step.desc}
                            </p>
                          </div>

                          {!isFuture && (
                            <span className="text-[9px] font-bold text-foreground">
                              {timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Premium Vector Delivery Map Placeholder */}
          {currentStage !== 'cancelled' && (
            <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-foreground">Live Delivery Route Map</h3>

              <div className="relative h-64 w-full bg-background border border-neutral-900 rounded-2xl overflow-hidden flex items-center justify-center select-none">
                {/* SVG Route map path */}
                <svg
                  className="absolute inset-0 h-full w-full pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines to represent streets */}
                  <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#161616" strokeWidth="1" />
                  <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#161616" strokeWidth="1" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#161616" strokeWidth="1" />
                  <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#161616" strokeWidth="1" />
                  <line x1="90%" y1="0" x2="90%" y2="100%" stroke="#161616" strokeWidth="1" />

                  <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#161616" strokeWidth="1" />
                  <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#161616" strokeWidth="1" />
                  <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#161616" strokeWidth="1" />
                  <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#161616" strokeWidth="1" />

                  {/* Dotted delivery route curve */}
                  <path
                    d="M 60,80 Q 200,50 320,180 T 580,120"
                    fill="none"
                    stroke="#222"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    id="deliveryPath"
                    d="M 60,80 Q 200,50 320,180 T 580,120"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="3.5"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Restaurant Pin Marker */}
                <div className="absolute left-[45px] bottom-[55px] flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-red-600 border border-red-500 flex items-center justify-center shadow-lg shadow-red-950/20">
                    <span className="text-[10px]">🍕</span>
                  </div>
                  <span className="text-[8px] font-bold text-foreground mt-1 uppercase tracking-wider">
                    Kitchen
                  </span>
                </div>

                {/* Delivery Bike (moving relative to the index) */}
                {currentStageIndex >= 1 && currentStageIndex <= 4 && (
                  <motion.div
                    className="absolute flex items-center justify-center p-2 bg-card border border-neutral-800 rounded-full shadow-xl z-10"
                    // Animate the offset of the bike along the path
                    animate={{
                      left:
                        currentStageIndex === 1
                          ? '160px'
                          : currentStageIndex === 2
                            ? '280px'
                            : currentStageIndex === 3
                              ? '400px'
                              : '520px',
                      top:
                        currentStageIndex === 1
                          ? '50px'
                          : currentStageIndex === 2
                            ? '120px'
                            : currentStageIndex === 3
                              ? '160px'
                              : '110px',
                    }}
                    transition={{ type: 'spring', stiffness: 35, damping: 10 }}
                  >
                    <Bike className="h-4.5 w-4.5 text-amber-500 animate-bounce" />
                  </motion.div>
                )}

                {/* Destination Home Pin Marker */}
                <div className="absolute right-[45px] top-[95px] flex flex-col items-center">
                  <div className="h-7 w-7 rounded-full bg-emerald-600 border border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-950/20 animate-bounce">
                    <MapPin className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="text-[8px] font-bold text-emerald-500 mt-1 uppercase tracking-wider">
                    Home
                  </span>
                </div>

                {/* Current overlay status indicator */}
                <div className="absolute bottom-4 left-4 right-4 py-2 px-4 bg-card/90 border border-neutral-800/80 backdrop-blur-md rounded-xl flex items-center gap-3">
                  <Bike className="h-4.5 w-4.5 text-red-500" />
                  <div>
                    <p className="text-[10px] text-foreground font-bold uppercase">
                      Current Delivery Stage
                    </p>
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {currentStage === 'delivered'
                        ? 'Rider completed delivery at destination'
                        : currentStage === 'out_for_delivery'
                          ? 'Rider is carrying box to your door'
                          : 'Hot food preparation in kitchen'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Purchased Order items list and Calculations */}
        <div className="w-full lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-neutral-900 pb-3">
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start py-2 border-b border-neutral-950 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-foreground">{item.product.name}</h4>
                    <span className="text-[10px] text-foreground">Qty: {item.quantity}</span>
                    {item.specialInstructions && item.specialInstructions.startsWith('{')
                      ? (() => {
                        try {
                          const options = JSON.parse(item.specialInstructions);
                          return (
                            <p className="text-[9px] text-foreground font-semibold mt-0.5">
                              {options.size && `Size: ${options.size}`}
                              {options.crust && ` | Crust: ${options.crust}`}
                              {options.variant && ` | Variant: ${options.variant}`}
                              {options.extraCheese && ` | Extra Cheese`}
                              {options.extraToppings &&
                                options.extraToppings.length > 0 &&
                                ` | Toppings: ${options.extraToppings.join(', ')}`}
                            </p>
                          );
                        } catch (e) {
                          return null;
                        }
                      })()
                      : item.specialInstructions && (
                        <p className="text-[9px] text-foreground font-semibold mt-0.5">
                          {item.specialInstructions}
                        </p>
                      )}
                  </div>
                  <span className="font-extrabold text-foreground shrink-0">
                    ₹{getOrderItemPrice(item)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Calculations */}
          <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4 text-xs font-semibold text-foreground">
            <h3 className="text-sm font-bold text-foreground border-b border-neutral-900 pb-3">
              Summary
            </h3>

            <div className="space-y-2 border-b border-neutral-900 pb-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{Number(order.totalAmount) >= 499 ? 'FREE' : '₹49'}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (GST 5%)</span>
                <span>₹{Math.round(Number(order.totalAmount) * 0.05)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-extrabold text-foreground pt-1">
              <span>Grand Total</span>
              <span className="text-red-500 text-base">
                ₹
                {Number(order.totalAmount) +
                  (Number(order.totalAmount) >= 499 ? 0 : 49) +
                  Math.round(Number(order.totalAmount) * 0.05)}
              </span>
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4 text-xs">
            <h3 className="text-sm font-bold text-foreground border-b border-neutral-900 pb-3 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-red-500" /> Shipping Destination
            </h3>
            <p className="text-foreground leading-relaxed font-semibold">
              {order.deliveryAddress}
            </p>

            <div className="pt-3 border-t border-neutral-900 flex justify-between items-center">
              <span className="text-foreground font-bold uppercase">Payment Status</span>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${order.paymentStatus === 'paid'
                  ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20'
                  : order.paymentStatus === 'failed'
                    ? 'bg-red-600/10 text-red-500 border border-red-500/20'
                    : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Retry Transaction Modal */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-white border border-border text-foreground max-w-md rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="border-b border-border pb-4 text-center">
            <DialogTitle className="text-lg font-bold flex items-center justify-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" /> Retry Transaction
            </DialogTitle>
            <p className="text-xs text-foreground mt-1">
              Select simulation response outcome for retrying this order transaction.
            </p>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex flex-col gap-2.5">
              <Button
                onClick={() => handleRetryPayment('paid')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="h-4.5 w-4.5" /> Simulation: Success (PAID)
              </Button>
              <Button
                onClick={() => handleRetryPayment('failed')}
                className="w-full bg-red-600 hover:bg-red-700 text-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" /> Simulation: Failed (FAILED)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
}
