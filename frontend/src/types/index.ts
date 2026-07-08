export type UserRole = 'customer' | 'admin' | 'delivery' | 'manager' | 'kitchen';

export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  isEmailVerified: boolean;
  role: UserRole;
  status?: 'active' | 'blocked';
  avatarUrl?: string;
  language?: string;
  darkMode?: boolean;
  addresses?: string;
  wishlist?: string;
  notifications?: string;
  loyaltyPoints?: number;
  rewardLevel?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  'pizza' | 'sides' | 'drinks' | 'desserts' | 'pasta' | 'combos' | 'rice';

export interface ComboSlot {
  slotId: number;
  name: string;
  category: string;
  productId?: number;
  selectedVariant?: string;
  size?: string;
  defaultProduct?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  category: ProductCategory;
  variants?: { size: string; price: number }[];
  crusts?: string[];
  extraToppings?: { name: string; price: number }[];
  ingredients?: string[];
  nutrition?: { calories: number; protein: string; fat: string; carbs: string };
  reviews?: { user: string; rating: number; comment: string }[];
  comboItems?: ComboSlot[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface Order {
  id: number;
  user: Omit<User, 'password'>;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  gstAmount?: number;
  deliveryCharge?: number;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemCustomization {
  size?: string;
  crust?: string;
  extraCheese?: boolean;
  extraToppings?: string[];
  comboSelections?: {
    slotId: number;
    productId: number;
    name: string;
    customization?: Omit<CartItemCustomization, 'comboSelections'>;
  }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  specialInstructions?: string;
  customization?: CartItemCustomization;
}

export type TimelineStage =
  | 'received'
  | 'preparing'
  | 'baking'
  | 'quality_check'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
