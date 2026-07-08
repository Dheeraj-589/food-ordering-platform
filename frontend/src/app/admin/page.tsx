'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import api from '@/lib/api';
import { Product } from '@/types';
import { DashboardStats } from './components/types';

// Import Admin Sub-Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import OverviewTab from './components/OverviewTab';
import AnalyticsTab from './components/AnalyticsTab';
import LiveOrdersTab from './components/LiveOrdersTab';
import OrdersTab from './components/OrdersTab';
import ManagersTab from './components/ManagersTab';
import ProductsTab from './components/ProductsTab';
import CategoriesTab from './components/CategoriesTab';
import CombosTab from './components/CombosTab';
import CouponsTab from './components/CouponsTab';
import CustomersTab from './components/CustomersTab';
import ReviewsTab from './components/ReviewsTab';
import NotificationsTab from './components/NotificationsTab';
import CmsTab from './components/CmsTab';
import MediaTab from './components/MediaTab';
import SettingsTab from './components/SettingsTab';
import SecurityTab from './components/SecurityTab';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout, isLoading } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  // Guard routing role check
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      addToast('Please login to access the administration console.', 'error');
      router.push('/login');
    } else if (user?.role !== 'admin' && user?.role !== 'manager') {
      addToast('Access denied. Redirecting to Customer Dashboard.', 'error');
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, isLoading, router, addToast]);

  const fetchStats = async () => {
    try {
      const [dashRes, analRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/analytics'),
      ]);
      setStats({
        kpi: dashRes.data.kpi,
        charts: analRes.data,
      });
    } catch (err) {
      console.error('Failed to load dashboard metrics stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch catalog list:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'manager')) {
      fetchStats();
      fetchProducts();
    }
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    await logout();
    addToast('Logged out of system dashboard successfully.', 'success');
    router.push('/login');
  };

  if (isLoading || !isAuthenticated || (user?.role !== 'admin' && user?.role !== 'manager')) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center select-none text-foreground">
        <div className="h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-xs font-bold uppercase tracking-wider">
          Verifying Authorization...
        </span>
      </div>
    );
  }

  // Render tab panel mapping key
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} loading={loadingStats} />;
      case 'analytics':
        return <AnalyticsTab stats={stats} loading={loadingStats} />;
      case 'live-orders':
        return <LiveOrdersTab searchTerm={globalSearch} />;
      case 'orders':
        return <OrdersTab searchTerm={globalSearch} />;
      case 'managers':
        return <ManagersTab />;
      case 'products':
        return (
          <ProductsTab
            products={products}
            fetchProducts={fetchProducts}
            searchTerm={globalSearch}
          />
        );
      case 'categories':
        return <CategoriesTab />;
      case 'combos':
        return (
          <CombosTab products={products} fetchProducts={fetchProducts} searchTerm={globalSearch} />
        );
      case 'coupons':
        return <CouponsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'customers':
        return <CustomersTab />;
      case 'reviews':
        return <ReviewsTab />;
      case 'cms':
        return <CmsTab />;
      case 'media':
        return <MediaTab />;
      case 'settings':
        return <SettingsTab />;
      case 'security':
        return <SecurityTab />;
      default:
        return <OverviewTab stats={stats} loading={loadingStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] dark:bg-[#FFF8F2] text-[#1A1A1A] flex font-sans select-none overflow-x-hidden">
      {/* Sidebar collapsible drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onLogout={handleLogout}
      />

      {/* Main View Port Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Topbar
          user={user}
          onLogout={handleLogout}
          searchTerm={globalSearch}
          setSearchTerm={setGlobalSearch}
        />

        {/* Tab content wrapper with page transition effect */}
        <main className="p-6 md:p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
