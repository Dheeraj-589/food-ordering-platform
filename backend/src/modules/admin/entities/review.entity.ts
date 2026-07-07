import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  user?: User;

  @ManyToOne(() => Product, {
    eager: true,
    onDelete: 'CASCADE',
    nullable: true,
  })
  product?: Product;

  @Column({ type: 'int', default: 5 })
  rating!: number;

  @Column({ type: 'text' })
  comment!: string;

  @Column({ type: 'text', nullable: true })
  reply?: string;

  @Column({ type: 'varchar', length: 20, default: 'approved' })
  status!: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'boolean', default: false })
  isAbuseReported!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
