import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  DELIVERY = 'delivery',
  MANAGER = 'manager',
  KITCHEN = 'kitchen',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'blocked';

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language!: string;

  @Column({ type: 'boolean', default: true })
  darkMode!: boolean;

  @Column({ type: 'text', nullable: true })
  addresses?: string; // Serialized JSON string of Address[]

  @Column({ type: 'text', nullable: true })
  wishlist?: string; // Serialized JSON string of number[] (Product IDs)

  @Column({ type: 'text', nullable: true })
  notifications?: string; // Serialized JSON string of Notification[]

  @Column({ type: 'int', default: 100 })
  loyaltyPoints!: number;

  @Column({ type: 'varchar', length: 50, default: 'Bronze' })
  rewardLevel!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
