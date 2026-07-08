import { Injectable, OnModuleInit, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../orders/entities/order.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from './entities/category.entity';
import { Coupon } from './entities/coupon.entity';
import { Review } from './entities/review.entity';
import { AuditLog } from './entities/audit-log.entity';
import { CmsContent } from './entities/cms-content.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { Broadcast } from './entities/broadcast.entity';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(CmsContent)
    private readonly cmsContentRepository: Repository<CmsContent>,
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(Broadcast)
    private readonly broadcastRepository: Repository<Broadcast>,
  ) {}

  async onModuleInit() {
    // Seed default CMS content and settings if empty
    try {
      const cmsKeys = [
        {
          key: 'announcement_bar',
          value:
            '🔥 Special Offer: Buy 1 Get 1 Free on all Medium Pizzas today! Use Code: BOGO50',
        },
        {
          key: 'hero_banner',
          value: JSON.stringify({
            title: 'Gourmet Pizzas Crafted With Love',
            subtitle:
              'Experience authentic hand-stretched sourdough pizzas, loaded with fresh ingredients and baked to absolute perfection.',
            buttonText: 'Explore Menu',
            buttonLink: '/menu',
            imageUrl: '/images/products/margherita.jpg',
          }),
        },
        {
          key: 'footer_content',
          value: JSON.stringify({
            address: '123 Pizza Street, Foodie Heaven, FH 560001',
            phone: '+91 99999 88888',
            email: 'support@foodiesexpress.com',
            copyright: '© 2026 Foodies Express. All rights reserved.',
          }),
        },
        {
          key: 'promo_banners',
          value: JSON.stringify([
            {
              id: 1,
              title: 'Weekend Special',
              subtitle: 'Flat 20% Off on Combos',
              imageUrl: '/images/banners/banner1.jpg',
              link: '/menu?category=combos',
            },
          ]),
        },
      ];

      for (const item of cmsKeys) {
        const exists = await this.cmsContentRepository.findOne({
          where: { key: item.key },
        });
        if (!exists) {
          await this.cmsContentRepository.save(
            this.cmsContentRepository.create(item),
          );
        }
      }

      const settingsKeys = [
        {
          key: 'store_details',
          value: JSON.stringify({
            name: 'Foodies Express',
            email: 'store@foodiesexpress.com',
            phone: '+919999999999',
            address: 'Bangalore, India',
          }),
        },
        { key: 'delivery_charges', value: '49.00' },
        { key: 'gst_rate', value: '5.00' },
        {
          key: 'business_hours',
          value: JSON.stringify({
            open: '11:00 AM',
            close: '11:00 PM',
            days: 'Monday - Sunday',
          }),
        },
        {
          key: 'smtp_settings',
          value: JSON.stringify({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
          }),
        },
        {
          key: 'payment_settings',
          value: JSON.stringify({
            enableCash: true,
            enableOnline: true,
            defaultGateway: 'DemoPay',
          }),
        },
        {
          key: 'permission_matrix',
          value: JSON.stringify([
            {
              id: 'view_catalog',
              label: 'View Food Catalog',
              roles: {
                admin: true,
                manager: true,
                kitchen: true,
                delivery: true,
                customer: true,
              },
            },
            {
              id: 'write_catalog',
              label: 'Modify Catalog (CRUD)',
              roles: {
                admin: true,
                manager: true,
                kitchen: false,
                delivery: false,
                customer: false,
              },
            },
            {
              id: 'view_orders',
              label: 'View Shop Orders',
              roles: {
                admin: true,
                manager: true,
                kitchen: true,
                delivery: true,
                customer: false,
              },
            },
            {
              id: 'update_orders',
              label: 'Update Dispatch Status',
              roles: {
                admin: true,
                manager: true,
                kitchen: true,
                delivery: true,
                customer: false,
              },
            },
            {
              id: 'modify_settings',
              label: 'Store Timing & Fees',
              roles: {
                admin: true,
                manager: false,
                kitchen: false,
                delivery: false,
                customer: false,
              },
            },
            {
              id: 'view_audits',
              label: 'Audit Security Logs',
              roles: {
                admin: true,
                manager: false,
                kitchen: false,
                delivery: false,
                customer: false,
              },
            },
          ]),
        },
      ];

      for (const item of settingsKeys) {
        const exists = await this.systemSettingRepository.findOne({
          where: { key: item.key },
        });
        if (!exists) {
          await this.systemSettingRepository.save(
            this.systemSettingRepository.create(item),
          );
        }
      }

      // Seed initial Categories matching ProductCategories enum
      const categoriesSeed = [
        {
          name: 'pizza',
          displayName: 'Pizzas',
          sortOrder: 1,
          imageUrl: '/images/categories/pizza.jpg',
        },
        {
          name: 'pasta',
          displayName: 'Pasta',
          sortOrder: 2,
          imageUrl: '/images/categories/pasta.jpg',
        },
        {
          name: 'sides',
          displayName: 'Sides',
          sortOrder: 4,
          imageUrl: '/images/categories/sides.jpg',
        },
        {
          name: 'desserts',
          displayName: 'Desserts',
          sortOrder: 5,
          imageUrl: '/images/categories/desserts.jpg',
        },
        {
          name: 'drinks',
          displayName: 'Drinks',
          sortOrder: 6,
          imageUrl: '/images/categories/drinks.jpg',
        },
        {
          name: 'combos',
          displayName: 'Combos',
          sortOrder: 7,
          imageUrl: '/images/categories/combos.jpg',
        },
      ];

      for (const cat of categoriesSeed) {
        const exists = await this.categoryRepository.findOne({
          where: { name: cat.name },
        });
        if (!exists) {
          await this.categoryRepository.save(
            this.categoryRepository.create({ ...cat, isActive: true }),
          );
        }
      }

      // Seed initial Coupons if empty
      const couponsSeed = [
        {
          code: 'WELCOME100',
          type: 'flat' as const,
          value: 100,
          minOrder: 500,
          expiryDate: new Date('2027-12-31'),
          usageLimit: 1000,
          isOneTime: false,
          isPublic: true,
          isActive: true,
        },
        {
          code: 'BOGO50',
          type: 'percentage' as const,
          value: 50,
          minOrder: 300,
          expiryDate: new Date('2027-12-31'),
          usageLimit: 500,
          isOneTime: false,
          isPublic: true,
          isActive: true,
        },
        {
          code: 'ONETIME200',
          type: 'flat' as const,
          value: 200,
          minOrder: 1000,
          expiryDate: new Date('2027-12-31'),
          usageLimit: 1,
          isOneTime: true,
          isPublic: false,
          isActive: true,
        },
      ];

      for (const coup of couponsSeed) {
        const exists = await this.couponRepository.findOne({
          where: { code: coup.code },
        });
        if (!exists) {
          await this.couponRepository.save(this.couponRepository.create(coup));
        }
      }

      // Seed some initial reviews for products
      const pList = await this.productRepository.find();
      const uList = await this.userRepository.find();
      if (pList.length > 0 && uList.length > 0) {
        const reviewExists = await this.reviewRepository.find();
        if (reviewExists.length === 0) {
          const revs = [
            {
              rating: 5,
              comment: 'Phenomenal taste! Perfect sourdough crust.',
              status: 'approved' as const,
              isAbuseReported: false,
            },
            {
              rating: 4,
              comment: 'Very fast delivery and hot food.',
              status: 'approved' as const,
              isAbuseReported: false,
            },
            {
              rating: 1,
              comment: 'Terrible! Extremely late.',
              status: 'pending' as const,
              isAbuseReported: true,
            },
          ];
          for (let i = 0; i < revs.length; i++) {
            await this.reviewRepository.save(
              this.reviewRepository.create({
                ...revs[i],
                product: pList[i % pList.length],
                user: uList[i % uList.length],
              }),
            );
          }
        }
      }

      // Seed failed login logs if empty
      const auditLogsCount = await this.auditLogRepository.count();
      if (auditLogsCount === 0) {
        const seedLogs = [
          {
            action: 'FAILED_LOGIN',
            details: 'Invalid password threshold exceeded',
            ipAddress: '203.0.113.50',
            userEmail: 'hacker@malicious.com',
            userName: 'guest',
            createdAt: new Date(Date.now() - 10 * 60 * 1000),
          },
          {
            action: 'FAILED_LOGIN',
            details: 'Expired login session credentials',
            ipAddress: '198.51.100.12',
            userEmail: 'admin@foodies.com',
            userName: 'guest',
            createdAt: new Date(Date.now() - 60 * 60 * 1000),
          },
          {
            action: 'FAILED_LOGIN',
            details: 'No registered user match',
            ipAddress: '192.0.2.89',
            userEmail: 'unknown@user.com',
            userName: 'guest',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        ];
        for (const log of seedLogs) {
          await this.auditLogRepository.save(
            this.auditLogRepository.create(log),
          );
        }
      }
    } catch (e) {
      console.error('Error seeding default CMS/Settings/Coupons:', e);
    }
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter orders today
    const orders = await this.orderRepository.find({
      relations: ['items', 'items.product', 'user'],
    });

    const ordersToday = orders.filter(
      (o) => new Date(o.createdAt) >= today && new Date(o.createdAt) < tomorrow,
    );
    const revenueToday = ordersToday
      .filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const pendingOrdersCount = orders.filter(
      (o) => o.status === 'pending',
    ).length;
    const preparingOrdersCount = orders.filter(
      (o) => o.status === 'preparing',
    ).length;
    const outForDeliveryOrdersCount = orders.filter(
      (o) => o.status === 'out-for-delivery',
    ).length;
    const deliveredOrdersCount = orders.filter(
      (o) => o.status === 'delivered',
    ).length;
    const cancelledOrdersCount = orders.filter(
      (o) => o.status === 'cancelled',
    ).length;

    const totalCustomers = await this.userRepository.count({
      where: { role: UserRole.CUSTOMER },
    });

    // Repeat customers calculation: users with more than 1 order
    const orderCountByUser: Record<number, number> = {};
    orders.forEach((o) => {
      if (o.user && o.user.id) {
        orderCountByUser[o.user.id] = (orderCountByUser[o.user.id] || 0) + 1;
      }
    });
    const repeatCustomers = Object.values(orderCountByUser).filter(
      (count) => count > 1,
    ).length;

    // Average Order Value
    const totalPaidOrders = orders.filter(
      (o) => o.status === 'delivered' || o.paymentStatus === 'paid',
    );
    const totalPaidRevenue = totalPaidOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );
    const averageOrderValue =
      totalPaidOrders.length > 0
        ? totalPaidRevenue / totalPaidOrders.length
        : 0;

    // Daily revenue (past 7 days) computed dynamically
    const dailyRevenue: { date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayRevenue = orders
        .filter(
          (o) =>
            new Date(o.createdAt) >= dayStart &&
            new Date(o.createdAt) <= dayEnd &&
            o.paymentStatus === 'paid' &&
            o.status !== 'cancelled',
        )
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);

      dailyRevenue.push({
        date: label,
        amount: dayRevenue,
      });
    }

    // Weekly revenue (past 4 weeks) computed dynamically from orders
    const weeklyRevenue: { week: string; amount: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);

      const amount = orders
        .filter(
          (o) =>
            new Date(o.createdAt) >= start &&
            new Date(o.createdAt) <= end &&
            o.paymentStatus === 'paid' &&
            o.status !== 'cancelled',
        )
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);

      weeklyRevenue.push({
        week: `Week ${4 - i}`,
        amount,
      });
    }

    // Monthly revenue (past 6 months) computed dynamically from orders
    const monthlyRevenue: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const amount = orders
        .filter(
          (o) =>
            new Date(o.createdAt) >= start &&
            new Date(o.createdAt) <= end &&
            o.paymentStatus === 'paid' &&
            o.status !== 'cancelled',
        )
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);

      monthlyRevenue.push({
        month: label,
        amount,
      });
    }

    // Orders by Category
    const categoryCounts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status !== 'cancelled') {
        o.items?.forEach((item) => {
          if (item.product) {
            categoryCounts[item.product.category] =
              (categoryCounts[item.product.category] || 0) + item.quantity;
          }
        });
      }
    });
    const ordersByCategory = Object.keys(categoryCounts).map((cat) => ({
      category: cat.toUpperCase(),
      count: categoryCounts[cat],
    }));

    // Top Selling Pizzas computed dynamically
    const pizzaCounts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status !== 'cancelled') {
        o.items?.forEach((item) => {
          if (item.product && item.product.category === 'pizza') {
            pizzaCounts[item.product.name] =
              (pizzaCounts[item.product.name] || 0) + item.quantity;
          }
        });
      }
    });
    const topSellingPizza = Object.keys(pizzaCounts)
      .map((name) => ({ name, count: pizzaCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top Selling Combos computed dynamically
    const comboCounts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status !== 'cancelled') {
        o.items?.forEach((item) => {
          if (item.product && item.product.category === 'combos') {
            comboCounts[item.product.name] =
              (comboCounts[item.product.name] || 0) + item.quantity;
          }
        });
      }
    });
    const topSellingCombo = Object.keys(comboCounts)
      .map((name) => ({ name, count: comboCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top Customers Spends computed dynamically
    const customerSpend: Record<string, { orders: number; spend: number }> = {};
    orders.forEach((o) => {
      if (
        o.user &&
        o.user.name &&
        o.paymentStatus === 'paid' &&
        o.status !== 'cancelled'
      ) {
        const name = o.user.name;
        if (!customerSpend[name]) {
          customerSpend[name] = { orders: 0, spend: 0 };
        }
        customerSpend[name].orders += 1;
        customerSpend[name].spend += Number(o.totalAmount);
      }
    });
    const topCustomers = Object.keys(customerSpend)
      .map((name) => ({
        name,
        orders: customerSpend[name].orders,
        spend: customerSpend[name].spend,
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    // Peak Order Hours (hour: count) computed dynamically
    const hourlyCounts: Record<number, number> = {};
    orders.forEach((o) => {
      const date = new Date(o.createdAt);
      const hour = date.getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });
    const hoursMap: Record<number, string> = {
      12: '12 PM',
      13: '1 PM',
      14: '2 PM',
      18: '6 PM',
      19: '7 PM',
      20: '8 PM',
      21: '9 PM',
      22: '10 PM',
    };
    const peakOrderHours = Object.keys(hoursMap).map((hKey) => {
      const h = Number(hKey);
      return {
        hour: hoursMap[h],
        count: hourlyCounts[h] || 0,
      };
    });

    return {
      kpi: {
        todayOrders: ordersToday.length,
        todayRevenue: revenueToday,
        pendingOrders: pendingOrdersCount,
        preparingOrders: preparingOrdersCount,
        outForDelivery: outForDeliveryOrdersCount,
        delivered: deliveredOrdersCount,
        cancelled: cancelledOrdersCount,
        totalCustomers,
        averageOrderValue: Math.round(averageOrderValue),
        repeatCustomersPercentage:
          totalCustomers > 0
            ? Math.round((repeatCustomers / totalCustomers) * 100)
            : 0,
      },
      charts: {
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        ordersByCategory,
        topSellingPizza,
        topSellingCombo,
        topCustomers,
        peakOrderHours,
      },
    };
  }

  // Users Admin
  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({ order: { createdAt: 'DESC' } });
  }

  async updateUserStatus(
    id: number,
    status: 'active' | 'blocked',
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new Error('User not found');
    user.status = status;
    return this.userRepository.save(user);
  }

  async createManager(data: any): Promise<User> {
    const { name, email, phoneNumber, password } = data;
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(
        'A user with this email address already exists.',
      );
    }
    const hashedPassword = await bcrypt.hash(password || 'Manager@123', 10);
    const manager = this.userRepository.create({
      name,
      email,
      phoneNumber: phoneNumber || '',
      password: hashedPassword,
      role: UserRole.MANAGER,
      status: 'active',
    });
    const saved = await this.userRepository.save(manager);
    delete (saved as any).password;
    return saved;
  }

  async getManagers(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.MANAGER },
      order: { createdAt: 'DESC' },
    });
  }

  // Coupons CRUD
  async getAllCoupons(): Promise<Coupon[]> {
    return this.couponRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    return this.couponRepository.save(this.couponRepository.create(data));
  }

  async updateCoupon(id: number, data: Partial<Coupon>): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) throw new Error('Coupon not found');
    Object.assign(coupon, data);
    return this.couponRepository.save(coupon);
  }

  async deleteCoupon(id: number): Promise<void> {
    await this.couponRepository.delete(id);
  }

  // Category CRUD
  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.find({ order: { sortOrder: 'ASC' } });
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    return this.categoryRepository.save(this.categoryRepository.create(data));
  }

  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new Error('Category not found');
    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: number): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  // Reviews CRUD
  async getAllReviews(): Promise<Review[]> {
    return this.reviewRepository.find({ order: { createdAt: 'DESC' } });
  }

  async updateReviewStatus(
    id: number,
    status: 'pending' | 'approved' | 'rejected',
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new Error('Review not found');
    review.status = status;
    return this.reviewRepository.save(review);
  }

  async replyToReview(id: number, reply: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new Error('Review not found');
    review.reply = reply;
    return this.reviewRepository.save(review);
  }

  async reportAbuseReview(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new Error('Review not found');
    review.isAbuseReported = true;
    return this.reviewRepository.save(review);
  }

  // CMS Content Management
  async getCmsContent(): Promise<Record<string, string>> {
    const items = await this.cmsContentRepository.find();
    const result: Record<string, string> = {};
    items.forEach((i) => {
      result[i.key] = i.value;
    });
    return result;
  }

  async updateCmsContent(key: string, value: string): Promise<CmsContent> {
    let content = await this.cmsContentRepository.findOne({ where: { key } });
    if (!content) {
      content = this.cmsContentRepository.create({ key, value });
    } else {
      content.value = value;
    }
    return this.cmsContentRepository.save(content);
  }

  // System Settings
  async getSystemSettings(): Promise<Record<string, string>> {
    const items = await this.systemSettingRepository.find();
    const result: Record<string, string> = {};
    items.forEach((i) => {
      result[i.key] = i.value;
    });
    return result;
  }

  async updateSystemSetting(
    key: string,
    value: string,
  ): Promise<SystemSetting> {
    let setting = await this.systemSettingRepository.findOne({
      where: { key },
    });
    if (!setting) {
      setting = this.systemSettingRepository.create({ key, value });
    } else {
      setting.value = value;
    }
    return this.systemSettingRepository.save(setting);
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createAuditLog(
    action: string,
    details?: string,
    ipAddress?: string,
    user?: Omit<User, 'password'>,
  ): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      action,
      details,
      ipAddress,
      userName: user?.name,
      userEmail: user?.email,
    });
    return this.auditLogRepository.save(log);
  }

  async getDashboardData() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);
    monthStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // 1. Revenue Calculations (paymentStatus = 'paid' AND status !== 'cancelled')
    const totalRevRes = await this.orderRepository
      .createQueryBuilder('o')
      .select('SUM(o.totalAmount)', 'sum')
      .where('o.paymentStatus = :payStatus AND o.status != :status', {
        payStatus: PaymentStatus.PAID,
        status: OrderStatus.CANCELLED,
      })
      .getRawOne();
    const totalRevenue = totalRevRes?.sum ? Number(totalRevRes.sum) : 0;

    const todayRevRes = await this.orderRepository
      .createQueryBuilder('o')
      .select('SUM(o.totalAmount)', 'sum')
      .where('o.paymentStatus = :payStatus AND o.status != :status', {
        payStatus: PaymentStatus.PAID,
        status: OrderStatus.CANCELLED,
      })
      .andWhere('o.createdAt BETWEEN :start AND :end', {
        start: todayStart,
        end: todayEnd,
      })
      .getRawOne();
    const todayRevenue = todayRevRes?.sum ? Number(todayRevRes.sum) : 0;

    const weeklyRevRes = await this.orderRepository
      .createQueryBuilder('o')
      .select('SUM(o.totalAmount)', 'sum')
      .where('o.paymentStatus = :payStatus AND o.status != :status', {
        payStatus: PaymentStatus.PAID,
        status: OrderStatus.CANCELLED,
      })
      .andWhere('o.createdAt >= :start', { start: weekStart })
      .getRawOne();
    const weeklyRevenue = weeklyRevRes?.sum ? Number(weeklyRevRes.sum) : 0;

    const monthlyRevRes = await this.orderRepository
      .createQueryBuilder('o')
      .select('SUM(o.totalAmount)', 'sum')
      .where('o.paymentStatus = :payStatus AND o.status != :status', {
        payStatus: PaymentStatus.PAID,
        status: OrderStatus.CANCELLED,
      })
      .andWhere('o.createdAt >= :start', { start: monthStart })
      .getRawOne();
    const monthlyRevenue = monthlyRevRes?.sum ? Number(monthlyRevRes.sum) : 0;

    // 2. Orders Counts
    const todayOrdersCount = await this.orderRepository
      .createQueryBuilder('o')
      .where('o.createdAt BETWEEN :start AND :end', {
        start: todayStart,
        end: todayEnd,
      })
      .getCount();

    const pendingOrdersCount = await this.orderRepository.count({
      where: { status: OrderStatus.PENDING },
    });
    const preparingOrdersCount = await this.orderRepository.count({
      where: { status: OrderStatus.PREPARING },
    });
    const outForDeliveryOrdersCount = await this.orderRepository.count({
      where: { status: OrderStatus.OUT_FOR_DELIVERY },
    });
    const deliveredOrdersCount = await this.orderRepository.count({
      where: { status: OrderStatus.DELIVERED },
    });
    const cancelledOrdersCount = await this.orderRepository.count({
      where: { status: OrderStatus.CANCELLED },
    });
    const refundedOrdersCount = await this.orderRepository.count({
      where: { paymentStatus: PaymentStatus.FAILED },
    });

    // 3. Average Order Value = Total Revenue / Completed Orders
    const averageOrderValue =
      deliveredOrdersCount > 0
        ? Math.round(totalRevenue / deliveredOrdersCount)
        : 0;

    // 4. Customers Audit
    const totalCustomers = await this.userRepository.count({
      where: { role: UserRole.CUSTOMER },
    });
    const newCustomers = await this.userRepository.count({
      where: {
        role: UserRole.CUSTOMER,
        createdAt: Between(monthStart, new Date()),
      },
    });

    const repeatCustomersRes = await this.orderRepository
      .createQueryBuilder('o')
      .select('o.userId', 'userId')
      .where('o.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('o.userId')
      .having('COUNT(o.id) >= 2')
      .getRawMany();
    const repeatCustomers = repeatCustomersRes.length;
    const returningCustomers = repeatCustomers;

    const repeatCustomersPercentage =
      totalCustomers > 0
        ? Math.round((repeatCustomers / totalCustomers) * 100)
        : 0;

    // 5. Lists
    const latestOrders = await this.orderRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const latestPayments = await this.orderRepository.find({
      relations: ['user'],
      where: { paymentStatus: PaymentStatus.PAID },
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    const latestCustomers = await this.userRepository.find({
      where: { role: UserRole.CUSTOMER },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // 6. Top Spend Customer Leaderboard
    const topCust = await this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.user', 'u')
      .select('u.name', 'name')
      .addSelect('COUNT(o.id)', 'orders')
      .addSelect('SUM(o.totalAmount)', 'spend')
      .where('o.paymentStatus = :payStatus AND o.status != :status', {
        payStatus: PaymentStatus.PAID,
        status: OrderStatus.CANCELLED,
      })
      .groupBy('u.name')
      .orderBy('SUM(o.totalAmount)', 'DESC')
      .limit(5)
      .getRawMany();

    const topCustomers = topCust.map((tc) => ({
      name: tc.name,
      orders: Number(tc.orders),
      spend: Number(tc.spend),
    }));

    return {
      kpi: {
        todayOrders: todayOrdersCount,
        todayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        totalRevenue,
        pendingOrders: pendingOrdersCount,
        preparingOrders: preparingOrdersCount,
        outForDelivery: outForDeliveryOrdersCount,
        delivered: deliveredOrdersCount,
        cancelled: cancelledOrdersCount,
        refunded: refundedOrdersCount,
        averageOrderValue,
        totalCustomers,
        newCustomers,
        returningCustomers,
        repeatCustomersPercentage,
        topCustomers,
      },
      latestOrders,
      latestPayments,
      latestCustomers,
    };
  }

  async getAnalyticsData() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // 1. Daily revenue (past 7 days)
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const res = await this.orderRepository
        .createQueryBuilder('o')
        .select('SUM(o.totalAmount)', 'sum')
        .where('o.paymentStatus = :payStatus AND o.status != :status', {
          payStatus: PaymentStatus.PAID,
          status: OrderStatus.CANCELLED,
        })
        .andWhere('o.createdAt BETWEEN :start AND :end', {
          start: dayStart,
          end: dayEnd,
        })
        .getRawOne();

      dailyRevenue.push({
        date: label,
        amount: res?.sum ? Number(res.sum) : 0,
      });
    }

    // 2. Weekly revenue (past 4 weeks)
    const weeklyRevenue = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);

      const res = await this.orderRepository
        .createQueryBuilder('o')
        .select('SUM(o.totalAmount)', 'sum')
        .where('o.paymentStatus = :payStatus AND o.status != :status', {
          payStatus: PaymentStatus.PAID,
          status: OrderStatus.CANCELLED,
        })
        .andWhere('o.createdAt BETWEEN :start AND :end', { start, end })
        .getRawOne();

      weeklyRevenue.push({
        week: `Week ${4 - i}`,
        amount: res?.sum ? Number(res.sum) : 0,
      });
    }

    // 3. Monthly revenue (past 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const res = await this.orderRepository
        .createQueryBuilder('o')
        .select('SUM(o.totalAmount)', 'sum')
        .where('o.paymentStatus = :payStatus AND o.status != :status', {
          payStatus: PaymentStatus.PAID,
          status: OrderStatus.CANCELLED,
        })
        .andWhere('o.createdAt BETWEEN :start AND :end', { start, end })
        .getRawOne();

      monthlyRevenue.push({
        month: label,
        amount: res?.sum ? Number(res.sum) : 0,
      });
    }

    // 4. Orders by Category
    const categoryShares = await this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.items', 'item')
      .innerJoin('item.product', 'p')
      .select('p.category', 'category')
      .addSelect('SUM(item.quantity)', 'count')
      .where('o.paymentStatus = :payStatus AND o.status != :status', {
        payStatus: PaymentStatus.PAID,
        status: OrderStatus.CANCELLED,
      })
      .groupBy('p.category')
      .getRawMany();

    const ordersByCategory = categoryShares.map((c) => ({
      category: c.category.toUpperCase(),
      count: Number(c.count),
    }));

    // 5. Top Selling Pizzas
    const topPizzas = await this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.items', 'item')
      .innerJoin('item.product', 'p')
      .select('p.name', 'name')
      .addSelect('SUM(item.quantity)', 'count')
      .where('p.category = :cat', { cat: 'pizza' })
      .andWhere('o.paymentStatus = :payStatus AND o.status != :status', {
        payStatus: PaymentStatus.PAID,
        status: OrderStatus.CANCELLED,
      })
      .groupBy('p.name')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    const topSellingPizza = topPizzas.map((tp) => ({
      name: tp.name,
      count: Number(tp.count),
    }));

    // 6. Top Selling Combos
    const topCombos = await this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.items', 'item')
      .innerJoin('item.product', 'p')
      .select('p.name', 'name')
      .addSelect('SUM(item.quantity)', 'count')
      .where('p.category = :cat', { cat: 'combos' })
      .andWhere('o.paymentStatus = :payStatus AND o.status != :status', {
        payStatus: PaymentStatus.PAID,
        status: OrderStatus.CANCELLED,
      })
      .groupBy('p.name')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    const topSellingCombo = topCombos.map((tc) => ({
      name: tc.name,
      count: Number(tc.count),
    }));

    // 7. Top Customers Spends
    const topCust = await this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.user', 'u')
      .select('u.name', 'name')
      .addSelect('COUNT(o.id)', 'orders')
      .addSelect('SUM(o.totalAmount)', 'spend')
      .where('o.paymentStatus = :payStatus AND o.status != :status', {
        payStatus: PaymentStatus.PAID,
        status: OrderStatus.CANCELLED,
      })
      .groupBy('u.name')
      .orderBy('SUM(o.totalAmount)', 'DESC')
      .limit(5)
      .getRawMany();

    const topCustomers = topCust.map((tc) => ({
      name: tc.name,
      orders: Number(tc.orders),
      spend: Number(tc.spend),
    }));

    // 8. Peak Order Hours (hour: count)
    const hourlyDistribution = await this.orderRepository
      .createQueryBuilder('o')
      .select('HOUR(o.createdAt)', 'hour')
      .addSelect('COUNT(o.id)', 'count')
      .groupBy('HOUR(o.createdAt)')
      .getRawMany();

    const hoursMap: Record<number, string> = {
      12: '12 PM',
      13: '1 PM',
      14: '2 PM',
      18: '6 PM',
      19: '7 PM',
      20: '8 PM',
      21: '9 PM',
      22: '10 PM',
    };

    const peakOrderHours = Object.keys(hoursMap).map((hKey) => {
      const h = Number(hKey);
      const match = hourlyDistribution.find((hd) => Number(hd.hour) === h);
      return {
        hour: hoursMap[h],
        count: match ? Number(match.count) : 0,
      };
    });

    return {
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      ordersByCategory,
      topSellingPizza,
      topSellingCombo,
      topCustomers,
      peakOrderHours,
    };
  }

  async sendBroadcastNotification(subject: string, message: string) {
    const customers = await this.userRepository.find({
      where: { role: UserRole.CUSTOMER },
    });

    const broadcast = new Broadcast();
    broadcast.subject = subject;
    broadcast.message = message;
    broadcast.recipientsCount = customers.length;
    broadcast.status = 'pending';
    const savedBroadcast = await this.broadcastRepository.save(broadcast);

    const deliveryDetails: { email: string; status: string; error?: string }[] =
      [];

    for (const customer of customers) {
      let currentNotifs: any[] = [];
      if (customer.notifications) {
        try {
          currentNotifs = JSON.parse(customer.notifications);
          if (!Array.isArray(currentNotifs)) {
            currentNotifs = [];
          }
        } catch (e) {
          currentNotifs = [];
        }
      }
      const newNotif = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        title: subject,
        message: message,
        read: false,
        createdAt: new Date(),
      };
      customer.notifications = JSON.stringify([newNotif, ...currentNotifs]);
      await this.userRepository.save(customer);

      deliveryDetails.push({ email: customer.email, status: 'success' });
    }

    savedBroadcast.status = deliveryDetails.some((d) => d.status === 'success')
      ? 'success'
      : 'failed';
    savedBroadcast.deliveryDetails = JSON.stringify(deliveryDetails);
    await this.broadcastRepository.save(savedBroadcast);

    return savedBroadcast;
  }

  async getBroadcastHistory() {
    return this.broadcastRepository.find({ order: { sentAt: 'DESC' } });
  }
}
