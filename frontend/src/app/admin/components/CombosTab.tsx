'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Minus } from 'lucide-react';
import api from '@/lib/api';
import { Product, ComboSlot, ProductCategory } from '@/types';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getProductImage } from '@/lib/utils';

interface CombosTabProps {
  products: Product[];
  fetchProducts: () => void;
  searchTerm: string;
}

export default function CombosTab({ products, fetchProducts, searchTerm }: CombosTabProps) {
  const { addToast } = useToastStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(499);
  const [formImageUrl, setFormImageUrl] = useState('/images/products/combo-1.jpg');
  const [formAvailable, setFormAvailable] = useState(true);

  // Slots adjuster
  const [comboSlotsCount, setComboSlotsCount] = useState(3);
  const [comboSlots, setComboSlots] = useState<{ name: string; category: string }[]>([
    { name: 'Select Pizza', category: 'pizza' },
    { name: 'Select Side', category: 'sides' },
    { name: 'Select Drink', category: 'drinks' },
  ]);

  const handleOpenCreate = () => {
    setEditingCombo(null);
    setFormName('');
    setFormDescription('');
    setFormPrice(499);
    setFormImageUrl('/images/products/combo-1.jpg');
    setFormAvailable(true);
    setComboSlotsCount(3);
    setComboSlots([
      { name: 'Select Pizza', category: 'pizza' },
      { name: 'Select Side', category: 'sides' },
      { name: 'Select Drink', category: 'drinks' },
    ]);
    setModalOpen(true);
  };

  const handleOpenEdit = (combo: Product) => {
    setEditingCombo(combo);
    setFormName(combo.name);
    setFormDescription(combo.description || '');
    setFormPrice(Number(combo.price));
    setFormImageUrl(combo.imageUrl || '/images/products/combo-1.jpg');
    setFormAvailable(combo.isAvailable);

    if (combo.comboItems) {
      setComboSlots(combo.comboItems.map((s) => ({ name: s.name, category: s.category })));
      setComboSlotsCount(combo.comboItems.length);
    }
    setModalOpen(true);
  };

  const handleAdjustSlotsCount = (newCount: number) => {
    if (newCount < 1 || newCount > 8) return;
    setComboSlotsCount(newCount);
    setComboSlots((prev) => {
      const copy = [...prev];
      if (copy.length < newCount) {
        while (copy.length < newCount) {
          copy.push({ name: `Select Item ${copy.length + 1}`, category: 'pizza' });
        }
      } else if (copy.length > newCount) {
        copy.splice(newCount);
      }
      return copy;
    });
  };

  const handleUpdateComboSlot = (index: number, field: 'name' | 'category', value: string) => {
    setComboSlots((prev) => prev.map((s, idx) => (idx === index ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('Combo title is required.', 'error');
      return;
    }

    setActionLoading(true);

    const comboItems = comboSlots.map((s, idx) => ({
      slotId: idx + 1,
      name: s.name,
      category: s.category,
    }));

    const payload: Partial<Product> = {
      name: formName.trim(),
      description: formDescription.trim(),
      price: Number(formPrice),
      imageUrl: formImageUrl.trim(),
      category: 'combos',
      isAvailable: formAvailable,
      comboItems,
    };

    try {
      if (editingCombo) {
        await api.patch(`/products/${editingCombo.id}`, payload);
        addToast('Combo set updated successfully!', 'success');
      } else {
        await api.post('/products', payload);
        addToast('New combo package registered!', 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      addToast('Failed to save combo package.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this combo package?')) return;
    try {
      await api.delete(`/products/${id}`);
      addToast('Combo deleted.', 'info');
      fetchProducts();
    } catch (err) {
      console.error(err);
      addToast('Delete failed.', 'error');
    }
  };

  const handleToggleAvailable = async (combo: Product) => {
    try {
      await api.patch(`/products/${combo.id}`, { isAvailable: !combo.isAvailable });
      addToast(
        `Combo ${combo.name} availability set to ${!combo.isAvailable ? 'Available' : 'Unavailable'}.`,
        'success',
      );
      fetchProducts();
    } catch (err) {
      console.error(err);
      addToast('Toggle failed.', 'error');
    }
  };

  const filteredCombos = products.filter(
    (p) => p.category === 'combos' && p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-neutral-100">Combo Set Management</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Configure slot constraints, multi-category bundles, and combo pricing tags.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
        >
          <Plus className="h-4.5 w-4.5" /> ADD NEW COMBO
        </button>
      </div>

      {/* Grid list table */}
      <div className="p-6 rounded-3xl bg-neutral-900/20 border border-neutral-900/60 shadow-lg space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-neutral-900 max-h-[550px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-semibold text-neutral-400">
            <thead className="bg-neutral-950 text-neutral-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow">
              <tr>
                <th className="p-4">Combo Name</th>
                <th className="p-4">Configured Slots</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filteredCombos.map((combo) => (
                <tr key={combo.id} className="hover:bg-neutral-900/20">
                  <td className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={getProductImage(combo.imageUrl, combo.category, combo.name)}
                        alt={combo.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-neutral-200 font-bold truncate max-w-xs">
                      {combo.name}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-300 font-bold">
                    {combo.comboItems?.length || 0} Slots (
                    {combo.comboItems?.map((s) => s.category).join(' + ')})
                  </td>
                  <td className="p-4 font-bold text-neutral-300">₹{combo.price}</td>
                  <td className="p-4">
                    <button onClick={() => handleToggleAvailable(combo)} className="cursor-pointer">
                      {combo.isAvailable ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-extrabold uppercase">
                          Available
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-600/10 text-red-500 border border-red-500/20 text-[9px] font-extrabold uppercase">
                          Unavailable
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(combo)}
                      className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 hover:text-white transition-colors cursor-pointer inline-flex"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(combo.id)}
                      className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 hover:text-red-500 transition-colors cursor-pointer inline-flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border border-border text-foreground max-w-xl rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-none">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              {editingCombo ? (
                <Pencil className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
              {editingCombo ? `Configure Combo Slots: ${editingCombo.name}` : 'Create Combo Bundle'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="py-4 space-y-4 text-xs font-semibold text-muted-foreground"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                Combo Package Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="E.g. Double Delight Combo Pack"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                Explain Combos Offer Details
              </label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Details of what items are included in this bundle..."
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                  Bundle Price (INR)
                </label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                  Combo Image Url
                </label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>
            </div>

            {/* Slots Configurator */}
            <div className="p-4 rounded-2xl bg-secondary border border-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Bundle Slots Count ({comboSlotsCount})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustSlotsCount(comboSlotsCount - 1)}
                    className="p-1 rounded bg-white text-muted-foreground hover:text-foreground border border-border cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] font-bold text-foreground w-4 text-center">
                    {comboSlotsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustSlotsCount(comboSlotsCount + 1)}
                    className="p-1 rounded bg-white text-muted-foreground hover:text-foreground border border-border cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {comboSlots.map((slot, idx) => (
                  <div key={idx} className="flex gap-2 items-center font-sans">
                    <input
                      type="text"
                      value={slot.name}
                      onChange={(e) => handleUpdateComboSlot(idx, 'name', e.target.value)}
                      placeholder={`Slot ${idx + 1} Name`}
                      className="flex-1 bg-white border border-border rounded-xl px-3 py-1.5 text-foreground outline-none text-xs"
                    />
                    <select
                      value={slot.category}
                      onChange={(e) => handleUpdateComboSlot(idx, 'category', e.target.value)}
                      className="bg-white border border-border rounded-xl px-3 py-1.5 text-foreground outline-none cursor-pointer text-xs font-sans"
                    >
                      <option value="pizza">Pizzas</option>
                      <option value="pasta">Pasta</option>
                      <option value="sides">Sides</option>
                      <option value="desserts">Desserts</option>
                      <option value="drinks">Drinks</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                Active Combo Bundle
              </span>
              <button
                type="button"
                onClick={() => setFormAvailable(!formAvailable)}
                className="text-neutral-300 hover:text-white"
              >
                {formAvailable ? (
                  <ToggleRight className="h-8 w-8 text-emerald-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-neutral-400" />
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="bg-transparent border-border text-muted-foreground hover:bg-secondary rounded-xl py-2 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl py-2 px-6 shadow cursor-pointer"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SAVE CHANGES'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
