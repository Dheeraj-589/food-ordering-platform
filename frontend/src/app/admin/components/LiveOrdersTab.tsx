'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Play,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Volume2,
  VolumeX,
  ShieldAlert,
} from 'lucide-react';
import api from '@/lib/api';
import { Order } from '@/types';
import { useToastStore } from '@/store/toastStore';

interface LiveOrdersTabProps {
  searchTerm: string;
}

export default function LiveOrdersTab({ searchTerm }: LiveOrdersTabProps) {
  const { addToast } = useToastStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevPendingCount = useRef(0);

  // Play incoming order sound alert
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);

      // Secondary pleasant chime tone
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1109.73, audioCtx.currentTime); // C#6 note
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.2);
      }, 100);
    } catch (e) {
      console.warn('AudioContext sound blocked or unsupported by browser policy:', e);
    }
  };

  const fetchLiveOrders = async () => {
    try {
      const response = await api.get('/orders');
      const allOrders: Order[] = response.data;

      // Filter orders that are not fully completed (delivered/cancelled)
      const activeOrders = allOrders.filter(
        (o) => o.status !== 'delivered' && o.status !== 'cancelled',
      );

      // Check if new pending orders arrived
      const currentPending = activeOrders.filter((o) => o.status === 'pending').length;
      if (currentPending > prevPendingCount.current) {
        addToast(`New order placed! Sound alert triggered.`, 'success');
        playAlertSound();
      }
      prevPendingCount.current = currentPending;
      setOrders(activeOrders);
    } catch (err) {
      console.error('Failed to poll active orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll live orders every 5 seconds
  useEffect(() => {
    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 5000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const updateOrderStatus = async (orderId: number, nextStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      addToast(`Order #${orderId} status updated to ${nextStatus}!`, 'success');
      fetchLiveOrders();
    } catch (err) {
      console.error(err);
      addToast('Could not change order status.', 'error');
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toString().includes(searchTerm) ||
      o.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user?.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Kanban status columns list
  const columns = [
    {
      id: 'pending',
      label: 'Incoming',
      color: 'bg-blue-600/10 border-blue-500/20 text-blue-400',
      next: 'preparing',
    },
    {
      id: 'preparing',
      label: 'Preparing',
      color: 'bg-amber-600/10 border-amber-500/20 text-amber-400',
      next: 'out-for-delivery',
    },
    {
      id: 'out-for-delivery',
      label: 'Out For Delivery',
      color: 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400',
      next: 'delivered',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Live Dispatch Board
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          </h2>
          <p className="text-xs text-foreground mt-1">
            Realtime kanban, sounds notification, and status transition pipeline (polls every 5s).
          </p>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${soundEnabled
            ? 'bg-card border-red-500/20 text-red-500 hover:bg-neutral-850'
            : 'bg-card border-neutral-800 text-foreground hover:text-primary'
            }`}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <span>{soundEnabled ? 'Beep Audio Enabled' : 'Beep Audio Muted'}</span>
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[400px]">
          {columns.map((col, idx) => (
            <div
              key={idx}
              className="p-4 rounded-3xl bg-card/40 border border-neutral-300/50 animate-pulse space-y-4"
            >
              <div className="h-4 bg-neutral-850 rounded w-1/3" />
              <div className="h-32 bg-neutral-850 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((col) => {
            const laneOrders = filteredOrders.filter((o) => o.status === col.id);
            return (
              <div
                key={col.id}
                className="flex flex-col bg-card/40 border border-neutral-300/50 rounded-3xl p-4 min-h-[450px]"
              >
                {/* Column Header */}
                <div
                  className={`p-3 rounded-2xl border ${col.color} flex justify-between items-center mb-4 shrink-0`}
                >
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    {col.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-background/80 text-[10px] font-black border border-neutral-300/50">
                    {laneOrders.length}
                  </span>
                </div>

                {/* Column Items */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[550px] scrollbar-thin">
                  <AnimatePresence initial={false}>
                    {laneOrders.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-foreground space-y-2 border border-dashed border-neutral-300/50 rounded-2xl">
                        <Clock className="h-6 w-6 text-neutral-700" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          No active dispatches
                        </span>
                      </div>
                    ) : (
                      laneOrders.map((order) => (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="p-4 bg-background border border-neutral-300/50/80 rounded-2xl flex flex-col justify-between gap-3 shadow hover:border-neutral-750 transition-colors"
                        >
                          {/* Order Card Info */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-foreground">#{order.id}</span>
                              <span className="text-[9px] font-bold text-foreground">
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-foreground block">
                              {order.user?.name}
                            </span>
                            <span className="text-[9px] font-semibold text-foreground block truncate">
                              {order.deliveryAddress}
                            </span>
                          </div>

                          {/* Items summary */}
                          <div className="border-t border-b border-neutral-900 py-1.5 space-y-1">
                            {order.items?.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-[10px] font-semibold text-foreground"
                              >
                                <span className="truncate max-w-[150px]">{item.product?.name}</span>
                                <span className="shrink-0 text-foreground">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          {/* Action progress triggers */}
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-extrabold text-red-500">
                              ₹{order.totalAmount}
                            </span>

                            <button
                              onClick={() => updateOrderStatus(order.id, col.next)}
                              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-foreground font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all hover:scale-[1.02]"
                            >
                              <span>
                                {col.id === 'pending'
                                  ? 'Accept'
                                  : col.id === 'preparing'
                                    ? 'Dispatch'
                                    : 'Deliver'}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
