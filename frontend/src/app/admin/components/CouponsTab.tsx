'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Award } from 'lucide-react';
import api from '@/lib/api';
import { Coupon } from './types';
import { useToastStore } from '@/store/toastStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CouponsTab() {
  const { addToast } = useToastStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<Coupon['type']>('percentage');
  const [formValue, setFormValue] = useState(10);
  const [formMinOrder, setFormMinOrder] = useState(0);
  const [formExpiry, setFormExpiry] = useState('');
  const [formLimit, setFormLimit] = useState(100);
  const [formOneTime, setFormOneTime] = useState(false);
  const [formPublic, setFormPublic] = useState(true);
  const [formActive, setFormActive] = useState(true);

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/admin/coupons');
      setCoupons(response.data);
    } catch (err) {
      console.error(err);
      addToast('Could not load coupons registry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormType('percentage');
    setFormValue(15);
    setFormMinOrder(299);
    setFormExpiry('');
    setFormLimit(100);
    setFormOneTime(false);
    setFormPublic(true);
    setFormActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (coup: Coupon) => {
    setEditingCoupon(coup);
    setFormCode(coup.code);
    setFormType(coup.type);
    setFormValue(Number(coup.value));
    setFormMinOrder(Number(coup.minOrder));
    setFormExpiry(coup.expiryDate ? new Date(coup.expiryDate).toISOString().split('T')[0] : '');
    setFormLimit(coup.usageLimit);
    setFormOneTime(coup.isOneTime);
    setFormPublic(coup.isPublic);
    setFormActive(coup.isActive);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      addToast('Coupon code is required.', 'error');
      return;
    }

    setActionLoading(true);
    const payload = {
      code: formCode.trim().toUpperCase(),
      type: formType,
      value: Number(formValue),
      minOrder: Number(formMinOrder),
      expiryDate: formExpiry ? new Date(formExpiry) : undefined,
      usageLimit: Number(formLimit),
      isOneTime: formOneTime,
      isPublic: formPublic,
      isActive: formActive,
    };

    try {
      if (editingCoupon) {
        await api.patch(`/admin/coupons/${editingCoupon.id}`, payload);
        addToast('Promo coupon updated successfully!', 'success');
      } else {
        await api.post('/admin/coupons', payload);
        addToast('New promo voucher code registered!', 'success');
      }
      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      addToast('Coupon save error.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      addToast('Coupon removed.', 'info');
      fetchCoupons();
    } catch (err) {
      console.error(err);
      addToast('Delete failed.', 'error');
    }
  };

  const handleToggleActive = async (coup: Coupon) => {
    try {
      await api.patch(`/admin/coupons/${coup.id}`, { isActive: !coup.isActive });
      addToast(`Coupon ${coup.code} is now ${!coup.isActive ? 'Active' : 'Inactive'}.`, 'success');
      fetchCoupons();
    } catch (err) {
      console.error(err);
      addToast('Failed to toggle active state.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground">Coupon Vouchers</h2>
          <p className="text-xs text-foreground mt-1">
            Configure minimum basket limits, expiry dates, usage constraints, and public toggles.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-red-600 hover:bg-red-700 text-foreground font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
        >
          <Plus className="h-4.5 w-4.5" /> CREATE COUPON
        </button>
      </div>

      {/* List Coupons */}
      <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-neutral-900 max-h-[500px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-semibold text-foreground">
            <thead className="bg-background text-foreground font-bold uppercase tracking-wider sticky top-0 z-10 shadow">
              <tr>
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Voucher Type</th>
                <th className="p-4">Discount Value</th>
                <th className="p-4">Usage stats</th>
                <th className="p-4">Expires</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-foreground font-bold">
                    Loading active vouchers...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-foreground font-bold">
                    No coupons configured in system.
                  </td>
                </tr>
              ) : (
                coupons.map((coup) => (
                  <tr key={coup.id} className="hover:bg-card/20">
                    <td className="p-4 flex items-center gap-2">
                      <Award className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="text-foreground font-mono font-bold block">
                        {coup.code}
                      </span>
                    </td>
                    <td className="p-4 text-foreground capitalize font-bold">{coup.type}</td>
                    <td className="p-4 font-bold text-foreground">
                      {coup.type === 'percentage' ? `${coup.value}% Off` : `₹${coup.value} Off`}
                      <span className="text-[10px] text-foreground block font-semibold">
                        Min Order: ₹{coup.minOrder}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {coup.usedCount} / {coup.usageLimit} uses
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {coup.expiryDate ? new Date(coup.expiryDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleToggleActive(coup)} className="cursor-pointer">
                        {coup.isActive ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-extrabold uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-red-600/10 text-red-500 border border-red-500/20 text-[9px] font-extrabold uppercase">
                            Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(coup)}
                        className="p-2 rounded-lg bg-card border border-neutral-300/50 hover:text-primary transition-colors cursor-pointer inline-flex"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(coup.id)}
                        className="p-2 rounded-lg bg-card border border-neutral-300/50 hover:text-red-500 transition-colors cursor-pointer inline-flex"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border border-border text-foreground max-w-md rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-none">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              {editingCoupon ? (
                <Pencil className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
              {editingCoupon ? 'Edit Coupon Code' : 'Register Coupon Code'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="py-4 space-y-4 text-xs font-semibold text-foreground"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                Promo Coupon Code
              </label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="E.g. FEAST50, HELLO100"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Discount Type
                </label>
                <select
                  value={formType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormType(e.target.value as 'percentage' | 'flat')
                  }
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground focus:border-primary outline-none cursor-pointer font-sans"
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="flat">Flat Value Off</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Value (Cash/%)
                </label>
                <input
                  type="number"
                  value={formValue}
                  onChange={(e) => setFormValue(Number(e.target.value))}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Min Order Cart (INR)
                </label>
                <input
                  type="number"
                  value={formMinOrder}
                  onChange={(e) => setFormMinOrder(Number(e.target.value))}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Usage Limit count
                </label>
                <input
                  type="number"
                  value={formLimit}
                  onChange={(e) => setFormLimit(Number(e.target.value))}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Voucher Expiry Date
                </label>
                <input
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground outline-none font-sans text-xs"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-center pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                    One-time Coupon
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormOneTime(!formOneTime)}
                    className="text-foreground hover:text-primary"
                  >
                    {formOneTime ? (
                      <ToggleRight className="h-8 w-8 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Public Coupon
                </span>
                <button
                  type="button"
                  onClick={() => setFormPublic(!formPublic)}
                  className="text-foreground hover:text-primary"
                >
                  {formPublic ? (
                    <ToggleRight className="h-8 w-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-foreground" />
                  )}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Active Coupon
                </span>
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className="text-foreground hover:text-primary"
                >
                  {formActive ? (
                    <ToggleRight className="h-8 w-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="bg-transparent border border-border text-foreground hover:bg-secondary rounded-xl py-2 px-4 cursor-pointer text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-primary hover:bg-primary/95 text-foreground font-bold rounded-xl py-2 px-6 shadow cursor-pointer text-xs flex items-center gap-1"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SAVE CHANGES'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
