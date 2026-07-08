'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  ShoppingBag,
  MapPin,
  Heart,
  Bell,
  Ticket,
  DollarSign,
  Settings as SettingsIcon,
  Camera,
  Languages,
  Moon,
  Sun,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Award,
  Star,
  Eye,
  Check,
  Sparkles,
  Loader2,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
  X,
  CheckCircle2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import api from '@/lib/api';
import { Product, Order, TimelineStage } from '@/types';
import { getProductImage } from '@/lib/utils';
import ProductRecommendations from '@/components/ProductRecommendations';
import LoyaltyDashboard from '@/components/LoyaltyDashboard';

type TabType =
  | 'profile'
  | 'orders'
  | 'addresses'
  | 'wishlist'
  | 'notifications'
  | 'coupons'
  | 'payment-history'
  | 'settings';

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'order' | 'offer' | 'coupon' | 'promotion';
  read: boolean;
  createdAt: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setAuth } = useAuthStore();
  const { addItem } = useCartStore();
  const addToast = useToastStore((state) => state.addToast);

  // Active tab selection
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Profile data states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // User addresses states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addrName, setAddrName] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrDefault, setAddrDefault] = useState(false);

  // User notifications states
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Wishlist products state
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Orders list state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState<
    'all' | 'pending' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled'
  >('all');

  // Coupons state
  const [coupons, setCoupons] = useState<
    { code: string; discount: number; minAmount: number; desc: string }[]
  >([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with store on mount/user change
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhoneNumber(user.phoneNumber || '');

      // Parse extended fields
      setLanguage(user.language || 'en');
      setDarkMode(user.darkMode !== false);
      setAddresses(user.addresses ? JSON.parse(user.addresses) : []);
      setWishlistIds(user.wishlist ? JSON.parse(user.wishlist) : []);
      setNotifications(user.notifications ? JSON.parse(user.notifications) : []);
    }
  }, [user]);

  // Read URL query tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam &&
      [
        'profile',
        'orders',
        'addresses',
        'wishlist',
        'notifications',
        'coupons',
        'payment-history',
        'settings',
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  // Fetch orders
  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'payment-history') {
      const fetchOrdersList = async () => {
        setLoadingOrders(true);
        try {
          const res = await api.get('/orders');
          setOrders(res.data);
        } catch (err) {
          console.error(err);
          addToast('Could not load orders.', 'error');
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrdersList();
    }
  }, [activeTab, addToast]);

  // Fetch wishlist products
  useEffect(() => {
    if (activeTab === 'wishlist' && wishlistIds.length > 0) {
      const fetchWishlist = async () => {
        setLoadingWishlist(true);
        try {
          const productsRes = await api.get('/products');
          const filtered = productsRes.data.filter((p: Product) => wishlistIds.includes(p.id));
          setWishlistProducts(filtered);
        } catch (err) {
          console.error(err);
          addToast('Failed to load wishlist details.', 'error');
        } finally {
          setLoadingWishlist(false);
        }
      };
      fetchWishlist();
    } else if (activeTab === 'wishlist') {
      setWishlistProducts([]);
    }
  }, [activeTab, wishlistIds, addToast]);

  // Fetch dynamic coupons
  useEffect(() => {
    if (activeTab === 'coupons') {
      const fetchCouponsList = async () => {
        setLoadingCoupons(true);
        try {
          const res = await api.get('/products/coupons');
          const list = res.data.map(
            (c: { code: string; value: number; minOrder: number; type: string }) => ({
              code: c.code,
              discount: Number(c.value),
              minAmount: Number(c.minOrder),
              desc:
                c.type === 'percentage'
                  ? `${c.value}% Off on orders above ₹${c.minOrder}`
                  : `Flat ₹${c.value} Off on orders above ₹${c.minOrder}`,
            }),
          );
          setCoupons(list);
        } catch (err) {
          console.error(err);
          addToast('Could not load coupons.', 'error');
        } finally {
          setLoadingCoupons(false);
        }
      };
      fetchCouponsList();
    }
  }, [activeTab, addToast]);

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await api.patch('/users/profile', {
        name,
        email,
        phoneNumber,
        language,
        darkMode,
      });
      // Update local storage and auth store
      const token = localStorage.getItem('auth_token') || '';
      const refreshToken = localStorage.getItem('auth_refresh_token') || '';
      setAuth(res.data, token, refreshToken);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      const errMsg = (err as { response?: { data?: { message?: string } } }).response?.data
        ?.message;
      addToast(errMsg || 'Failed to update profile.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPassword(true);
    try {
      await api.patch('/users/change-password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      addToast('Password changed successfully!', 'success');
    } catch (err) {
      console.error(err);
      const errMsg = (err as { response?: { data?: { message?: string } } }).response?.data
        ?.message;
      addToast(errMsg || 'Password update failed.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Upload Avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('Image size exceeds 2MB limit.', 'error');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const token = localStorage.getItem('auth_token') || '';
      const refreshToken = localStorage.getItem('auth_refresh_token') || '';
      setAuth(res.data, token, refreshToken);
      addToast('Profile picture updated!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Image upload failed.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Address operations
  const saveAddressesToDB = async (updatedAddrs: Address[]) => {
    try {
      const res = await api.patch('/users/addresses', { addresses: updatedAddrs });
      const token = localStorage.getItem('auth_token') || '';
      const refreshToken = localStorage.getItem('auth_refresh_token') || '';
      setAuth(res.data, token, refreshToken);
    } catch (err) {
      console.error('Failed to sync addresses:', err);
      addToast('Addresses saved locally, but failed to sync online.', 'warning');
    }
  };

  const handleOpenAddressModal = (address: Address | null = null) => {
    if (address) {
      setEditingAddress(address);
      setAddrName(address.name);
      setAddrStreet(address.street);
      setAddrCity(address.city);
      setAddrState(address.state);
      setAddrZip(address.zipCode);
      setAddrDefault(address.isDefault);
    } else {
      setEditingAddress(null);
      setAddrName('Home');
      setAddrStreet('');
      setAddrCity('');
      setAddrState('');
      setAddrZip('');
      setAddrDefault(false);
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet || !addrCity || !addrState || !addrZip) {
      addToast('All fields are required.', 'error');
      return;
    }

    if (!/^\d{6}$/.test(addrZip)) {
      addToast('Postal ZIP Code must be exactly 6 digits.', 'error');
      return;
    }

    let updatedList = [...addresses];

    if (addrDefault) {
      // Set all other addresses default flag to false
      updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
    }

    if (editingAddress) {
      updatedList = updatedList.map((a) =>
        a.id === editingAddress.id
          ? {
            ...a,
            name: addrName,
            street: addrStreet,
            city: addrCity,
            state: addrState,
            zipCode: addrZip,
            isDefault: addrDefault,
          }
          : a,
      );
      addToast('Address updated!', 'success');
    } else {
      const newAddr: Address = {
        id: Math.random().toString(36).substring(2, 9),
        name: addrName,
        street: addrStreet,
        city: addrCity,
        state: addrState,
        zipCode: addrZip,
        isDefault: addrDefault || addresses.length === 0, // Default if first address
      };
      updatedList.push(newAddr);
      addToast('Address added!', 'success');
    }

    setAddresses(updatedList);
    setIsAddressModalOpen(false);
    saveAddressesToDB(updatedList);
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    // If we deleted default, set first address as default if list not empty
    if (addresses.find((a) => a.id === id)?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    addToast('Address deleted.', 'success');
    saveAddressesToDB(updated);
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    addToast('Default address updated.', 'success');
    saveAddressesToDB(updated);
  };

  // Wishlist Actions
  const handleRemoveFromWishlist = async (productId: number) => {
    const updatedIds = wishlistIds.filter((id) => id !== productId);
    setWishlistIds(updatedIds);
    setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
    addToast('Item removed from wishlist.', 'info');
    try {
      const res = await api.patch('/users/wishlist', { wishlist: updatedIds });
      const token = localStorage.getItem('auth_token') || '';
      const refreshToken = localStorage.getItem('auth_refresh_token') || '';
      setAuth(res.data, token, refreshToken);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToCart = (product: Product) => {
    addItem(product, 1);
    addToast(`${product.name} moved to cart! 🍕`, 'success');
    handleRemoveFromWishlist(product.id);
  };

  // Notification Center Actions
  const saveNotificationsToDB = async (updatedNotifs: Notification[]) => {
    try {
      const res = await api.patch('/users/notifications', { notifications: updatedNotifs });
      const token = localStorage.getItem('auth_token') || '';
      const refreshToken = localStorage.getItem('auth_refresh_token') || '';
      setAuth(res.data, token, refreshToken);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveNotificationsToDB(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    addToast('All notifications marked as read.', 'success');
    saveNotificationsToDB(updated);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveNotificationsToDB(updated);
    addToast('Notification removed.', 'info');
  };

  // Repeat Order
  const handleRepeatOrder = (order: Order) => {
    order.items.forEach((item) => {
      // Build customization from specialInstructions if available
      let customization = undefined;
      if (item.specialInstructions && item.specialInstructions.startsWith('{')) {
        try {
          customization = JSON.parse(item.specialInstructions);
        } catch (e) {
          // ignore
        }
      }
      addItem(item.product, item.quantity, customization, item.specialInstructions);
    });
    addToast('Items added to cart! Redirecting to cart...', 'success');
    router.push('/cart');
  };

  // Print Invoice Dynamic creation
  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Popup blocked! Please allow popups to view invoice.', 'error');
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
              <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
              <strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}<br>
            </div>
          </div>
          
          <div class="meta-section">
            <div class="meta-card">
              <div class="meta-title">Billed To</div>
              <strong>${user?.name}</strong><br>
              ${user?.email}<br>
              Phone: ${user?.phoneNumber || 'N/A'}
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

          <div style="clear: both;"></div>

          <div class="footer">
            Thank you for ordering with Foodies Express! If you have any inquiries regarding this invoice, please email support@foodies-express.com.<br>
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

  // coupons state is loaded dynamically from backend when tab is open

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
        <Navbar />

        {/* Banner Section */}
        <section className="py-12 bg-gradient-to-b from-red-600/5 via-transparent to-transparent border-b border-neutral-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-20 w-20 rounded-3xl bg-card border-2 border-neutral-800 hover:border-red-500 overflow-hidden flex items-center justify-center text-red-500 text-3xl font-extrabold transition-all duration-300">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    user?.name.substring(0, 2).toUpperCase()
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-red-600 hover:bg-red-700 text-foreground rounded-xl shadow-lg transition-transform group-hover:scale-110">
                  <Camera className="h-3.5 w-3.5" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                  Hello, {user?.name.split(' ')[0]} <Sparkles className="h-5 w-5 text-amber-500" />
                </h1>
                <p className="text-xs text-foreground font-semibold mt-0.5 uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified Customer Account
                </p>
              </div>
            </div>

            {/* Quick loyalty stats in banner */}
            <div className="flex gap-4">
              <div className="px-5 py-3 rounded-2xl bg-card/30 border border-neutral-900 text-center min-w-[120px]">
                <span className="text-[10px] text-foreground font-bold uppercase tracking-wider block">
                  Pizza Points
                </span>
                <span className="text-xl font-extrabold text-red-500 mt-1 block">
                  {user?.loyaltyPoints || 0}
                </span>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-card/30 border border-neutral-900 text-center min-w-[120px]">
                <span className="text-[10px] text-foreground font-bold uppercase tracking-wider block">
                  Membership
                </span>
                <span className="text-sm font-extrabold text-amber-500 mt-1.5 block flex items-center justify-center gap-1 uppercase">
                  <Award className="h-3.5 w-3.5" /> {user?.rewardLevel || 'Bronze'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Panels */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Tabs navigation */}
          <div className="col-span-1 space-y-2">
            {[
              { id: 'profile', label: 'My Profile', icon: UserIcon },
              { id: 'orders', label: 'Order History', icon: ShoppingBag },
              { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
              { id: 'wishlist', label: 'My Wishlist', icon: Heart, badge: wishlistIds.length },
              {
                id: 'notifications',
                label: 'Notifications',
                icon: Bell,
                badge: notifications.filter((n) => !n.read).length,
              },
              { id: 'coupons', label: 'My Coupons', icon: Ticket, badge: coupons.length },
              { id: 'payment-history', label: 'Payment History', icon: DollarSign },
              { id: 'settings', label: 'Account Settings', icon: SettingsIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${isActive
                    ? 'bg-red-600 text-foreground shadow-md shadow-red-950/20'
                    : 'text-foreground hover:text-primary hover:bg-card/40'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && tab.badge > 0 ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white text-red-600' : 'bg-red-600/10 text-red-500'}`}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Content */}
          <div className="col-span-1 lg:col-span-3 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                {/* 1. PROFILE TAB */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-6">
                      <h3 className="text-base font-bold text-foreground border-b border-neutral-900 pb-3 flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-red-500" /> Edit Profile Details
                      </h3>

                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                              Phone Number
                            </label>
                            <input
                              type="text"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                              Language
                            </label>
                            <select
                              value={language}
                              onChange={(e) => setLanguage(e.target.value)}
                              className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                            >
                              <option value="en">English (US)</option>
                              <option value="it">Italiano</option>
                              <option value="fr">Français</option>
                              <option value="es">Español</option>
                            </select>
                          </div>
                        </div>

                        {/* <div className="flex items-center gap-3 py-2">
                          <input
                            type="checkbox"
                            id="darkModeCheck"
                            checked={darkMode}
                            onChange={(e) => setDarkMode(e.target.checked)}
                            className="h-4.5 w-4.5 rounded accent-red-500"
                          />
                          <label htmlFor="darkModeCheck" className="text-sm font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                            {darkMode ? <Moon className="h-4 w-4 text-amber-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                            Enable Dark Mode Styling Preference
                          </label>
                        </div> */}

                        <button
                          type="submit"
                          disabled={updatingProfile}
                          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-foreground text-xs font-bold tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2"
                        >
                          {updatingProfile ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </form>
                    </div>

                    <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-6">
                      <h3 className="text-base font-bold text-foreground border-b border-neutral-900 pb-3 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-red-500" /> Change Account Password
                      </h3>

                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                              Current Password
                            </label>
                            <input
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={updatingPassword}
                          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-foreground text-xs font-bold tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2"
                        >
                          {updatingPassword ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Update Password'
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Loyalty dashboard inside Profile page for quick access */}
                    <LoyaltyDashboard />
                  </div>
                )}

                {/* 2. ORDER HISTORY TAB */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap justify-between items-center gap-4 border-b border-neutral-900 pb-3">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-red-500" /> Order History
                      </h3>

                      {/* Status filters */}
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            'all',
                            'pending',
                            'preparing',
                            'out-for-delivery',
                            'delivered',
                            'cancelled',
                          ] as const
                        ).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setOrderFilter(filter)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all duration-150 cursor-pointer ${orderFilter === filter
                              ? 'bg-red-600 text-foreground'
                              : 'bg-card/40 text-foreground hover:text-primary border border-neutral-900'
                              }`}
                          >
                            {filter.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {loadingOrders ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                        <span className="text-sm text-foreground font-medium">
                          Loading your orders...
                        </span>
                      </div>
                    ) : (
                      (() => {
                        const filteredOrders = orders.filter((o) => {
                          if (orderFilter === 'all') return true;
                          return o.status === orderFilter;
                        });

                        if (filteredOrders.length === 0) {
                          return (
                            <div className="text-center py-16 bg-card/10 border border-neutral-900 border-dashed rounded-3xl">
                              <ShoppingBag className="h-12 w-12 text-foreground mx-auto mb-2" />
                              <p className="text-sm font-semibold text-foreground">
                                No matching orders found
                              </p>
                              <p className="text-xs text-foreground mt-1">
                                Place a fresh hot order from the menu!
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {filteredOrders.map((order) => (
                              <div
                                key={order.id}
                                className="p-5 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg flex flex-col md:flex-row justify-between gap-4"
                              >
                                <div className="space-y-3 flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-xs text-foreground font-bold uppercase">
                                        ORDER ID
                                      </p>
                                      <h4 className="text-sm font-black text-foreground mt-0.5">
                                        #FEX-{order.id}
                                      </h4>
                                    </div>
                                    <div className="md:hidden">
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${order.status === 'delivered'
                                          ? 'bg-emerald-950/40 text-emerald-500 border border-emerald-950'
                                          : order.status === 'cancelled'
                                            ? 'bg-red-950/40 text-red-500 border border-red-950'
                                            : 'bg-amber-950/40 text-amber-500 border border-amber-950'
                                          }`}
                                      >
                                        {order.status.replace('-', ' ')}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    {order.items.map((item) => (
                                      <p
                                        key={item.id}
                                        className="text-xs text-foreground font-medium"
                                      >
                                        {item.quantity}x {item.product.name}
                                      </p>
                                    ))}
                                  </div>

                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground font-bold">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5 text-foreground" /> Placed:{' '}
                                      {new Date(order.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3.5 w-3.5 text-foreground" /> Mode:
                                      Online Gateway
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-foreground animate-pulse text-red-500" />{' '}
                                      Ship To: {order.deliveryAddress.split(',')[0]}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-row md:flex-col justify-between items-end gap-3 border-t md:border-t-0 border-neutral-900 pt-3 md:pt-0">
                                  <div className="text-left md:text-right hidden md:block">
                                    <span
                                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === 'delivered'
                                        ? 'bg-emerald-950/30 text-emerald-700 border border-emerald-900/60'
                                        : order.status === 'cancelled'
                                          ? 'bg-red-950/30 text-red-700 border border-red-900/60'
                                          : 'bg-amber-950/30 text-amber-400 border border-amber-900/60'
                                        }`}
                                    >
                                      {order.status.replace('-', ' ')}
                                    </span>
                                    <p className="text-xs text-foreground font-bold uppercase mt-2">
                                      Total Paid
                                    </p>
                                    <p className="text-base font-black text-red-500 mt-0.5">
                                      ₹{order.totalAmount}
                                    </p>
                                  </div>

                                  <div className="md:hidden">
                                    <p className="text-xs text-foreground font-bold">
                                      Total Amount
                                    </p>
                                    <p className="text-sm font-black text-red-500 mt-0.5">
                                      ₹{order.totalAmount}
                                    </p>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => router.push(`/order/${order.id}`)}
                                      className="p-2 rounded-xl bg-background hover:bg-card border border-neutral-900 text-foreground hover:text-primary text-xs font-bold transition-colors cursor-pointer"
                                      title="Track order status & timeline"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handlePrintInvoice(order)}
                                      className="p-2 rounded-xl bg-background hover:bg-card border border-neutral-900 text-foreground hover:text-primary text-xs font-bold transition-colors cursor-pointer"
                                      title="Download invoice as PDF"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRepeatOrder(order)}
                                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-foreground text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Repeat Order items"
                                    >
                                      <TrendingUp className="h-4 w-4" />
                                      <span className="hidden sm:inline">Repeat</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

                {/* 3. ADDRESSES TAB */}
                {activeTab === 'addresses' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-500" /> Saved Addresses
                      </h3>
                      <button
                        onClick={() => handleOpenAddressModal()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-foreground text-xs font-bold tracking-wider uppercase cursor-pointer transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Address
                      </button>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="text-center py-16 bg-card/10 border border-neutral-900 border-dashed rounded-3xl">
                        <MapPin className="h-12 w-12 text-foreground mx-auto mb-2" />
                        <p className="text-sm font-semibold text-foreground">
                          No addresses saved yet
                        </p>
                        <p className="text-xs text-foreground mt-1">
                          Add a delivery destination for fast checkout!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            className={`p-5 rounded-3xl bg-card/20 border shadow-lg flex flex-col justify-between gap-4 transition-all duration-200 ${address.isDefault ? 'border-red-500/30' : 'border-neutral-900'
                              }`}
                          >
                            <div>
                              <div className="flex justify-between items-center">
                                <span
                                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${address.isDefault
                                    ? 'bg-red-600/10 text-red-500'
                                    : 'bg-background text-foreground'
                                    }`}
                                >
                                  {address.name}
                                </span>

                                {address.isDefault && (
                                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 bg-emerald-950/20 px-2 py-0.5 rounded-md">
                                    <Check className="h-3 w-3" /> Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-foreground mt-3">
                                {address.street}
                              </p>
                              <p className="text-xs text-foreground mt-1">
                                {address.city}, {address.state} - {address.zipCode}
                              </p>
                            </div>

                            <div className="flex justify-between items-center border-t border-neutral-900 pt-3 mt-1">
                              {!address.isDefault ? (
                                <button
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                  className="text-[10px] font-extrabold uppercase text-foreground hover:text-red-500 cursor-pointer transition-colors"
                                >
                                  Set As Default
                                </button>
                              ) : (
                                <span className="text-[10px] font-extrabold uppercase text-emerald-500/60">
                                  Primary Destination
                                </span>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenAddressModal(address)}
                                  className="p-2 rounded-lg bg-background hover:bg-card border border-neutral-900 text-foreground hover:text-primary transition-colors cursor-pointer"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="p-2 rounded-lg bg-background hover:bg-red-950/30 border border-neutral-900 hover:border-red-900 text-foreground hover:text-red-500 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. WISHLIST TAB */}
                {activeTab === 'wishlist' && (
                  <div className="space-y-6">
                    <h3 className="text-base font-bold text-foreground border-b border-neutral-900 pb-3 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" /> My Saved Wishlist
                    </h3>

                    {loadingWishlist ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                        <span className="text-sm text-foreground font-medium">
                          Retrieving saved items...
                        </span>
                      </div>
                    ) : wishlistProducts.length === 0 ? (
                      <div className="text-center py-16 bg-card/10 border border-neutral-900 border-dashed rounded-3xl">
                        <Heart className="h-12 w-12 text-foreground mx-auto mb-2" />
                        <p className="text-sm font-semibold text-foreground">
                          Your wishlist is empty
                        </p>
                        <p className="text-xs text-foreground mt-1">
                          Tap the heart icons on pizzas to save them here!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {wishlistProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-4 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg flex gap-4 items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-16 w-16 rounded-2xl bg-card/40 border border-neutral-900/60 overflow-hidden flex items-center justify-center shrink-0">
                                <img
                                  src={getProductImage(
                                    product.imageUrl,
                                    product.category,
                                    product.name,
                                  )}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-foreground line-clamp-1">
                                  {product.name}
                                </h4>
                                <span className="text-xs font-bold text-red-500 mt-0.5 block">
                                  ₹{product.price}
                                </span>
                                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block mt-0.5">
                                  {product.category}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRemoveFromWishlist(product.id)}
                                className="p-2 rounded-xl bg-background hover:bg-red-950/20 border border-neutral-900 text-foreground hover:text-red-500 cursor-pointer transition-all"
                                title="Remove from wishlist"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleMoveToCart(product)}
                                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                                title="Move item to shopping cart"
                              >
                                <ShoppingBag className="h-3.5 w-3.5" /> Move to Cart
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. NOTIFICATIONS TAB */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <Bell className="h-5 w-5 text-red-500" /> Notification Center
                      </h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-extrabold uppercase text-red-500 hover:text-red-600 cursor-pointer"
                        >
                          Mark All As Read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="text-center py-16 bg-card/10 border border-neutral-900 border-dashed rounded-3xl">
                        <Bell className="h-12 w-12 text-foreground mx-auto mb-2" />
                        <p className="text-sm font-semibold text-foreground">All caught up!</p>
                        <p className="text-xs text-foreground mt-1">
                          We will notify you about offers and deliveries here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 rounded-2xl bg-card/20 border flex justify-between items-start gap-4 shadow-sm transition-colors duration-150 ${notif.read
                              ? 'border-neutral-900/50 opacity-70'
                              : 'border-red-500/10 bg-red-500/[0.01]'
                              }`}
                          >
                            <div className="flex gap-3">
                              <span
                                className={`p-2 rounded-xl mt-0.5 flex items-center justify-center shrink-0 ${notif.type === 'order'
                                  ? 'bg-amber-950/20 text-amber-500'
                                  : notif.type === 'coupon'
                                    ? 'bg-red-950/20 text-red-500'
                                    : 'bg-emerald-950/20 text-emerald-500'
                                  }`}
                              >
                                {notif.type === 'order' ? (
                                  <ShoppingBag className="h-4.5 w-4.5" />
                                ) : (
                                  <Ticket className="h-4.5 w-4.5" />
                                )}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                  {notif.title}
                                  {!notif.read && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 block shrink-0" />
                                  )}
                                </h4>
                                <p className="text-xs text-foreground mt-1 leading-relaxed">
                                  {notif.content}
                                </p>
                                <span className="text-[10px] text-foreground font-bold block mt-1.5">
                                  {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                                  {new Date(notif.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-1 shrink-0">
                              {!notif.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  className="p-1 text-foreground hover:text-emerald-500 cursor-pointer"
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(notif.id)}
                                className="p-1 text-foreground hover:text-red-500 cursor-pointer"
                                title="Remove notification"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. COUPONS TAB */}
                {activeTab === 'coupons' && (
                  <div className="space-y-6">
                    <h3 className="text-base font-bold text-foreground border-b border-neutral-900 pb-3 flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-red-500" /> Active Promo Coupons
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coupons.map((coupon) => (
                        <div
                          key={coupon.code}
                          className="relative p-5 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg overflow-hidden flex flex-col justify-between gap-4"
                        >
                          {/* Radial glowing design for coupons */}
                          <div className="absolute right-[-40px] top-[-40px] h-24 w-24 rounded-full bg-red-600/5 blur-xl pointer-events-none" />

                          <div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-extrabold text-red-500 bg-red-600/10 border border-red-500/20 px-3 py-1 rounded-xl">
                                {coupon.code}
                              </span>
                              <span className="text-[10px] text-foreground font-bold uppercase tracking-wider">
                                Min Spend: ₹{coupon.minAmount}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-foreground mt-4">
                              {coupon.discount > 0
                                ? `Get ₹${coupon.discount} Discount`
                                : 'Special Promo Offer'}
                            </h4>
                            <p className="text-xs text-foreground mt-1 leading-relaxed">
                              {coupon.desc}
                            </p>
                          </div>

                          <div className="border-t border-neutral-900/60 pt-3 flex justify-between items-center mt-1">
                            <span className="text-[10px] text-foreground font-bold uppercase">
                              Expires: 31 Dec 2026
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(coupon.code);
                                addToast(`Promo code ${coupon.code} copied! 🎟️`, 'success');
                              }}
                              className="text-[10px] font-extrabold uppercase text-red-500 hover:text-red-600 cursor-pointer"
                            >
                              Copy Code
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. PAYMENT HISTORY TAB */}
                {activeTab === 'payment-history' && (
                  <div className="space-y-6">
                    <h3 className="text-base font-bold text-foreground border-b border-neutral-900 pb-3 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-red-500" /> Transaction Payment History
                    </h3>

                    {loadingOrders ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                        <span className="text-sm text-foreground font-medium">
                          Retrieving transaction logs...
                        </span>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-16 bg-card/10 border border-neutral-900 border-dashed rounded-3xl">
                        <DollarSign className="h-12 w-12 text-foreground mx-auto mb-2" />
                        <p className="text-sm font-semibold text-foreground">
                          No transactions recorded
                        </p>
                        <p className="text-xs text-foreground mt-1">
                          Purchase items from the shop to activate ledger.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-900/60 text-[10px] text-foreground font-bold uppercase tracking-wider">
                              <th className="py-3 px-2">Transaction ID</th>
                              <th className="py-3 px-2">Date</th>
                              <th className="py-3 px-2">Payment Channel</th>
                              <th className="py-3 px-2">Total Amount</th>
                              <th className="py-3 px-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-900/20 text-xs">
                            {orders.map((order) => (
                              <tr
                                key={order.id}
                                className="hover:bg-card/10 transition-colors"
                              >
                                <td className="py-3.5 px-2 font-bold text-foreground">
                                  #FEX-TXN-{order.id}93
                                </td>
                                <td className="py-3.5 px-2 text-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-3.5 px-2 text-foreground">Razorpay Sandbox</td>
                                <td className="py-3.5 px-2 font-bold text-foreground">
                                  ₹{order.totalAmount}
                                </td>
                                <td className="py-3.5 px-2 text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${order.paymentStatus === 'paid'
                                      ? 'bg-emerald-950/30 text-emerald-500 border border-emerald-950/40'
                                      : order.paymentStatus === 'failed'
                                        ? 'bg-red-950/30 text-red-500 border border-red-950/40'
                                        : 'bg-amber-950/30 text-amber-500 border border-amber-950/40'
                                      }`}
                                  >
                                    {order.paymentStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 8. SETTINGS TAB */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-6">
                      <h3 className="text-base font-bold text-foreground border-b border-neutral-900 pb-3 flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5 text-red-500" /> System Preferences
                      </h3>

                      <div className="space-y-4 text-xs font-semibold text-foreground">
                        <div className="flex justify-between items-center py-2 border-b border-neutral-900/40">
                          <div>
                            <h4 className="text-sm font-bold text-foreground">
                              Order Updates email notifications
                            </h4>
                            <p className="text-[10px] text-foreground mt-0.5">
                              Receive confirmations for deliveries and cancellations
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="h-4.5 w-4.5 rounded accent-red-500"
                          />
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-neutral-900/40">
                          <div>
                            <h4 className="text-sm font-bold text-foreground">
                              Special offers & coupons alerts
                            </h4>
                            <p className="text-[10px] text-foreground mt-0.5">
                              Get notified when pizza promos are launched
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="h-4.5 w-4.5 rounded accent-red-500"
                          />
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <div>
                            <h4 className="text-sm font-bold text-foreground">
                              Analytical Cookie Tracking
                            </h4>
                            <p className="text-[10px] text-foreground mt-0.5">
                              Allow cookies to save your recently viewed product items list
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="h-4.5 w-4.5 rounded accent-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-red-950/10 border border-red-900/20 shadow-lg space-y-4">
                      <h4 className="text-sm font-black text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" /> Danger Zone
                      </h4>
                      <p className="text-xs text-foreground leading-relaxed max-w-xl">
                        Deleting your account will erase your entire pizza points ledger, order
                        histories, saved addresses list, and details permanently.
                      </p>
                      <button
                        onClick={() =>
                          addToast('Account deletion disabled in sandbox mode.', 'error')
                        }
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-foreground text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                      >
                        Request Deactivation
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Recently Viewed and Recommendations Carousels */}
        <section className="bg-background border-t border-neutral-900 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductRecommendations />
          </div>
        </section>

        {/* Saved Address creation/editing Dialog modal overlay */}
        <AnimatePresence>
          {isAddressModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-background border border-neutral-900 text-foreground max-w-md w-full rounded-3xl p-6 shadow-2xl relative"
              >
                <button
                  onClick={() => setIsAddressModalOpen(false)}
                  className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-card transition-colors text-foreground hover:text-primary cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <h3 className="text-base font-black text-foreground flex items-center gap-2 border-b border-neutral-900 pb-3.5 mb-4">
                  <MapPin className="h-5 w-5 text-red-500" />
                  {editingAddress ? 'Modify Address' : 'New Address'}
                </h3>

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Address Nickname
                    </label>
                    <select
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                      className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Hostel">Hostel</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Street / Locality
                    </label>
                    <input
                      type="text"
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      placeholder="e.g. Block C, stripe towers, Sector 62"
                      className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                        City
                      </label>
                      <input
                        type="text"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        placeholder="e.g. Vizianagaram"
                        className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                        State
                      </label>
                      <input
                        type="text"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        placeholder="e.g. Uttar Pradesh"
                        className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                        ZIP Postal Code (India)
                      </label>
                      <input
                        type="text"
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                        placeholder="e.g. 201301"
                        maxLength={6}
                        className="w-full bg-background border border-neutral-900 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="setDefaultAddressCheck"
                        checked={addrDefault}
                        onChange={(e) => setAddrDefault(e.target.checked)}
                        className="h-4.5 w-4.5 rounded accent-red-500"
                      />
                      <label
                        htmlFor="setDefaultAddressCheck"
                        className="text-xs font-bold text-foreground cursor-pointer"
                      >
                        Set as Default Destination
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-foreground text-xs font-bold uppercase tracking-wider mt-4 cursor-pointer"
                  >
                    Save Address
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center select-none text-foreground">
          <div className="h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-xs font-bold uppercase tracking-wider">Loading Dashboard...</span>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
