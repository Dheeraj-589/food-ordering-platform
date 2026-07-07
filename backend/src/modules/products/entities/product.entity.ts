import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductCategory {
  PIZZA = 'pizza',
  SIDES = 'sides',
  DRINKS = 'drinks',
  DESSERTS = 'desserts',
  PASTA = 'pasta',
  COMBOS = 'combos',
  RICE = 'rice',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl?: string;

  @Column({ type: 'boolean', default: true })
  isAvailable!: boolean;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.PIZZA,
  })
  category!: ProductCategory;

  @Column({ type: 'json', nullable: true })
  variants?: any; // Sizes and size-specific price adjustments

  @Column({ type: 'json', nullable: true })
  crusts?: any; // List of available crust types

  @Column({ type: 'json', nullable: true })
  extraToppings?: any; // Toppings with price adjustments

  @Column({ type: 'json', nullable: true })
  ingredients?: any; // Ingredients list

  @Column({ type: 'json', nullable: true })
  nutrition?: any; // Nutrition facts

  @Column({ type: 'json', nullable: true })
  reviews?: any; // User reviews

  @Column({ type: 'json', nullable: true })
  comboItems?: any; // Setup for items in the combo

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
