import { User, Product } from '@/types';

export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrder: number;
  expiryDate?: string;
  usageLimit: number;
  usedCount: number;
  isOneTime: boolean;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  displayName: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Review {
  id: number;
  user?: User;
  product?: Product;
  rating: number;
  comment: string;
  reply?: string;
  status: 'pending' | 'approved' | 'rejected';
  isAbuseReported: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  action: string;
  details?: string;
  ipAddress?: string;
  userName?: string;
  userEmail?: string;
  createdAt: string;
}

export interface DashboardStats {
  kpi: {
    todayOrders: number;
    todayRevenue: number;
    pendingOrders: number;
    preparingOrders: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
    totalCustomers: number;
    averageOrderValue: number;
    repeatCustomersPercentage: number;
  };
  charts: {
    dailyRevenue: { date: string; amount: number }[];
    weeklyRevenue: { week: string; amount: number }[];
    monthlyRevenue: { month: string; amount: number }[];
    ordersByCategory: { category: string; count: number }[];
    topSellingPizza: { name: string; count: number }[];
    topSellingCombo: { name: string; count: number }[];
    topCustomers: { name: string; orders: number; spend: number }[];
    peakOrderHours: { hour: string; count: number }[];
  };
}
