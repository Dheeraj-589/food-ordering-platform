'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, Sun, Moon, LogOut, Shield, ChevronDown, Check } from 'lucide-react';
import { User } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface TopbarProps {
  user: User | null;
  onLogout: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function Topbar({ user, onLogout, searchTerm, setSearchTerm }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const [ordersRes, reviewsRes, logsRes] = await Promise.all([
          api.get('/orders'),
          api.get('/admin/reviews'),
          api.get('/admin/audit-logs'),
        ]);

        const list: any[] = [];
        let nid = 1;

        // 1. Get recent orders
        const recentOrders = ordersRes.data.slice(0, 3);
        recentOrders.forEach((o: any) => {
          list.push({
            id: nid++,
            title: 'New Order Received',
            message: `Order #${o.id} placed by ${o.user?.name || 'Customer'} for ₹${o.totalAmount}`,
            time: new Date(o.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            read: o.status !== 'pending',
          });
        });

        // 2. Flagged reviews
        const flaggedReviews = reviewsRes.data.filter((r: any) => r.isAbuseReported).slice(0, 2);
        flaggedReviews.forEach((r: any) => {
          list.push({
            id: nid++,
            title: 'Abuse Review Reported',
            message: `Review on item was flagged: "${r.comment}"`,
            time: new Date(r.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            read: r.status === 'approved',
          });
        });

        // 3. Failed logins
        const failedLogins = logsRes.data
          .filter((l: any) => l.action === 'FAILED_LOGIN')
          .slice(0, 2);
        failedLogins.forEach((l: any) => {
          list.push({
            id: nid++,
            title: 'System Security Alert',
            message: `Failed login attempt for ${l.userEmail || 'unknown'} from IP ${l.ipAddress || 'unknown'}`,
            time: new Date(l.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            read: true,
          });
        });

        setNotifications(list);
      } catch (err) {
        console.error('Failed to load topbar notifications:', err);
      }
    }
    fetchNotifications();
  }, []);

  const [darkMode, setDarkMode] = useState(true); // Keep color palette consistent

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 bg-card border-b border-neutral-800 flex items-center justify-between px-6 sticky top-0 z-20 shrink-0 select-none">
      {/* Global Search */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-foreground">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Global search orders, users, catalog..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-background border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder-neutral-600 focus:border-red-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Action Triggers */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle (keeps current palette but toggles styling indicator) */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl bg-background border border-neutral-800 text-foreground hover:text-primary transition-colors"
        >
          {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-background border border-neutral-800 text-foreground hover:text-primary transition-colors relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-600 text-[10px] text-foreground font-extrabold flex items-center justify-center rounded-full border border-neutral-900 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-card border border-neutral-800 rounded-2xl shadow-2xl z-20 py-2"
                >
                  <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">System Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-neutral-800/40">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 text-xs transition-colors hover:bg-neutral-800/20 ${!notif.read ? 'bg-neutral-800/10' : ''
                          }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span
                            className={`font-bold ${!notif.read ? 'text-foreground' : 'text-foreground'}`}
                          >
                            {notif.title}
                          </span>
                          <span className="text-[9px] text-foreground shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-foreground mt-1 leading-relaxed">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 bg-background border border-neutral-800 rounded-xl px-3 py-1.5 text-left hover:border-neutral-700 transition-colors"
          >
            <div className="h-7 w-7 bg-red-600 text-foreground font-extrabold flex items-center justify-center rounded-lg border border-red-500 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : user?.name ? (
                user.name[0].toUpperCase()
              ) : (
                'A'
              )}
            </div>
            <div className="hidden md:block shrink-0">
              <span className="text-xs font-bold text-foreground block max-w-[120px] truncate">
                {user?.name || 'Admin'}
              </span>
              <span className="text-[9px] text-foreground font-bold block tracking-wider uppercase">
                {user?.role || 'Administrator'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-foreground shrink-0" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-card border border-neutral-800 rounded-2xl shadow-2xl z-20 py-1.5 text-xs text-foreground"
                >
                  <div className="px-4 py-2 border-b border-neutral-800 text-foreground block md:hidden">
                    <span className="font-bold text-foreground block">{user?.name}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                  <div className="p-1 space-y-0.5">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-foreground">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Permissions Verified</span>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-950/20 text-foreground hover:text-red-700 transition-colors text-left font-bold cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
