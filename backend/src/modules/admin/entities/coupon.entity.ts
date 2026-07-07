import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 20, default: 'percentage' })
  type!: 'percentage' | 'flat';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrder!: number;

  @Column({ type: 'datetime', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'int', default: 100 })
  usageLimit!: number;

  @Column({ type: 'int', default: 0 })
  usedCount!: number;

  @Column({ type: 'boolean', default: false })
  isOneTime!: boolean;

  @Column({ type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
