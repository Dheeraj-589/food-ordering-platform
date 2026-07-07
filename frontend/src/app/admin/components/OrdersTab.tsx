'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Edit2,
  ShieldAlert,
  Award,
  FileText,
  CheckCircle,
  RefreshCcw,
} from 'lucide-react';
import api from '@/lib/api';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { useToastStore } from '@/store/toastStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OrdersTabProps {
  searchTerm: string;
}

export default function OrdersTab({ searchTerm }: OrdersTabProps) {
  const { addToast } = useToastStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Page state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'id' | 'totalAmount' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

  // Detail Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Dynamic delivery partners state
  const [deliveryPartners, setDeliveryPartners] = useState<
    { id: number; name: string; phone: string }[]
  >([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch orders history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiders = async () => {
    try {
      const response = await api.get('/admin/users');
      const riders = response.data
        .filter((u: any) => u.role === 'delivery')
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          phone: u.phoneNumber || 'No phone',
        }));
      setDeliveryPartners(riders);
    } catch (err) {
      console.error('Failed to load active riders:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchRiders();
  }, []);

  const handleSort = (field: 'id' | 'totalAmount' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and Sort logic
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toString().includes(searchTerm) ||
      o.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'totalAmount') {
      return (Number(a.totalAmount) - Number(b.totalAmount)) * multiplier;
    }
    if (sortField === 'id') {
      return (a.id - b.id) * multiplier;
    }
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * multiplier;
  });

  // Paginated results
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(paginatedOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (orderId: number, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds((prev) => [...prev, orderId]);
    } else {
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  // Bulk Actions
  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    try {
      await Promise.all(
        selectedOrderIds.map((id) => api.patch(`/orders/${id}/status`, { status })),
      );
      addToast(`Bulk updated ${selectedOrderIds.length} orders to ${status}!`, 'success');
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (e) {
      console.error(e);
      addToast('Bulk update failed.', 'error');
    }
  };

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setSelectedPartnerId('');
    setDetailsOpen(true);
  };

  const handleUpdateSingleStatus = async (orderId: number, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      addToast(`Order #${orderId} status set to ${status}.`, 'success');
      fetchOrders();
      setDetailsOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to update status.', 'error');
    }
  };

  // Simulate refund
  const handleSimulateRefund = async (orderId: number) => {
    try {
      await api.patch(`/orders/${orderId}/payment`, { paymentStatus: 'failed' });
      addToast(
        `Refund demo executed on Order #${orderId}. Payment status marked FAILED/Refunded.`,
        'info',
      );
      fetchOrders();
      setDetailsOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Refund simulation error.', 'error');
    }
  };

  const handleAssignDelivery = (orderId: number) => {
    if (!selectedPartnerId) {
      addToast('Please select a delivery partner.', 'error');
      return;
    }
    const partner = deliveryPartners.find((p) => p.id === Number(selectedPartnerId));
    addToast(
      `Assigned rider ${partner?.name} to Order #${orderId}. Alert sent to Rider's Hub.`,
      'success',
    );
    setDetailsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100">Order Management</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Advanced listing, status timeline routers, refund triggers, and bulk operations.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-neutral-400">
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-xl">
            <Filter className="h-3.5 w-3.5 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none outline-none cursor-pointer text-neutral-300 font-sans"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="out-for-delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-xl">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none outline-none cursor-pointer text-neutral-300 font-sans"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed/Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedOrderIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-neutral-900/60 border border-red-500/20 rounded-2xl flex justify-between items-center gap-4 text-xs font-bold shrink-0"
        >
          <span className="text-neutral-300 font-bold">
            {selectedOrderIds.length} orders selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusUpdate('preparing')}
              className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
            >
              Mark Preparing
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('delivered')}
              className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
            >
              Mark Delivered
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('cancelled')}
              className="px-3 py-1.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-500 hover:bg-red-950/40 cursor-pointer"
            >
              Bulk Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Table Container */}
      <div className="p-6 rounded-3xl bg-neutral-900/20 border border-neutral-900/60 shadow-lg space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-neutral-900 max-h-[550px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-semibold text-neutral-400">
            <thead className="bg-neutral-950 text-neutral-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedOrders.length > 0 &&
                      selectedOrderIds.length === paginatedOrders.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-3.5 w-3.5 accent-red-600 rounded cursor-pointer"
                  />
                </th>
                <th className="p-4 cursor-pointer" onClick={() => handleSort('id')}>
                  <span className="flex items-center gap-1">
                    Order ID <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="p-4">Customer</th>
                <th className="p-4 cursor-pointer" onClick={() => handleSort('totalAmount')}>
                  <span className="flex items-center gap-1">
                    Amount <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4 cursor-pointer" onClick={() => handleSort('createdAt')}>
                  <span className="flex items-center gap-1">
                    Placed At <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500 font-bold">
                    Loading order records...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500 font-bold">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isChecked = selectedOrderIds.includes(order.id);
                  return (
                    <tr key={order.id} className="hover:bg-neutral-900/20">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectOne(order.id, e.target.checked)}
                          className="h-3.5 w-3.5 accent-red-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-black text-white">#{order.id}</td>
                      <td className="p-4">
                        <span className="text-neutral-200 font-bold block">{order.user?.name}</span>
                        <span className="text-[10px] text-neutral-500 block truncate max-w-[150px]">
                          {order.user?.email}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-neutral-300">₹{order.totalAmount}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                            order.status === 'pending'
                              ? 'bg-blue-600/10 text-blue-500 border-blue-500/20'
                              : order.status === 'preparing'
                                ? 'bg-amber-600/10 text-amber-500 border-amber-500/20'
                                : order.status === 'out-for-delivery'
                                  ? 'bg-indigo-600/10 text-indigo-500 border-indigo-500/20'
                                  : order.status === 'delivered'
                                    ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-red-600/10 text-red-500 border-red-500/20'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20'
                              : order.paymentStatus === 'pending'
                                ? 'bg-amber-600/10 text-amber-500 border-amber-500/20'
                                : 'bg-red-600/10 text-red-500 border-red-500/20'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Dispatch</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-neutral-500 font-bold uppercase">
              Page {page} of {totalPages} ({filteredOrders.length} entries)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details / Dispatch Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-white border border-border text-foreground max-w-xl rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[95vh] scrollbar-none">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Dispatch Control Panel: Order #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="py-4 space-y-5 text-xs font-semibold text-muted-foreground">
              {/* Customer and Delivery summary */}
              <div className="grid grid-cols-2 gap-4 bg-secondary p-4 rounded-2xl border border-border">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">
                    Recipient Customer
                  </span>
                  <span className="text-foreground font-bold text-sm block">
                    {selectedOrder.user?.name}
                  </span>
                  <span className="text-[10px] block">{selectedOrder.user?.phoneNumber}</span>
                  <span className="text-[10px] block font-sans truncate">
                    {selectedOrder.deliveryAddress}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">
                    Billing Details
                  </span>
                  <span className="text-primary font-bold text-sm block">
                    ₹{selectedOrder.totalAmount}
                  </span>
                  <span className="text-[10px] block uppercase font-bold text-emerald-500">
                    Payment: {selectedOrder.paymentStatus}
                  </span>
                  <span className="text-[10px] block font-sans">
                    Placed: {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">
                  Ordered Basket Items
                </span>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-secondary text-neutral-500 border-b border-border">
                      <tr>
                        <th className="p-2.5">Menu Item</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-foreground">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5">{item.product?.name}</td>
                          <td className="p-2.5 text-muted-foreground">x{item.quantity}</td>
                          <td className="p-2.5 text-right">₹{item.price * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dispatch Timeline status progress */}
              <div className="space-y-3">
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">
                  Status Timeline Actions
                </span>
                <div className="flex gap-2 flex-wrap">
                  {(
                    ['pending', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'] as const
                  ).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateSingleStatus(selectedOrder.id, st)}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] uppercase font-bold cursor-pointer transition-all ${
                        selectedOrder.status === st
                          ? 'bg-primary text-white border-primary shadow'
                          : 'bg-transparent border-border hover:bg-secondary text-muted-foreground'
                      }`}
                    >
                      {st.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Partner Assignment */}
              <div className="space-y-3 p-4 bg-secondary border border-border rounded-2xl">
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">
                  Assign Active Delivery Partner
                </span>
                <div className="flex gap-2 items-center font-sans">
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="flex-1 bg-white border border-border rounded-xl px-3 py-2 text-foreground font-sans outline-none focus:border-primary/50 text-xs"
                  >
                    <option value="">Select a Rider...</option>
                    {deliveryPartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.phone})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssignDelivery(selectedOrder.id)}
                    className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 cursor-pointer shadow"
                  >
                    Assign Rider
                  </button>
                </div>
              </div>

              {/* Danger Zone: Demo Refund */}
              <div className="border-t border-border pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleSimulateRefund(selectedOrder.id)}
                  className="px-3.5 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                  Simulate Cash Refund
                </button>

                <button
                  onClick={() => setDetailsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary border border-border text-muted-foreground hover:bg-neutral-100 cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
