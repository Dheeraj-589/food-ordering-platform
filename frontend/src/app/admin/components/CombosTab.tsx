'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Minus, Image } from 'lucide-react';
import { Select } from 'antd';
import api from '@/lib/api';
import { Product, ComboSlot } from '@/types';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getProductImage } from '@/lib/utils';

interface CombosTabProps {
  products: Product[];
  fetchProducts: () => void;
  searchTerm: string;
}

interface ComboSlotFormItem {
  slotId: number;
  name: string;
  category: string;
  productId: number | null;
  selectedVariant: string | null;
  searchText: string;
}

const createComboSlotState = (slotId: number): ComboSlotFormItem => ({
  slotId,
  name: '',
  category: '',
  productId: null,
  selectedVariant: null,
  searchText: '',
});

const formatCategoryLabel = (category: string) =>
  category.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export default function CombosTab({ products, fetchProducts, searchTerm }: CombosTabProps) {
  const { addToast } = useToastStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(499);
  const [formImageUrl, setFormImageUrl] = useState('/images/products/combo-1.jpg');
  const [formAvailable, setFormAvailable] = useState(true);

  // Slots adjuster
  const [comboSlotsCount, setComboSlotsCount] = useState(3);
  const [comboSlots, setComboSlots] = useState<ComboSlotFormItem[]>([
    createComboSlotState(1),
    createComboSlotState(2),
    createComboSlotState(3),
  ]);

  const productGroups = useMemo(() => {
    const availableProducts = products.filter((product) => product.category !== 'combos');
    const grouped = availableProducts.reduce<Record<string, Product[]>>((acc, product) => {
      const key = product.category || 'other';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(product);
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      label: formatCategoryLabel(category),
      products: items.sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [products]);

  const selectOptions = useMemo(
    () =>
      productGroups.map((group) => ({
        label: group.label,
        options: group.products.map((product) => ({
          value: product.id,
          label: product.name,
          imageUrl: getProductImage(product.imageUrl, product.category, product.name),
        })),
      })),
    [productGroups],
  );

  const resolveSlotSelection = (slot: ComboSlot, index: number) => {
    const byProductId = products.find((product) => product.id === slot.productId);
    const byDefaultProduct = products.find(
      (product) => product.name === slot.defaultProduct || product.name === slot.name,
    );
    const byCategoryAndVariant = products.find((product) => {
      if (product.category !== slot.category) return false;
      const targetVariant = slot.selectedVariant || slot.size;
      if (!targetVariant) return false;
      return product.variants?.some((variant) => variant.size === targetVariant);
    });

    const matchedProduct = byProductId || byDefaultProduct || byCategoryAndVariant || null;

    return {
      slotId: slot.slotId || index + 1,
      name: matchedProduct?.name || slot.name || '',
      category: matchedProduct?.category || slot.category || '',
      productId: matchedProduct?.id ?? slot.productId ?? null,
      selectedVariant: slot.selectedVariant || slot.size || matchedProduct?.variants?.[0]?.size || null,
      searchText: matchedProduct?.name || slot.defaultProduct || slot.name || '',
    };
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/admin/media/upload?folder=products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormImageUrl(response.data.url);
      addToast('Combo image uploaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Image upload failed.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenCreate = () => {
    void fetchProducts();
    setEditingCombo(null);
    setFormName('');
    setFormDescription('');
    setFormPrice(499);
    setFormImageUrl('/images/products/combo-1.jpg');
    setFormAvailable(true);
    setComboSlotsCount(3);
    setComboSlots([createComboSlotState(1), createComboSlotState(2), createComboSlotState(3)]);
    setValidationError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (combo: Product) => {
    void fetchProducts();
    setEditingCombo(combo);
    setFormName(combo.name);
    setFormDescription(combo.description || '');
    setFormPrice(Number(combo.price));
    setFormImageUrl(combo.imageUrl || '/images/products/combo-1.jpg');
    setFormAvailable(combo.isAvailable);

    if (combo.comboItems?.length) {
      setComboSlots(combo.comboItems.map((slot, index) => resolveSlotSelection(slot, index)));
      setComboSlotsCount(combo.comboItems.length);
    } else {
      setComboSlots([createComboSlotState(1)]);
      setComboSlotsCount(1);
    }
    setValidationError(null);
    setModalOpen(true);
  };

  const handleAdjustSlotsCount = (newCount: number) => {
    if (newCount < 1 || newCount > 8) return;
    setComboSlotsCount(newCount);
    setComboSlots((prev) => {
      const copy = [...prev];
      if (copy.length < newCount) {
        while (copy.length < newCount) {
          copy.push(createComboSlotState(copy.length + 1));
        }
      } else if (copy.length > newCount) {
        copy.splice(newCount);
      }
      return copy;
    });
  };

  const handleSelectSlotProduct = (index: number, product: Product) => {
    setComboSlots((prev) =>
      prev.map((slot, idx) =>
        idx === index
          ? {
            ...slot,
            name: product.name,
            category: product.category,
            productId: product.id,
            selectedVariant: product.variants?.[0]?.size || null,
            searchText: product.name,
          }
          : slot,
      ),
    );
    setValidationError(null);
  };

  const handleSelectSlotVariant = (index: number, value: string) => {
    setComboSlots((prev) => prev.map((slot, idx) => (idx === index ? { ...slot, selectedVariant: value } : slot)));
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('Combo title is required.', 'error');
      return;
    }

    const hasMissingSelections = comboSlots.some((slot) => {
      const selectedProduct = products.find((product) => product.id === slot.productId);
      if (!selectedProduct) return true;
      if (selectedProduct.variants?.length && !slot.selectedVariant) return true;
      return false;
    });

    if (hasMissingSelections) {
      const message = 'Please select a product for every combo slot and choose a size when a product has variants.';
      setValidationError(message);
      addToast(message, 'error');
      return;
    }

    setValidationError(null);
    setActionLoading(true);

    const comboItems = comboSlots.map((slot, idx) => {
      const selectedProduct = products.find((product) => product.id === slot.productId);

      return {
        slotId: slot.slotId || idx + 1,
        name: selectedProduct?.name || slot.searchText || slot.name,
        category: selectedProduct?.category || slot.category,
        productId: selectedProduct?.id || slot.productId || undefined,
        selectedVariant: slot.selectedVariant || undefined,
      } as ComboSlot;
    });

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
          <h2 className="text-xl font-bold text-foreground">Combo Set Management</h2>
          <p className="text-xs text-foreground mt-1">
            Configure slot constraints, multi-category bundles, and combo pricing tags.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-red-600 hover:bg-red-700 text-foreground font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
        >
          <Plus className="h-4.5 w-4.5" /> ADD NEW COMBO
        </button>
      </div>

      {/* Grid list table */}
      <div className="p-6 rounded-3xl bg-card/20 border border-neutral-900/60 shadow-lg space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-neutral-900 max-h-[550px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-semibold text-foreground">
            <thead className="bg-background text-foreground font-bold uppercase tracking-wider sticky top-0 z-10 shadow">
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
                <tr key={combo.id} className="hover:bg-card/20">
                  <td className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 bg-background border border-neutral-800 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={getProductImage(combo.imageUrl, combo.category, combo.name)}
                        alt={combo.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-foreground font-bold truncate max-w-xs">
                      {combo.name}
                    </span>
                  </td>
                  <td className="p-4 text-foreground font-bold">
                    {combo.comboItems?.length || 0} Slots (
                    {combo.comboItems?.map((s) => s.category).join(' + ')})
                  </td>
                  <td className="p-4 font-bold text-foreground">₹{combo.price}</td>
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
                      className="p-2 rounded-lg bg-card border border-neutral-300/50 hover:text-primary transition-colors cursor-pointer inline-flex"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(combo.id)}
                      className="p-2 rounded-lg bg-card border border-neutral-300/50 hover:text-red-500 transition-colors cursor-pointer inline-flex"
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
            className="py-4 space-y-4 text-xs font-semibold text-foreground"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
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
              <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
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
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
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
                <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                  Combo Image
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-primary/50 font-sans"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      id="combo-image-upload"
                      className="hidden"
                      onChange={handleUploadImage}
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="combo-image-upload"
                      className="cursor-pointer bg-primary text-foreground font-bold px-3 py-2.5 rounded-xl border border-primary/20 flex items-center gap-1.5 hover:bg-primary/95 text-xs shadow"
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Image className="h-4 w-4" />
                      )}
                      <span>Upload</span>
                    </label>
                  </div>
                </div>
                {formImageUrl ? (
                  <a
                    href={formImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border bg-white p-2 text-[11px] text-foreground hover:text-primary"
                  >
                    <img
                      src={formImageUrl}
                      alt="Combo preview"
                      className="h-12 w-12 rounded-lg object-cover border border-border"
                    />
                    <span className="font-semibold">Preview image • click to open</span>
                  </a>
                ) : null}
              </div>
            </div>

            {/* Slots Configurator */}
            <div className="p-4 rounded-2xl bg-secondary border border-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-foreground uppercase tracking-wider block">
                  Bundle Slots Count ({comboSlotsCount})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustSlotsCount(comboSlotsCount - 1)}
                    className="p-1 rounded bg-white text-foreground hover:text-primary border border-border cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] font-bold text-foreground w-4 text-center">
                    {comboSlotsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustSlotsCount(comboSlotsCount + 1)}
                    className="p-1 rounded bg-white text-foreground hover:text-primary border border-border cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {comboSlots.map((slot, idx) => {
                  const selectedProduct = products.find((product) => product.id === slot.productId) || null;
                  const hasVariants = Boolean(selectedProduct?.variants?.length);
                  const selectedVariantValue = slot.selectedVariant || selectedProduct?.variants?.[0]?.size || '';

                  return (
                    <div key={slot.slotId || idx} className="flex flex-col gap-2 font-sans">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                          Select Product
                        </label>

                        <Select
                          value={slot.productId ?? undefined}
                          placeholder="Select a product"
                          className="w-full"
                          size="large"
                          options={selectOptions}
                          getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
                          onChange={(value: number) => {
                            const matchedProduct = products.find(
                              (product) => product.id === value
                            );

                            if (matchedProduct) {
                              handleSelectSlotProduct(idx, matchedProduct);
                            }
                          }}
                          optionRender={(option) => (
                            <div className="flex items-center gap-2">
                              <img
                                src={option.data.imageUrl}
                                alt={String(option.label)}
                                className="h-8 w-8 rounded object-cover border border-border"
                              />
                              <span>{option.label}</span>
                            </div>
                          )}
                        />
                      </div>

                      {selectedProduct ? (
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
                          <img
                            src={getProductImage(selectedProduct.imageUrl, selectedProduct.category, selectedProduct.name)}
                            alt={selectedProduct.name}
                            className="h-14 w-14 rounded-lg object-cover border border-border"
                          />
                          <div>
                            <div className="font-semibold text-foreground">{selectedProduct.name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-foreground/70">
                              Category : {formatCategoryLabel(selectedProduct.category)}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {hasVariants && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block">
                            Size
                          </label>
                          <select
                            value={selectedVariantValue}
                            onChange={(e) => handleSelectSlotVariant(idx, e.target.value)}
                            className="w-full bg-white border border-border rounded-xl px-3 py-1.5 text-foreground outline-none cursor-pointer text-xs font-sans"
                          >
                            <option value="">Select Size</option>
                            {selectedProduct?.variants?.map((variant) => (
                              <option key={variant.size} value={variant.size}>
                                {variant.size}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
                {validationError ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-600">
                    {validationError}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                Active Combo Bundle
              </span>
              <button
                type="button"
                onClick={() => setFormAvailable(!formAvailable)}
                className="text-foreground hover:text-primary"
              >
                {formAvailable ? (
                  <ToggleRight className="h-8 w-8 text-emerald-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-foreground" />
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="bg-transparent border-border text-foreground hover:bg-secondary rounded-xl py-2 px-4 cursor-pointer"
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
