'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, ArrowUpDown } from 'lucide-react';
import api from '@/lib/api';
import { Category } from './types';
import { useToastStore } from '@/store/toastStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getProductImage } from '@/lib/utils';

export default function CategoriesTab() {
  const { addToast } = useToastStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('/images/categories/pizza.jpg');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data);
    } catch (err) {
      console.error(err);
      addToast('Could not load categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDisplayName('');
    setFormImageUrl('/images/categories/pizza.jpg');
    setFormSortOrder(categories.length + 1);
    setFormActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDisplayName(cat.displayName);
    setFormImageUrl(cat.imageUrl || '/images/categories/pizza.jpg');
    setFormSortOrder(cat.sortOrder);
    setFormActive(cat.isActive);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDisplayName.trim()) {
      addToast('Please enter Category Key and Display Name.', 'error');
      return;
    }

    setActionLoading(true);
    const payload = {
      name: formName.trim().toLowerCase(),
      displayName: formDisplayName.trim(),
      imageUrl: formImageUrl.trim(),
      sortOrder: Number(formSortOrder),
      isActive: formActive,
    };

    try {
      if (editingCategory) {
        await api.patch(`/admin/categories/${editingCategory.id}`, payload);
        addToast('Category modified successfully!', 'success');
      } else {
        await api.post('/admin/categories', payload);
        addToast('New category registered!', 'success');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      addToast('Category save failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      addToast('Category removed.', 'info');
      fetchCategories();
    } catch (err) {
      console.error(err);
      addToast('Delete failed.', 'error');
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await api.patch(`/admin/categories/${cat.id}`, { isActive: !cat.isActive });
      addToast(`Category ${cat.displayName} ${!cat.isActive ? 'Enabled' : 'Disabled'}.`, 'success');
      fetchCategories();
    } catch (err) {
      console.error(err);
      addToast('Toggle state failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-neutral-100">Category Management</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Configure layout categories sorting, image banners, and toggle statuses.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
        >
          <Plus className="h-4.5 w-4.5" /> ADD CATEGORY
        </button>
      </div>

      {/* List Categories */}
      <div className="p-6 rounded-3xl bg-neutral-900/20 border border-neutral-900/60 shadow-lg space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-neutral-900 max-h-[500px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-semibold text-neutral-400">
            <thead className="bg-neutral-950 text-neutral-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow">
              <tr>
                <th className="p-4">Sort Order</th>
                <th className="p-4">Category Key</th>
                <th className="p-4">Display Name</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">
                    Loading categories registry...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500 font-bold">
                    No categories seeded.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-neutral-900/20">
                    <td className="p-4 font-bold text-neutral-300">#{cat.sortOrder}</td>
                    <td className="p-4 text-neutral-400 font-mono font-bold">{cat.name}</td>
                    <td className="p-4 flex items-center gap-3">
                      <div className="h-8 w-8 bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={getProductImage(cat.imageUrl, cat.name, cat.displayName)}
                          alt={cat.displayName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="text-neutral-200 font-bold">{cat.displayName}</span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleToggleActive(cat)} className="cursor-pointer">
                        {cat.isActive ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-extrabold uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-red-600/10 text-red-500 border border-red-500/20 text-[9px] font-extrabold uppercase">
                            Disabled
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 hover:text-white transition-colors cursor-pointer inline-flex"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 hover:text-red-500 transition-colors cursor-pointer inline-flex"
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
              {editingCategory ? (
                <Pencil className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="py-4 space-y-4 text-xs font-semibold text-muted-foreground"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                Category Key (URL identifier)
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="E.g. pasta, desserts, sides"
                disabled={!!editingCategory}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                Display Name
              </label>
              <input
                type="text"
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                placeholder="E.g. Gourmet Pasta"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-primary/50 font-sans"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                    Is Active
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormActive(!formActive)}
                    className="text-neutral-300 hover:text-white"
                  >
                    {formActive ? (
                      <ToggleRight className="h-8 w-8 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                Image Banner Path
              </label>
              <input
                type="text"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="/images/categories/category-item.jpg"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans"
              />
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="bg-transparent border border-border text-muted-foreground hover:bg-secondary rounded-xl py-2 px-4 cursor-pointer text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl py-2 px-6 shadow cursor-pointer text-xs flex items-center gap-1"
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
