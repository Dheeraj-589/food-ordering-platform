import { create } from 'zustand';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, specialInstructions?: string) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  initialize: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, quantity = 1, specialInstructions = '') => {
    const currentItems = [...get().items];
    const existingIndex = currentItems.findIndex(
      (item) => item.product.id === product.id && item.specialInstructions === specialInstructions,
    );

    if (existingIndex > -1) {
      currentItems[existingIndex].quantity += quantity;
    } else {
      currentItems.push({ product, quantity, specialInstructions });
    }

    localStorage.setItem('cart_items', JSON.stringify(currentItems));
    set({ items: currentItems });
  },

  removeItem: (productId) => {
    const filteredItems = get().items.filter((item) => item.product.id !== productId);
    localStorage.setItem('cart_items', JSON.stringify(filteredItems));
    set({ items: filteredItems });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const updatedItems = get().items.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item,
    );
    localStorage.setItem('cart_items', JSON.stringify(updatedItems));
    set({ items: updatedItems });
  },

  clearCart: () => {
    localStorage.removeItem('cart_items');
    set({ items: [] });
  },

  getCartTotal: () => {
    return get().items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  },

  getCartItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  initialize: () => {
    if (typeof window === 'undefined') return;
    try {
      const savedItems = localStorage.getItem('cart_items');
      if (savedItems) {
        set({ items: JSON.parse(savedItems) as CartItem[] });
      }
    } catch (e) {
      console.error('Error restoring shopping cart state:', e);
    }
  },
}));
