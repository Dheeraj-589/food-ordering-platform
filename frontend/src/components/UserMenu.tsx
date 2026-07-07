'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import api from '@/lib/api';
import { Order } from '@/types';
import {
  User as UserIcon,
  ShoppingBag,
  MapPin,
  LogOut,
  ChevronDown,
  X,
  ShieldCheck,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  Truck,
  Loader2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'profile' | 'orders' | 'addresses' | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out successfully.', 'success');
      router.push('/login');
    } catch {
      addToast('Failed to log out cleanly.', 'error');
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      addToast('Could not fetch order history.', 'error');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const openOrdersModal = () => {
    setActiveModal('orders');
    setIsOpen(false);
    fetchOrders();
  };

  if (!user) return null;

  // Shorten name to first name
  const firstName = user.name.split(' ')[0];

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80 transition-all duration-200 cursor-pointer select-none"
      >
        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold font-sans uppercase">
          {user.name.substring(0, 2)}
        </div>
        <span className="hidden sm:inline text-sm font-semibold text-neutral-200">{firstName}</span>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-56 rounded-2xl bg-neutral-950/90 backdrop-blur-xl border border-neutral-800/60 p-2 shadow-2xl z-[100]"
          >
            {/* User Info Header */}
            <div className="px-3 py-2.5 border-b border-neutral-900">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Account
              </p>
              <p className="text-sm font-bold text-neutral-100 mt-0.5 truncate">{user.name}</p>
              <p className="text-xs text-neutral-400 truncate">{user.email}</p>
            </div>

            {/* Menu Items */}
            <div className="mt-1 space-y-0.5">
              {(user.role === 'admin' || user.role === 'manager') && (
                <button
                  onClick={() => {
                    router.push('/admin');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:text-red-400 hover:bg-red-950/10 border border-red-500/10 transition-colors text-left cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 text-red-500" />
                  <span>{user.role === 'manager' ? 'Manager Dashboard' : 'Admin Dashboard'}</span>
                </button>
              )}
              <button
                onClick={() => {
                  router.push('/dashboard?tab=profile');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900/60 transition-colors text-left cursor-pointer"
              >
                <UserIcon className="h-4 w-4 text-neutral-400" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  router.push('/dashboard?tab=orders');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900/60 transition-colors text-left cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4 text-neutral-400" />
                <span>Order History</span>
              </button>
              <button
                onClick={() => {
                  router.push('/dashboard?tab=addresses');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900/60 transition-colors text-left cursor-pointer"
              >
                <MapPin className="h-4 w-4 text-neutral-400" />
                <span>Saved Addresses</span>
              </button>
            </div>

            {/* Logout Action */}
            <div className="mt-1 pt-1 border-t border-neutral-900">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <Dialog
        open={activeModal === 'profile'}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="bg-neutral-950 border-neutral-900 text-neutral-100 max-w-md rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-red-500" /> Profile Overview
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-4 pb-4 border-b border-neutral-900">
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-2xl font-extrabold">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold">{user.name}</h3>
                <p className="text-xs font-semibold text-neutral-400 tracking-widest uppercase flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  {user.role} Account
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-neutral-900/40 border border-neutral-900/60 p-3 rounded-2xl flex items-start gap-3">
                <Mail className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-sm font-medium text-neutral-200 mt-0.5">{user.email}</p>
                </div>
              </div>
              <div className="bg-neutral-900/40 border border-neutral-900/60 p-3 rounded-2xl flex items-start gap-3">
                <Phone className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                    Phone
                  </p>
                  <p className="text-sm font-medium text-neutral-200 mt-0.5">
                    {user.phoneNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="bg-neutral-900/40 border border-neutral-900/60 p-3 rounded-2xl flex items-start gap-3">
                <Calendar className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                    Member Since
                  </p>
                  <p className="text-sm font-medium text-neutral-200 mt-0.5">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Orders Modal */}
      <Dialog
        open={activeModal === 'orders'}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="bg-neutral-950 border-neutral-900 text-neutral-100 max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-red-500" /> Order History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {isLoadingOrders ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                <span className="text-sm text-neutral-400 font-medium">Retrieving orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-neutral-900/20 border border-dashed border-neutral-900 rounded-3xl">
                <ShoppingBag className="h-10 w-10 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-neutral-300">No orders placed yet</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Place your first pizza order to see it here!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-900 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
                      <div>
                        <p className="text-xs text-neutral-500 font-semibold">ORDER ID</p>
                        <p className="text-sm font-bold text-neutral-200">#FEX-{order.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500 font-semibold">PLACED ON</p>
                        <p className="text-xs font-semibold text-neutral-300">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-neutral-400">
                            {item.quantity}x {item.product.name}
                          </span>
                          <span className="font-semibold text-neutral-300">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-neutral-900 mt-1">
                      <div className="flex items-center gap-1.5">
                        {order.status === 'delivered' ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-950/30 px-2.5 py-1 rounded-full">
                            <CheckCircle className="h-3 w-3" /> Delivered
                          </span>
                        ) : order.status === 'cancelled' ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-950/30 px-2.5 py-1 rounded-full">
                            <X className="h-3 w-3" /> Cancelled
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-950/30 px-2.5 py-1 rounded-full">
                            <Truck className="h-3 w-3 animate-pulse" />{' '}
                            {order.status.replace('-', ' ')}
                          </span>
                        )}
                        <span className="text-xs font-bold text-neutral-500 bg-neutral-900 px-2.5 py-1 rounded-full capitalize">
                          {order.paymentStatus}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-neutral-500 font-semibold block">
                          TOTAL AMOUNT
                        </span>
                        <span className="text-base font-bold text-red-500">
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Addresses Modal */}
      <Dialog
        open={activeModal === 'addresses'}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="bg-neutral-950 border-neutral-900 text-neutral-100 max-w-md rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" /> Saved Addresses
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Dynamic Saved Addresses */}
            <div className="space-y-3">
              {(() => {
                try {
                  const savedAddresses = user.addresses ? JSON.parse(user.addresses) : [];
                  if (!Array.isArray(savedAddresses) || savedAddresses.length === 0) {
                    return (
                      <p className="text-xs text-neutral-500 text-center py-4 font-medium">
                        No saved addresses yet. You can add them in your Customer Dashboard.
                      </p>
                    );
                  }
                  return savedAddresses.map((addr: any) => (
                    <div
                      key={addr.id}
                      className="p-3.5 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex justify-between items-start"
                    >
                      <div>
                        <span className="text-xs font-bold text-red-500 bg-red-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {addr.type || 'Address'}
                        </span>
                        <p className="text-sm font-semibold text-neutral-200 mt-2">
                          {addr.doorNo ? `${addr.doorNo}, ` : ''}
                          {addr.street || ''}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {addr.city || ''}, {addr.state || ''} - {addr.zipCode || ''}
                        </p>
                      </div>
                      {addr.isDefault && <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5" />}
                    </div>
                  ));
                } catch (e) {
                  return (
                    <p className="text-xs text-neutral-500 text-center py-4 font-medium">
                      Failed to parse saved addresses.
                    </p>
                  );
                }
              })()}
            </div>

            <button
              onClick={() => {
                setActiveModal(null);
                router.push('/dashboard?tab=addresses');
              }}
              className="w-full py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 text-xs font-bold tracking-wider text-neutral-300 hover:text-white transition-all cursor-pointer text-center"
            >
              MANAGE ADDRESSES
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
