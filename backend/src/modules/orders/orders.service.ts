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

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly productsService: ProductsService,
  ) {}

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

    order.totalAmount = total;
    return this.orderRepository.save(order);
  }

  async findByUser(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findById(id);
    order.status = status;
    return this.orderRepository.save(order);
  }
}
