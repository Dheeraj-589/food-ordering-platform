import { create } from 'zustand';
import { CartItem, CartItemCustomization, Product } from '@/types';

export const getItemUnitPrice = (
  product: Product,
  customization?: CartItemCustomization,
): number => {
  let price = Number(product.price);
  if (!customization) return price;

  // Size adjustment
  if (product.category === 'pizza' && customization.size && product.variants) {
    const variant = product.variants.find((v) => v.size === customization.size);
    if (variant) {
      price = Number(variant.price);
    }
  }

  // Extra cheese
  if (customization.extraCheese) {
    price += 75;
  }

  // Extra toppings
  if (customization.extraToppings && product.extraToppings) {
    customization.extraToppings.forEach((topName) => {
      const topping = product.extraToppings?.find((t) => t.name === topName);
      if (topping) {
        price += Number(topping.price);
      }
    });
  }

  return price;
};

interface CartState {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    customization?: CartItemCustomization,
    specialInstructions?: string,
  ) => void;
  removeItem: (productId: number, customization?: CartItemCustomization) => void;
  updateQuantity: (
    productId: number,
    quantity: number,
    customization?: CartItemCustomization,
  ) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  initialize: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, quantity = 1, customization, specialInstructions = '') => {
    const currentItems = [...get().items];
    const existingIndex = currentItems.findIndex(
      (item) =>
        item.product.id === product.id &&
        JSON.stringify(item.customization) === JSON.stringify(customization),
    );

    if (existingIndex > -1) {
      currentItems[existingIndex].quantity += quantity;
    } else {
      currentItems.push({ product, quantity, customization, specialInstructions });
    }

    localStorage.setItem('cart_items', JSON.stringify(currentItems));
    set({ items: currentItems });
  },

  removeItem: (productId, customization) => {
    const filteredItems = get().items.filter(
      (item) =>
        !(
          item.product.id === productId &&
          JSON.stringify(item.customization) === JSON.stringify(customization)
        ),
    );
    localStorage.setItem('cart_items', JSON.stringify(filteredItems));
    set({ items: filteredItems });
  },

  updateQuantity: (productId, quantity, customization) => {
    if (quantity <= 0) {
      get().removeItem(productId, customization);
      return;
    }
    const updatedItems = get().items.map((item) =>
      item.product.id === productId &&
      JSON.stringify(item.customization) === JSON.stringify(customization)
        ? { ...item, quantity }
        : item,
    );
    localStorage.setItem('cart_items', JSON.stringify(updatedItems));
    set({ items: updatedItems });
  },

  clearCart: () => {
    localStorage.removeItem('cart_items');
    set({ items: [] });
  },

  getCartTotal: () => {
    return get().items.reduce(
      (sum, item) => sum + getItemUnitPrice(item.product, item.customization) * item.quantity,
      0,
    );
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
