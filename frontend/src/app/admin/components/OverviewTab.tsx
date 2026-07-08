'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  RotateCw,
  Truck,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { DashboardStats } from './types';

interface OverviewTabProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function OverviewTab({ stats, loading }: OverviewTabProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-card border border-neutral-800 animate-pulse space-y-3"
          >
            <div className="h-4 bg-neutral-850 rounded w-1/2" />
            <div className="h-8 bg-neutral-850 rounded w-3/4" />
            <div className="h-3 bg-neutral-850 rounded w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  const { kpi } = stats;

  const cardList = [
    {
      title: "Today's Orders",
      value: kpi.todayOrders,
      sub: 'New orders received',
      icon: ShoppingBag,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Revenue Today',
      value: `₹${kpi.todayRevenue.toLocaleString()}`,
      sub: 'Paid gross sales today',
      icon: DollarSign,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Pending Orders',
      value: kpi.pendingOrders,
      sub: 'Awaiting acceptance',
      icon: Clock,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Preparing',
      value: kpi.preparingOrders,
      sub: 'Items currently baking',
      icon: RotateCw,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Out for Delivery',
      value: kpi.outForDelivery,
      sub: 'Riders on route',
      icon: Truck,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Delivered',
      value: kpi.delivered,
      sub: 'Completed dispatches',
      icon: CheckCircle,
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    },
    {
      title: 'Cancelled',
      value: kpi.cancelled,
      sub: 'Rejected or dropped',
      icon: XCircle,
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
    },
    {
      title: 'Customers',
      value: kpi.totalCustomers,
      sub: 'Total consumer registry',
      icon: Users,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    },
    {
      title: 'Avg Order Value',
      value: `₹${kpi.averageOrderValue}`,
      sub: 'Average single basket ticket',
      icon: TrendingUp,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
    {
      title: 'Repeat Customers',
      value: `${kpi.repeatCustomersPercentage}%`,
      sub: 'Buyers with >1 orders',
      icon: UserCheck,
      color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Store Overview</h2>
        <p className="text-xs text-foreground mt-1">
          Real-time status indicators, active baking workflows, and gross margin trackers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cardList.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-2xl bg-card border border-neutral-300/50 flex flex-col justify-between min-h-[120px] shadow-sm relative overflow-hidden"
            >
              <div className="flex justify-between items-start gap-4">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-foreground">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.color} shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-2xl font-extrabold text-foreground tracking-tight block">
                  {card.value}
                </span>
                <span className="text-[10px] text-foreground font-semibold mt-1 block">
                  {card.sub}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
