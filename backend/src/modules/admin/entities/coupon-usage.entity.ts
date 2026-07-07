import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('coupon_usages')
export class CouponUsage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Coupon, { eager: true, onDelete: 'CASCADE' })
  coupon!: Coupon;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  order?: Order;

  @CreateDateColumn()
  createdAt!: Date;
}
