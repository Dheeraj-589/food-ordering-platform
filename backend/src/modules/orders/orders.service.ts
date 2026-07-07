import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';
import { ProductsService } from '../products/products.service';
import { MailerService } from '../auth/mailer.service';
import { Coupon } from '../admin/entities/coupon.entity';
import { CouponUsage } from '../admin/entities/coupon-usage.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
    private readonly productsService: ProductsService,
    private readonly mailerService: MailerService,
  ) {}

  async validateCoupon(code: string, subtotal: number, userId: number) {
    const coupon = await this.couponRepository.findOne({ where: { code } });
    if (!coupon) {
      return { valid: false, message: 'Coupon Invalid' };
    }
    if (!coupon.isActive) {
      return { valid: false, message: 'Coupon Not Applicable' };
    }
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return { valid: false, message: 'Coupon Expired' };
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: 'Usage Limit Exceeded' };
    }
    if (subtotal < Number(coupon.minOrder)) {
      return { valid: false, message: 'Minimum Order Not Met' };
    }
    if (coupon.isOneTime) {
      const alreadyUsed = await this.couponUsageRepository.findOne({
        where: { coupon: { id: coupon.id }, user: { id: userId } },
      });
      if (alreadyUsed) {
        return { valid: false, message: 'Coupon Already Used' };
      }
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round((subtotal * Number(coupon.value)) / 100);
    } else {
      discount = Number(coupon.value);
    }
    discount = Math.min(discount, subtotal);

    const deliveryCharge =
      subtotal - discount >= 499 || subtotal - discount === 0 ? 0 : 49;
    const gst = Math.round((subtotal - discount) * 0.05);
    const grandTotal = Math.max(0, subtotal - discount + deliveryCharge + gst);

    return {
      valid: true,
      message: 'Coupon Applied Successfully',
      discount,
      deliveryCharge,
      gst,
      grandTotal,
      coupon,
    };
  }

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    if (createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const order = new Order();
    order.user = user;
    order.deliveryAddress = createOrderDto.deliveryAddress;
    order.items = [];

    let total = 0;

    for (const itemDto of createOrderDto.items) {
      const product = await this.productsService.findById(itemDto.productId);
      if (!product.isAvailable) {
        throw new BadRequestException(
          `Product ${product.name} is currently out of stock`,
        );
      }

      const orderItem = new OrderItem();
      orderItem.product = product;
      orderItem.quantity = itemDto.quantity;
      orderItem.price = Number(product.price);
      orderItem.specialInstructions = itemDto.specialInstructions;

      total += orderItem.price * orderItem.quantity;
      order.items.push(orderItem);
    }

    order.subtotal = total;

    let discount = 0;
    let delivery = total >= 499 || total === 0 ? 0 : 49;
    let gst = Math.round(total * 0.05);
    let grandTotal = total + delivery + gst;

    let appliedCoupon: Coupon | null = null;

    if (createOrderDto.couponCode) {
      const valResult = await this.validateCoupon(
        createOrderDto.couponCode,
        total,
        user.id,
      );
      if (!valResult.valid) {
        throw new BadRequestException(valResult.message);
      }
      discount = valResult.discount ?? 0;
      delivery = valResult.deliveryCharge ?? delivery;
      gst = valResult.gst ?? gst;
      grandTotal = valResult.grandTotal ?? grandTotal;
      appliedCoupon = valResult.coupon ?? null;
      order.couponCode = createOrderDto.couponCode;
    }

    order.discountAmount = discount;
    order.deliveryCharge = delivery;
    order.gstAmount = gst;
    order.totalAmount = grandTotal;

    if (createOrderDto.paymentStatus) {
      order.paymentStatus = createOrderDto.paymentStatus;
    }

    const savedOrder = await this.orderRepository.save(order);

    if (appliedCoupon) {
      const usage = new CouponUsage();
      usage.coupon = appliedCoupon;
      usage.user = user;
      usage.order = savedOrder;
      await this.couponUsageRepository.save(usage);

      appliedCoupon.usedCount += 1;
      await this.couponRepository.save(appliedCoupon);
    }

    return savedOrder;
  }

  async findByUser(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findById(id);
    const prevStatus = order.status;
    order.status = status;
    const savedOrder = await this.orderRepository.save(order);

    if (
      status !== prevStatus &&
      (status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED)
    ) {
      if (order.user && order.user.email) {
        this.mailerService
          .sendOrderStatusEmail(order.user.email, order, status)
          .catch((err) => console.error('Failed to send status email:', err));
      }
    }

    return savedOrder;
  }

  async updatePaymentStatus(id: number, paymentStatus: any): Promise<Order> {
    const order = await this.findById(id);
    order.paymentStatus = paymentStatus;
    return this.orderRepository.save(order);
  }
}
