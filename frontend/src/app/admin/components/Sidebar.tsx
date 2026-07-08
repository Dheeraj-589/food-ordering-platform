'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Activity,
  Table,
  ShoppingBag,
  Grid,
  Layers,
  Percent,
  Ticket,
  Users,
  MessageSquare,
  Bell,
  FileText,
  Image,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Pizza,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  onLogout,
}: SidebarProps) {
  const { user } = useAuthStore();
  const role = user?.role;

  const menuGroups = [
    {
      group: 'Core',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: Activity },
        { id: 'live-orders', label: 'Live Dispatch', icon: Activity },
      ],
    },
    {
      group: 'Workflow',
      items: [{ id: 'orders', label: 'Order History', icon: Table }],
    },
    {
      group: 'Inventory',
      items: [
        { id: 'products', label: 'Products', icon: ShoppingBag },
        { id: 'categories', label: 'Categories', icon: Grid },
        { id: 'combos', label: 'Combos', icon: Layers },
      ],
    },
    {
      group: 'Marketing',
      items: [
        { id: 'coupons', label: 'Vouchers', icon: Ticket },
        { id: 'notifications', label: 'Broadcasts', icon: Bell },
      ],
    },
    {
      group: 'Management',
      items: [
        { id: 'customers', label: 'Customers', icon: Users },
        ...(role === 'admin' ? [{ id: 'managers', label: 'Managers', icon: Shield }] : []),
        { id: 'reviews', label: 'Reviews', icon: MessageSquare },
        ...(role === 'admin' ? [{ id: 'cms', label: 'Site CMS', icon: FileText }] : []),
        { id: 'media', label: 'Media Bin', icon: Image },
      ],
    },
    ...(role === 'admin'
      ? [
        {
          group: 'System',
          items: [
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'security', label: 'Security & Logs', icon: Shield },
          ],
        },
      ]
      : []),
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bg-card border-r border-neutral-800 text-foreground flex flex-col h-screen sticky top-0 shrink-0 select-none z-30"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <Pizza className="h-6 w-6 text-red-500 shrink-0 animate-pulse" />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-extrabold text-foreground text-sm tracking-wider uppercase truncate"
            >
              FE ADMIN
            </motion.span>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-neutral-800 text-foreground hover:text-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Menu Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4 scrollbar-none">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed && (
              <span className="px-3 text-[10px] font-extrabold text-foreground uppercase tracking-widest block mb-1">
                {group.group}
              </span>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${isActive
                    ? 'text-foreground bg-red-600/10 font-bold'
                    : 'hover:bg-neutral-800/40 text-foreground hover:text-primary'
                    }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-red-500' : ''}`} />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isActive && !collapsed && (
                    <motion.div
                      layoutId="sidebarActiveLine"
                      className="absolute right-0 top-2 bottom-2 w-1 rounded-l-md bg-red-500"
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Logout */}
      <div className="p-2 border-t border-neutral-800 shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-950/20 text-foreground hover:text-red-700 transition-colors"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-semibold"
            >
              Sign Out
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
