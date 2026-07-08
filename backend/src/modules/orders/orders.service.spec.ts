import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: any;
  let couponRepository: any;
  let couponUsageRepository: any;
  let productsService: any;

  beforeEach(() => {
    orderRepository = {
      save: jest.fn(async (order: Order) => order),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    couponRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    couponUsageRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    productsService = {
      findById: jest.fn(),
    };

    service = new OrdersService(
      orderRepository,
      couponRepository,
      couponUsageRepository,
      productsService,
    );
  });

  it('uses the selected product variant price from specialInstructions when creating an order', async () => {
    const product = {
      id: 1,
      name: 'Margherita',
      price: 249,
      isAvailable: true,
      category: 'pizza',
      variants: [{ size: 'Regular', price: 249 }, { size: 'Medium', price: 399 }],
      extraToppings: [{ name: 'Extra Cheese', price: 75 }],
    } as Partial<Product> as Product;

    productsService.findById.mockResolvedValue(product);

    const user = { id: 7 } as Partial<User> as User;
    const result = await service.create(
      {
        deliveryAddress: 'Test address',
        items: [
          {
            productId: 1,
            quantity: 1,
            specialInstructions: JSON.stringify({ size: 'Medium' }),
          },
        ],
      } as any,
      user,
    );

    expect(result.items[0].price).toBe(399);
    expect(result.items[0]).toBeInstanceOf(OrderItem);
  });
});
