export type UserRole = 'customer' | 'admin' | 'delivery';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = 'pizza' | 'sides' | 'drinks' | 'desserts';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  category: ProductCategory;
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
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  specialInstructions?: string;
}
