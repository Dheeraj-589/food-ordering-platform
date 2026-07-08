'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Play, Check, Clock, AlertTriangle, Coffee, Timer } from 'lucide-react';
import api from '@/lib/api';
import { Order } from '@/types';
import { useToastStore } from '@/store/toastStore';

export default function KitchenTab() {
  const { addToast } = useToastStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Checkbox state for ingredients
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const fetchKitchenOrders = async () => {
    try {
      const response = await api.get('/orders');
      const allOrders: Order[] = response.data;
      // Filter orders relevant to kitchen: pending, preparing (baking/ready)
      const kitchenRelevant = allOrders.filter(
        (o) => o.status === 'pending' || o.status === 'preparing',
      );
      setOrders(kitchenRelevant);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 5000);
    const timeTicking = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timeTicking);
    };
  }, []);

  const handleUpdateStatus = async (orderId: number, status: string, nextAction: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      addToast(`Chef has ${nextAction} Order #${orderId}!`, 'success');
      fetchKitchenOrders();
    } catch (err) {
      console.error(err);
      addToast('Could not update kitchen order.', 'error');
    }
  };

  const handleToggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-red-500" /> Kitchen Console
        </h2>
        <p className="text-xs text-foreground mt-1">
          Baking queues, recipe ingredient checklists, priority alerts, and live cook time trackers.
        </p>
      </div>

      {loading && orders.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-card border border-neutral-300/50 animate-pulse h-64"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-neutral-800 rounded-3xl flex flex-col items-center justify-center gap-3 text-foreground select-none">
          <Coffee className="h-8 w-8 text-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider">Kitchen Queue Empty</span>
          <span className="text-[10px] text-foreground">
            All orders are fully baked and prepared!
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence initial={false}>
            {orders.map((order) => {
              // Calculate elapsed time
              const elapsedMs = now - new Date(order.createdAt).getTime();
              const elapsedSec = Math.floor(elapsedMs / 1000);
              const elapsedMin = Math.floor(elapsedSec / 60);

              // Priority: High if order exceeds 10 minutes, or total items > 4
              const totalItemsCount =
                order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              const isHighPriority = elapsedMin >= 8 || totalItemsCount >= 4;

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 ${isHighPriority
                    ? 'bg-gradient-to-br from-red-950/20 via-neutral-900 to-neutral-900 border-red-500/35 shadow-lg shadow-red-950/5'
                    : 'bg-card/60 border-neutral-300/50'
                    }`}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground">Order #{order.id}</span>
                        {isHighPriority && (
                          <span className="px-2 py-0.5 rounded bg-red-600/10 text-red-500 border border-red-500/20 text-[8px] font-extrabold uppercase flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" /> High Priority
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-foreground block">
                        Received:{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center gap-1 text-[11px] font-bold text-foreground bg-background/60 border border-neutral-300/50 px-2 py-1 rounded-lg">
                      <Timer className="h-3.5 w-3.5 text-foreground animate-spin-slow" />
                      <span>
                        {elapsedMin}m {elapsedSec % 60}s
                      </span>
                    </div>
                  </div>

                  {/* Items List & Recipe Verification Checkbox */}
                  <div className="space-y-2 border-t border-neutral-950 pt-3">
                    <span className="text-[9px] uppercase tracking-widest text-foreground font-extrabold block">
                      Baking Checklist
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                      {order.items?.map((item, idx) => {
                        const checkKey = `${order.id}-${item.id}`;
                        const isChecked = checkedItems[checkKey] || false;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleCheck(checkKey)}
                            className={`flex items-start gap-3 p-2 rounded-xl border transition-all cursor-pointer select-none ${isChecked
                              ? 'bg-background/30 border-neutral-300/50 text-foreground line-through'
                              : 'bg-background/50 border-neutral-300/50 text-foreground'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="h-4 w-4 rounded border-neutral-800 text-red-600 focus:ring-red-900 bg-card shrink-0 mt-0.5 cursor-pointer"
                            />
                            <div className="flex-1 text-xs">
                              <span className="font-extrabold block">
                                {item.product?.name} ({item.quantity} Portion)
                              </span>
                              {item.specialInstructions && (
                                <span className="text-[10px] text-amber-500 font-bold block mt-0.5">
                                  ⚠️ Notes: {item.specialInstructions}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational actions */}
                  <div className="border-t border-neutral-950 pt-3 flex justify-between items-center gap-4">
                    <span className="text-[10px] font-extrabold text-foreground uppercase tracking-widest">
                      Status: <span className="text-foreground">{order.status}</span>
                    </span>

                    {order.status === 'pending' ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing', 'Started Baking')}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-foreground text-[10px] font-extrabold uppercase flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" /> Start Cooking
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleUpdateStatus(order.id, 'out-for-delivery', 'Marked Baked & Ready')
                        }
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-foreground text-[10px] font-extrabold uppercase flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                      >
                        <Check className="h-3.5 w-3.5" /> Bake Complete
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
