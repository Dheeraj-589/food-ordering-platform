'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Sparkles,
  FolderOpen,
  Image,
  ShieldAlert,
  Check,
} from 'lucide-react';
import api from '@/lib/api';
import { Product, ProductCategory } from '@/types';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getProductImage } from '@/lib/utils';

interface ProductsTabProps {
  products: Product[];
  fetchProducts: () => void;
  searchTerm: string;
}

export default function ProductsTab({ products, fetchProducts, searchTerm }: ProductsTabProps) {
  const { addToast } = useToastStore();
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formImageUrl, setFormImageUrl] = useState('/images/products/margherita.jpg');
  const [formCategory, setFormCategory] = useState<ProductCategory>('pizza');
  const [formAvailable, setFormAvailable] = useState(true);

  // Validation States
  const [formNameError, setFormNameError] = useState('');
  const [formPriceError, setFormPriceError] = useState('');

  // Custom attributes configuration
  const [formSizes, setFormSizes] = useState<string>('Regular,Medium,Large');
  const [formCrusts, setFormCrusts] = useState<string>(
    'Classic Hand Tossed,Thin Crust,Cheese Burst',
  );
  const [formToppings, setFormToppings] = useState<string>(
    'Extra Cheese:75,Mushroom:45,Jalapenos:45,Paneer Chunks:60',
  );

  // File Upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormPrice(250);
    setFormImageUrl('/images/products/margherita.jpg');
    setFormCategory('pizza');
    setFormAvailable(true);
    setFormSizes('Regular,Medium,Large');
    setFormCrusts('Classic Hand Tossed,Thin Crust,Cheese Burst');
    setFormToppings('Extra Cheese:75,Mushroom:45,Jalapenos:45,Paneer Chunks:60');
    setFormNameError('');
    setFormPriceError('');
    setProductModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormPrice(Number(product.price));
    setFormImageUrl(product.imageUrl || '/images/products/margherita.jpg');
    setFormCategory(product.category);
    setFormAvailable(product.isAvailable);

    if (product.variants) {
      setFormSizes(product.variants.map((v) => v.size).join(','));
    } else {
      setFormSizes('Regular,Medium,Large');
    }

    if (product.crusts) {
      setFormCrusts(product.crusts.join(','));
    } else {
      setFormCrusts('Classic Hand Tossed,Thin Crust,Cheese Burst');
    }

    if (product.extraToppings) {
      setFormToppings(
        product.extraToppings
          .map((t: { name: string; price: number }) => `${t.name}:${t.price}`)
          .join(','),
      );
    } else {
      setFormToppings('Extra Cheese:75,Mushroom:45,Jalapenos:45,Paneer Chunks:60');
    }

    setFormNameError('');
    setFormPriceError('');
    setProductModalOpen(true);
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
      addToast('Image uploaded successfully and mapped!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Image upload failed. Servicing static path fallback.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;
    if (!formName.trim()) {
      setFormNameError('Item title is required.');
      isValid = false;
    } else {
      setFormNameError('');
    }

    if (Number(formPrice) <= 0) {
      setFormPriceError('Price must be a positive number.');
      isValid = false;
    } else {
      setFormPriceError('');
    }

    if (!isValid) return;

    setActionLoading(true);

    // Parse pizza variants, crusts, toppings
    let variants = undefined;
    let crusts = undefined;
    let extraToppings = undefined;

    if (formCategory === 'pizza') {
      variants = formSizes.split(',').map((size) => {
        let priceOffset = 0;
        if (size.trim() === 'Medium') priceOffset = 150;
        if (size.trim() === 'Large') priceOffset = 300;
        return { size: size.trim(), price: Number(formPrice) + priceOffset };
      });
      crusts = formCrusts.split(',').map((c) => c.trim());
      extraToppings = formToppings.split(',').map((t) => {
        const parts = t.split(':');
        return { name: parts[0].trim(), price: Number(parts[1] || 0) };
      });
    }

    const payload: Partial<Product> = {
      name: formName.trim(),
      description: formDescription.trim(),
      price: Number(formPrice),
      imageUrl: formImageUrl.trim(),
      category: formCategory,
      isAvailable: formAvailable,
      variants,
      crusts,
      extraToppings,
    };

    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
        addToast('Catalog item updated successfully!', 'success');
      } else {
        await api.post('/products', payload);
        addToast('New catalog item created!', 'success');
      }
      setProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      addToast('Could not save product option.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/products/${productId}`);
      addToast('Menu item deleted.', 'info');
      fetchProducts();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete item.', 'error');
    }
  };

  const handleToggleAvailable = async (product: Product) => {
    try {
      await api.patch(`/products/${product.id}`, { isAvailable: !product.isAvailable });
      addToast(
        `${product.name} set to ${!product.isAvailable ? 'Available' : 'Unavailable'}.`,
        'success',
      );
      fetchProducts();
    } catch (err) {
      console.error(err);
      addToast('Failed to toggle status.', 'error');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.category !== 'combos' &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100">Product Management</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Configure pricing parameters, size-price variations, ingredients lists, and media files.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4.5 w-4.5" /> ADD NEW ITEM
        </button>
      </div>

      {/* Grid Table list */}
      <div className="p-6 rounded-3xl bg-neutral-900/20 border border-neutral-900/60 shadow-lg space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-neutral-900 max-h-[550px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-semibold text-neutral-400">
            <thead className="bg-neutral-950 text-neutral-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow">
              <tr>
                <th className="p-4">Item Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Base Price</th>
                <th className="p-4">Variants/Sizes</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-900/20">
                  <td className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={getProductImage(product.imageUrl, product.category, product.name)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-neutral-200 font-bold truncate max-w-xs">
                      {product.name}
                    </span>
                  </td>
                  <td className="p-4 uppercase text-[10px] text-neutral-500 font-bold">
                    {product.category}
                  </td>
                  <td className="p-4 font-bold text-neutral-300">₹{product.price}</td>
                  <td className="p-4 font-semibold text-neutral-500">
                    {product.variants ? product.variants.map((v) => v.size).join(', ') : 'Standard'}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleAvailable(product)}
                      className="cursor-pointer"
                    >
                      {product.isAvailable ? (
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
                      onClick={() => handleOpenEdit(product)}
                      className="p-2 rounded-lg bg-neutral-900 border border-neutral-850 hover:text-white transition-colors cursor-pointer inline-flex"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
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
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="bg-white border border-border text-foreground max-w-xl rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-none">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              {editingProduct ? (
                <Pencil className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
              {editingProduct ? `Edit Catalog Option` : 'Add Catalog Option'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="py-4 space-y-4 text-xs font-semibold text-muted-foreground"
          >
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                Item Title
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (e.target.value.trim()) setFormNameError('');
                }}
                placeholder="E.g. Margherita Classic Sourdough"
                className={`w-full bg-secondary border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans ${formNameError ? 'border-red-500' : 'border-border'}`}
              />
              {formNameError && (
                <span className="text-[10px] text-red-500 font-bold">{formNameError}</span>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                Description
              </label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Explain food items profiles..."
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground focus:border-primary outline-none cursor-pointer font-sans"
                >
                  <option value="pizza">Pizzas</option>
                  <option value="pasta">Pasta</option>
                  <option value="sides">Sides</option>
                  <option value="desserts">Desserts</option>
                  <option value="drinks">Drinks</option>
                </select>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                  Base Price (INR)
                </label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => {
                    setFormPrice(Number(e.target.value));
                    if (Number(e.target.value) > 0) setFormPriceError('');
                  }}
                  placeholder="Base margin price"
                  className={`w-full bg-secondary border rounded-xl px-4 py-2.5 text-foreground outline-none focus:border-primary/50 font-sans ${formPriceError ? 'border-red-500' : 'border-border'}`}
                />
                {formPriceError && (
                  <span className="text-[10px] text-red-500 font-bold">{formPriceError}</span>
                )}
              </div>
            </div>

            {/* Image Path and Loader */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">
                Menu Card Image
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Local fallback or upload URL"
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 font-sans"
                />

                <div className="relative">
                  <input
                    type="file"
                    id="product-image-upload"
                    className="hidden"
                    onChange={handleUploadImage}
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="cursor-pointer bg-primary text-white font-bold px-4 py-2.5 rounded-xl border border-primary/20 flex items-center gap-1.5 hover:bg-primary/95 text-xs shadow"
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
            </div>

            {/* Pizza Specific attributes fields */}
            {formCategory === 'pizza' && (
              <div className="p-4 rounded-2xl bg-secondary border border-border space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Sizes (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={formSizes}
                      onChange={(e) => setFormSizes(e.target.value)}
                      className="w-full bg-white border border-border rounded-xl px-3 py-2 text-foreground outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Crusts (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={formCrusts}
                      onChange={(e) => setFormCrusts(e.target.value)}
                      className="w-full bg-white border border-border rounded-xl px-3 py-2 text-foreground outline-none font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Extra Toppings & Price (Format: Name:Price, Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formToppings}
                    onChange={(e) => setFormToppings(e.target.value)}
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-foreground outline-none font-sans"
                  />
                </div>
              </div>
            )}

            {/* Toggle Availability */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                Available in Catalog
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
                onClick={() => setProductModalOpen(false)}
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
