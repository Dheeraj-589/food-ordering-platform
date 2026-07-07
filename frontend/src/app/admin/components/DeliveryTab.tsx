'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Navigation,
  NavigationOff,
  Phone,
  User,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Map,
} from 'lucide-react';
import api from '@/lib/api';
import { Order } from '@/types';
import { useToastStore } from '@/store/toastStore';

export default function DeliveryTab() {
  const { addToast } = useToastStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState<Order | null>(null);

  const fetchDeliveryOrders = async () => {
    try {
      const response = await api.get('/orders');
      const allOrders: Order[] = response.data;
      // Filter orders out for delivery
      const outForDelivery = allOrders.filter((o) => o.status === 'out-for-delivery');
      setOrders(outForDelivery);
      if (outForDelivery.length > 0 && !activeDelivery) {
        setActiveDelivery(outForDelivery[0]);
      } else if (outForDelivery.length === 0) {
        setActiveDelivery(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryOrders();
    const interval = setInterval(fetchDeliveryOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (
    orderId: number,
    status: 'delivered' | 'cancelled',
    action: string,
  ) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      addToast(`Delivery #${orderId} marked as ${action}!`, 'success');
      fetchDeliveryOrders();
    } catch (err) {
      console.error(err);
      addToast('Status update failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
          <Truck className="h-5 w-5 text-red-500" /> Delivery Dispatch Hub
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Route path tracking, recipient delivery details, simulated street maps, and dispatcher
          resolutions.
        </p>
      </div>

      {loading && orders.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
          <div className="lg:col-span-1 rounded-3xl bg-neutral-900 border border-neutral-850 animate-pulse" />
          <div className="lg:col-span-2 rounded-3xl bg-neutral-900 border border-neutral-850 animate-pulse" />
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-neutral-800 rounded-3xl flex flex-col items-center justify-center gap-3 text-neutral-500 select-none">
          <NavigationOff className="h-8 w-8 text-neutral-600" />
          <span className="text-xs font-bold uppercase tracking-wider">No active dispatches</span>
          <span className="text-[10px] text-neutral-600">
            All riders are currently idle or docked.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Deliveries List */}
          <div className="lg:col-span-1 space-y-3 max-h-[500px] overflow-y-auto pr-1">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-extrabold block">
              Assigned Deliveries ({orders.length})
            </span>
            {orders.map((order) => {
              const isSelected = activeDelivery?.id === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => setActiveDelivery(order)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 border-red-500/35 shadow'
                      : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-white">#{order.id}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 text-[8px] font-extrabold uppercase">
                      Out For Delivery
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs font-bold text-neutral-300 block">
                      {order.user?.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 block truncate mt-0.5">
                      {order.deliveryAddress}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Tracker Panel */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {activeDelivery && (
                <motion.div
                  key={activeDelivery.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-6 flex flex-col justify-between"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer summary */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-extrabold block">
                          Recipient Customer
                        </span>
                        <span className="text-sm font-extrabold text-neutral-200 block mt-1">
                          {activeDelivery.user?.name}
                        </span>
                        <span className="text-xs text-neutral-400 block mt-0.5 font-sans">
                          {activeDelivery.deliveryAddress}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                          <Phone className="h-4 w-4 text-neutral-500" />
                          <span>{activeDelivery.user?.phoneNumber || '+91 99999 88888'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                          <User className="h-4 w-4 text-neutral-500" />
                          <span>Rider Assigned: Rahul Sharma</span>
                        </div>
                      </div>

                      {/* Timeline status update actions */}
                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() =>
                            handleUpdateStatus(activeDelivery.id, 'delivered', 'Delivered')
                          }
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Delivered
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(activeDelivery.id, 'cancelled', 'Delivery Failed')
                          }
                          className="px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/25 font-extrabold text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> Report Failure
                        </button>
                      </div>
                    </div>

                    {/* Premium simulated SVG Map */}
                    <div className="relative border border-neutral-800 rounded-2xl h-48 bg-neutral-950 overflow-hidden select-none flex items-center justify-center">
                      <svg
                        className="absolute inset-0 h-full w-full opacity-20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Street Grids */}
                        <line x1="0" y1="30" x2="350" y2="30" stroke="#fff" strokeWidth="2" />
                        <line x1="0" y1="90" x2="350" y2="90" stroke="#fff" strokeWidth="2" />
                        <line x1="0" y1="150" x2="350" y2="150" stroke="#fff" strokeWidth="2" />
                        <line x1="50" y1="0" x2="50" y2="200" stroke="#fff" strokeWidth="2" />
                        <line x1="160" y1="0" x2="160" y2="200" stroke="#fff" strokeWidth="2" />
                        <line x1="280" y1="0" x2="280" y2="200" stroke="#fff" strokeWidth="2" />

                        {/* Curved route */}
                        <path
                          d="M 50 150 Q 160 90 280 30"
                          fill="none"
                          stroke="#E31837"
                          strokeWidth="3"
                          strokeDasharray="5"
                        />
                      </svg>

                      {/* Store Pin */}
                      <div className="absolute left-[38px] top-[138px] flex flex-col items-center">
                        <MapPin className="h-5 w-5 text-neutral-400 fill-neutral-900 shrink-0" />
                        <span className="text-[7px] font-black uppercase text-neutral-500 bg-neutral-900 border border-neutral-800 px-1 rounded block mt-0.5">
                          Store
                        </span>
                      </div>

                      {/* Customer Pin */}
                      <div className="absolute left-[268px] top-[18px] flex flex-col items-center">
                        <MapPin className="h-5 w-5 text-red-500 fill-neutral-900 shrink-0 animate-bounce" />
                        <span className="text-[7px] font-black uppercase text-red-500 bg-neutral-900 border border-neutral-800 px-1 rounded block mt-0.5">
                          Customer
                        </span>
                      </div>

                      {/* Delivery Rider navigation node */}
                      <motion.div
                        animate={{
                          x: [0, 220],
                          y: [0, -120],
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="absolute left-[46px] top-[146px] p-1 bg-red-600 rounded-full border border-white shrink-0 z-10"
                      >
                        <Navigation className="h-3 w-3 text-white rotate-45" />
                      </motion.div>

                      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900/80 border border-neutral-800 text-[8px] font-bold text-neutral-400">
                        <Map className="h-2.5 w-2.5" /> Map Tracker Simulation
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
