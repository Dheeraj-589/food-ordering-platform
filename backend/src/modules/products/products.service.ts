import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductCategory } from './entities/product.entity';
import { Category } from '../admin/entities/category.entity';
import { Coupon } from '../admin/entities/coupon.entity';
import { CmsContent } from '../admin/entities/cms-content.entity';
import { SystemSetting } from '../admin/entities/system-setting.entity';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CmsContent)
    private readonly cmsContentRepository: Repository<CmsContent>,
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.productRepository.count();
      if (count > 0) {
        console.log(
          'Products already exist in database. Skipping catalog seeding.',
        );
        return;
      }

      console.log('Seeding products database with premium menu items...');
      const seedProducts: Partial<Product>[] = [
        // PIZZA - VEG
        {
          name: 'Margherita',
          description:
            'Classic delight with 100% real mozzarella cheese & fresh tomato sauce.',
          price: 249,
          imageUrl: '/images/products/margherita.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 249 },
            { size: 'Medium', price: 399 },
            { size: 'Large', price: 549 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [
            { name: 'Extra Cheese', price: 75 },
            { name: 'Mushroom', price: 45 },
            { name: 'Jalapenos', price: 45 },
            { name: 'Black Olives', price: 45 },
            { name: 'Paneer Chunks', price: 60 },
          ],
          ingredients: [
            'Artisanal Sourdough',
            'San Marzano Marinara',
            'Fresh Mozzarella',
            'Oregano',
            'Extra Virgin Olive Oil',
          ],
          nutrition: { calories: 230, protein: '10g', fat: '8g', carbs: '28g' },
          reviews: [
            {
              user: 'Amit K.',
              rating: 5,
              comment: 'Simple, fresh, and perfect!',
            },
            {
              user: 'Sonia M.',
              rating: 4,
              comment: 'Classic taste, very cheesy.',
            },
          ],
        },
        {
          name: 'Farmhouse',
          description:
            'Delightful combination of onion, capsicum, tomato & mushroom.',
          price: 299,
          imageUrl: '/images/products/farmhouse.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 299 },
            { size: 'Medium', price: 449 },
            { size: 'Large', price: 599 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [
            { name: 'Extra Cheese', price: 75 },
            { name: 'Sweet Corn', price: 45 },
            { name: 'Onion', price: 35 },
            { name: 'Capsicum', price: 35 },
          ],
          ingredients: [
            'Sourdough',
            'Marinara',
            'Mozzarella',
            'Onion',
            'Bell Peppers',
            'Tomato',
            'Mushrooms',
          ],
          nutrition: { calories: 255, protein: '11g', fat: '9g', carbs: '31g' },
          reviews: [
            {
              user: 'Rohan S.',
              rating: 5,
              comment: 'My favorite veggie pizza!',
            },
          ],
        },
        {
          name: 'Veg Supreme',
          description:
            'Loaded with onion, capsicum, mushroom, tomato, black olives, jalapeno & corn.',
          price: 349,
          imageUrl: '/images/products/veg-supreme.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 349 },
            { size: 'Medium', price: 499 },
            { size: 'Large', price: 649 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [
            { name: 'Extra Cheese', price: 75 },
            { name: 'Paneer Chunks', price: 60 },
          ],
          ingredients: [
            'Sourdough',
            'Marinara',
            'Mozzarella',
            'Jalapeno',
            'Black Olives',
            'Mushrooms',
            'Sweet Corn',
            'Bell Peppers',
          ],
          nutrition: {
            calories: 270,
            protein: '12g',
            fat: '10g',
            carbs: '33g',
          },
          reviews: [],
        },
        {
          name: 'Paneer Tikka Pizza',
          description: 'Spicy paneer tikka, onion, capsicum, and red paprika.',
          price: 329,
          imageUrl: '/images/products/paneer-tikka.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 329 },
            { size: 'Medium', price: 479 },
            { size: 'Large', price: 629 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [
            { name: 'Extra Cheese', price: 75 },
            { name: 'Paneer Tikka Extra', price: 70 },
            { name: 'Red Paprika', price: 40 },
          ],
          ingredients: [
            'Sourdough',
            'Spicy Makhani Sauce',
            'Mozzarella',
            'Marinated Paneer Tikka',
            'Onions',
            'Capsicum',
            'Red Paprika',
          ],
          nutrition: {
            calories: 290,
            protein: '14g',
            fat: '12g',
            carbs: '32g',
          },
          reviews: [
            {
              user: 'Preeti D.',
              rating: 5,
              comment: 'Indian fusion done right!',
            },
          ],
        },
        {
          name: 'Mexican Green Wave',
          description: 'Capsicum, onion, tomato, jalapeno and mexican herbs.',
          price: 319,
          imageUrl: '/images/products/mexican-green-wave.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 319 },
            { size: 'Medium', price: 469 },
            { size: 'Large', price: 619 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [
            { name: 'Extra Cheese', price: 75 },
            { name: 'Jalapenos', price: 45 },
          ],
          ingredients: [
            'Sourdough',
            'Spicy Salsa Base',
            'Mozzarella',
            'Jalapenos',
            'Onions',
            'Bell Peppers',
            'Mexican Seasoning',
          ],
          nutrition: { calories: 260, protein: '11g', fat: '9g', carbs: '33g' },
          reviews: [],
        },
        {
          name: 'Deluxe Veggie',
          description: 'Onion, capsicum, mushroom, golden corn & paneer.',
          price: 339,
          imageUrl: '/images/products/deluxe-veggie.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 339 },
            { size: 'Medium', price: 489 },
            { size: 'Large', price: 639 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [{ name: 'Extra Cheese', price: 75 }],
          ingredients: [
            'Sourdough',
            'Marinara',
            'Mozzarella',
            'Paneer',
            'Golden Corn',
            'Mushrooms',
            'Onions',
            'Bell Peppers',
          ],
          nutrition: {
            calories: 280,
            protein: '13g',
            fat: '11g',
            carbs: '32g',
          },
          reviews: [],
        },

        // PIZZA - CHICKEN/NON-VEG
        {
          name: 'Pepperoni',
          description:
            'Double spicy Italian pepperoni, loaded with mozzarella cheese.',
          price: 399,
          imageUrl: '/images/products/pepperoni.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 399 },
            { size: 'Medium', price: 549 },
            { size: 'Large', price: 699 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [
            { name: 'Extra Cheese', price: 75 },
            { name: 'Pepperoni Chunks', price: 90 },
          ],
          ingredients: [
            'Sourdough',
            'Marinara',
            'Double Mozzarella',
            'Pork/Beef Spicy Pepperoni',
            'Basil',
          ],
          nutrition: {
            calories: 310,
            protein: '16g',
            fat: '15g',
            carbs: '27g',
          },
          reviews: [
            {
              user: 'John D.',
              rating: 5,
              comment: 'Best Pepperoni ever. Super crispy edges!',
            },
          ],
        },
        {
          name: 'Chicken Supreme',
          description:
            'Spicy chicken, herbed chicken, chicken meatballs & double cheese.',
          price: 449,
          imageUrl: '/images/products/chicken-supreme.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 449 },
            { size: 'Medium', price: 599 },
            { size: 'Large', price: 749 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [
            { name: 'Extra Cheese', price: 75 },
            { name: 'Grilled Chicken', price: 90 },
          ],
          ingredients: [
            'Sourdough',
            'Marinara',
            'Mozzarella',
            'Herbed Chicken Chunks',
            'Chicken Meatballs',
            'Spicy Shredded Chicken',
          ],
          nutrition: {
            calories: 330,
            protein: '20g',
            fat: '13g',
            carbs: '29g',
          },
          reviews: [
            {
              user: 'Kunal R.',
              rating: 5,
              comment: 'A meat lover’s absolute dream!',
            },
          ],
        },
        {
          name: 'Chicken Tikka Pizza',
          description: 'Chicken tikka chunks, onion, and red paprika.',
          price: 419,
          imageUrl: '/images/products/chicken-tikka.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 419 },
            { size: 'Medium', price: 569 },
            { size: 'Large', price: 719 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [
            { name: 'Extra Cheese', price: 75 },
            { name: 'Chicken Tikka', price: 90 },
          ],
          ingredients: [
            'Sourdough',
            'Makhani Sauce Base',
            'Mozzarella',
            'Marinated Chicken Tikka Chunks',
            'Onions',
            'Red Paprika',
          ],
          nutrition: {
            calories: 315,
            protein: '18g',
            fat: '12g',
            carbs: '30g',
          },
          reviews: [],
        },
        {
          name: 'BBQ Chicken Pizza',
          description: 'Sweet BBQ chicken chunks, onion, and fresh coriander.',
          price: 429,
          imageUrl: '/images/products/bbq-chicken.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 429 },
            { size: 'Medium', price: 579 },
            { size: 'Large', price: 729 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [
            { name: 'Extra Cheese', price: 75 },
            { name: 'BBQ Sauce Drizzle', price: 30 },
          ],
          ingredients: [
            'Sourdough',
            'Hickory BBQ Sauce Base',
            'Mozzarella',
            'Grilled BBQ Chicken',
            'Onions',
            'Cilantro',
          ],
          nutrition: {
            calories: 310,
            protein: '18g',
            fat: '11g',
            carbs: '32g',
          },
          reviews: [],
        },
        {
          name: 'Spicy Chicken Pizza',
          description:
            'Spicy shredded chicken, hot jalapenos, and red paprika.',
          price: 419,
          imageUrl: '/images/products/spicy-chicken.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 419 },
            { size: 'Medium', price: 569 },
            { size: 'Large', price: 719 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [
            { name: 'Extra Cheese', price: 75 },
            { name: 'Jalapenos', price: 45 },
          ],
          ingredients: [
            'Sourdough',
            'Marinara Sauce',
            'Mozzarella',
            'Hot Chili Shredded Chicken',
            'Jalapenos',
            'Red Paprika',
          ],
          nutrition: {
            calories: 305,
            protein: '17g',
            fat: '12g',
            carbs: '28g',
          },
          reviews: [],
        },
        {
          name: 'Loaded Chicken Pizza',
          description:
            'Double chicken tikka, double herbed chicken & double mozzarella.',
          price: 479,
          imageUrl: '/images/products/loaded-chicken.jpg',
          isAvailable: true,
          category: ProductCategory.PIZZA,
          variants: [
            { size: 'Regular', price: 479 },
            { size: 'Medium', price: 629 },
            { size: 'Large', price: 779 },
          ],
          crusts: [
            'Classic Hand Tossed',
            'Thin Crust',
            'Cheese Burst',
            'Pan Pizza',
          ],
          extraToppings: [{ name: 'Extra Cheese', price: 75 }],
          ingredients: [
            'Sourdough',
            'Marinara',
            'Double Mozzarella',
            'Chicken Tikka',
            'Herbed Chicken',
            'Sweet Corn',
          ],
          nutrition: {
            calories: 345,
            protein: '22g',
            fat: '14g',
            carbs: '31g',
          },
          reviews: [],
        },

        // PASTA
        {
          name: 'White Sauce Pasta',
          description:
            'Penne pasta in premium white cheese cream sauce with broccoli & olives.',
          price: 249,
          imageUrl: '/images/products/white-sauce-pasta.jpg',
          isAvailable: true,
          category: ProductCategory.PASTA,
          ingredients: [
            'Penne Pasta',
            'White Cheese Cream Sauce',
            'Garlic',
            'Broccoli',
            'Black Olives',
            'Parmesan',
          ],
          nutrition: {
            calories: 420,
            protein: '11g',
            fat: '18g',
            carbs: '45g',
          },
          reviews: [
            { user: 'Sam M.', rating: 4, comment: 'So creamy and delicious!' },
          ],
        },
        {
          name: 'Red Sauce Pasta',
          description:
            'Tangy tomato arrabbiata pasta with bell peppers, basil & parmesan.',
          price: 229,
          imageUrl: '/images/products/red-sauce-pasta.jpg',
          isAvailable: true,
          category: ProductCategory.PASTA,
          ingredients: [
            'Penne Pasta',
            'San Marzano Tomato Arrabbiata',
            'Garlic',
            'Bell Peppers',
            'Basil',
            'Extra Virgin Olive Oil',
          ],
          nutrition: { calories: 380, protein: '9g', fat: '10g', carbs: '48g' },
          reviews: [],
        },
        {
          name: 'Chicken Alfredo',
          description:
            'Classic fettuccine in creamy alfredo sauce topped with juicy grilled chicken breast.',
          price: 299,
          imageUrl: '/images/products/chicken-alfredo.jpg',
          isAvailable: true,
          category: ProductCategory.PASTA,
          ingredients: [
            'Fettuccine Pasta',
            'Creamy Alfredo Sauce',
            'Garlic',
            'Grilled Chicken Breast Chunks',
            'Parmesan Cheese',
          ],
          nutrition: {
            calories: 510,
            protein: '24g',
            fat: '20g',
            carbs: '44g',
          },
          reviews: [
            {
              user: 'Vikram A.',
              rating: 5,
              comment: 'Tastes like high-end restaurant pasta!',
            },
          ],
        },

        // DESSERTS
        {
          name: 'Chocolate Lava Cake',
          description: 'Rich chocolate cake with a molten chocolate center.',
          price: 129,
          imageUrl: '/images/products/choco-lava.jpg',
          isAvailable: true,
          category: ProductCategory.DESSERTS,
          ingredients: [
            'Cocoa Powder',
            'Dark Chocolate Callets',
            'Flour',
            'Butter',
            'Sugar',
            'Cream',
          ],
          nutrition: { calories: 350, protein: '4g', fat: '18g', carbs: '42g' },
          reviews: [
            { user: 'Neha P.', rating: 5, comment: 'Warm, gooey, pure bliss.' },
          ],
        },
        {
          name: 'Brownie',
          description:
            'Warm walnut chocolate brownie with fudgy chocolate syrup.',
          price: 119,
          imageUrl: '/images/products/brownie.jpg',
          isAvailable: true,
          category: ProductCategory.DESSERTS,
          ingredients: [
            'Chocolate Fudge',
            'Walnuts',
            'Cocoa Powder',
            'Butter',
            'Eggs',
            'Sugar',
          ],
          nutrition: { calories: 320, protein: '5g', fat: '16g', carbs: '38g' },
          reviews: [],
        },
        {
          name: 'Cheesecake',
          description:
            'Creamy New York style cheesecake with a sweet strawberry compote drizzle.',
          price: 179,
          imageUrl: '/images/products/cheesecake.jpg',
          isAvailable: true,
          category: ProductCategory.DESSERTS,
          ingredients: [
            'Cream Cheese',
            'Graham Crackers Crust',
            'Sour Cream',
            'Sugar',
            'Strawberry Compote',
          ],
          nutrition: { calories: 390, protein: '7g', fat: '22g', carbs: '40g' },
          reviews: [
            {
              user: 'Kabir L.',
              rating: 5,
              comment: 'Extremely creamy and rich!',
            },
          ],
        },

        // SIDES
        {
          name: 'Garlic Bread',
          description:
            'Freshly baked hand-pulled breadsticks brushed with garlic butter and herbs.',
          price: 139,
          imageUrl: '/images/products/garlic-bread.jpg',
          isAvailable: true,
          category: ProductCategory.SIDES,
          ingredients: [
            'Baguette Bread',
            'Garlic Butter',
            'Oregano',
            'Parsley',
          ],
          nutrition: { calories: 210, protein: '5g', fat: '8g', carbs: '26g' },
          reviews: [],
        },
        {
          name: 'Cheese Garlic Bread',
          description:
            'Fresh garlic bread loaded with melted mozzarella cheese.',
          price: 179,
          imageUrl: '/images/products/cheese-garlic-bread.jpg',
          isAvailable: true,
          category: ProductCategory.SIDES,
          ingredients: [
            'Baguette Bread',
            'Garlic Butter',
            'Mozzarella Cheese',
            'Oregano',
          ],
          nutrition: { calories: 280, protein: '8g', fat: '14g', carbs: '28g' },
          reviews: [
            {
              user: 'Anjali V.',
              rating: 5,
              comment: 'A perfect side for pizzas.',
            },
          ],
        },
        {
          name: 'French Fries',
          description:
            'Salted, golden and crispy potato french fries served with dip.',
          price: 119,
          imageUrl: '/images/products/french-fries.jpg',
          isAvailable: true,
          category: ProductCategory.SIDES,
          ingredients: ['Idaho Potatoes', 'Sea Salt', 'Vegetable Oil'],
          nutrition: { calories: 220, protein: '3g', fat: '10g', carbs: '30g' },
          reviews: [],
        },
        {
          name: 'Chicken Wings',
          description:
            'Juicy, oven-baked chicken wings tossed in fiery hot buffalo sauce.',
          price: 219,
          imageUrl: '/images/products/chicken-wings.jpg',
          isAvailable: true,
          category: ProductCategory.SIDES,
          ingredients: [
            'Chicken Wings',
            'Buffalo Hot Sauce',
            'Garlic Powder',
            'Butter',
          ],
          nutrition: { calories: 340, protein: '22g', fat: '24g', carbs: '3g' },
          reviews: [
            {
              user: 'Tushar H.',
              rating: 5,
              comment: 'Perfect levels of spice and tang!',
            },
          ],
        },

        // DRINKS
        {
          name: 'Pepsi',
          description: 'Chilled can of carbonated cola beverage (330ml).',
          price: 60,
          imageUrl: '/images/products/pepsi.jpg',
          isAvailable: true,
          category: ProductCategory.DRINKS,
          nutrition: { calories: 150, protein: '0g', fat: '0g', carbs: '41g' },
        },
        {
          name: 'Coke',
          description: 'Chilled can of classic Coca-Cola (330ml).',
          price: 60,
          imageUrl: '/images/products/coke.jpg',
          isAvailable: true,
          category: ProductCategory.DRINKS,
          nutrition: { calories: 140, protein: '0g', fat: '0g', carbs: '39g' },
        },
        {
          name: 'Sprite',
          description: 'Chilled can of lemon-lime soda (330ml).',
          price: 60,
          imageUrl: '/images/products/sprite.jpg',
          isAvailable: true,
          category: ProductCategory.DRINKS,
          nutrition: { calories: 140, protein: '0g', fat: '0g', carbs: '38g' },
        },
        {
          name: '7Up',
          description:
            'Chilled can of refreshingly light lemon-lime soda (330ml).',
          price: 60,
          imageUrl: '/images/products/7up.jpg',
          isAvailable: true,
          category: ProductCategory.DRINKS,
          nutrition: { calories: 140, protein: '0g', fat: '0g', carbs: '38g' },
        },
        {
          name: 'Mountain Dew',
          description: 'Chilled can of citrus flavored soda (330ml).',
          price: 60,
          imageUrl: '/images/products/mountain-dew.jpg',
          isAvailable: true,
          category: ProductCategory.DRINKS,
          nutrition: { calories: 170, protein: '0g', fat: '0g', carbs: '46g' },
        },
        {
          name: 'Water',
          description: 'Packaged premium mineral drinking water (500ml).',
          price: 40,
          imageUrl: '/images/products/water.jpg',
          isAvailable: true,
          category: ProductCategory.DRINKS,
          nutrition: { calories: 0, protein: '0g', fat: '0g', carbs: '0g' },
        },

        // COMBOS
        {
          name: 'Combo 1',
          description: 'Medium Pizza + Garlic Bread + Pepsi. Save 15%!',
          price: 599,
          imageUrl: '/images/products/combo-1.jpg',
          isAvailable: true,
          category: ProductCategory.COMBOS,
          comboItems: [
            {
              slotId: 1,
              name: 'Select Pizza',
              category: 'pizza',
              size: 'Medium',
            },
            {
              slotId: 2,
              name: 'Select Side',
              category: 'sides',
              defaultProduct: 'Garlic Bread',
            },
            {
              slotId: 3,
              name: 'Select Drink',
              category: 'drinks',
              defaultProduct: 'Pepsi',
            },
          ],
          ingredients: [
            'Includes custom Medium Pizza, 1 Garlic Bread side, and a standard beverage.',
          ],
          nutrition: {
            calories: 850,
            protein: '28g',
            fat: '32g',
            carbs: '98g',
          },
        },
        {
          name: 'Combo 2',
          description:
            'Large Pizza + Chicken Wings + 2 Drinks. Perfect for two!',
          price: 799,
          imageUrl: '/images/products/combo-2.jpg',
          isAvailable: true,
          category: ProductCategory.COMBOS,
          comboItems: [
            {
              slotId: 1,
              name: 'Select Pizza',
              category: 'pizza',
              size: 'Large',
            },
            {
              slotId: 2,
              name: 'Select Side',
              category: 'sides',
              defaultProduct: 'Chicken Wings',
            },
            {
              slotId: 3,
              name: 'Select Drink 1',
              category: 'drinks',
              defaultProduct: 'Pepsi',
            },
            {
              slotId: 4,
              name: 'Select Drink 2',
              category: 'drinks',
              defaultProduct: 'Coke',
            },
          ],
          ingredients: [
            'Includes custom Large Pizza, 1 Chicken Wings portion, and 2 beverages.',
          ],
          nutrition: {
            calories: 1100,
            protein: '42g',
            fat: '44g',
            carbs: '115g',
          },
        },
        {
          name: 'Family Feast',
          description:
            '2 Large Pizzas + Garlic Bread + Brownie + 4 Drinks. The ultimate party pack!',
          price: 1499,
          imageUrl: '/images/products/combo-3.jpg',
          isAvailable: true,
          category: ProductCategory.COMBOS,
          comboItems: [
            {
              slotId: 1,
              name: 'Select Pizza 1',
              category: 'pizza',
              size: 'Large',
            },
            {
              slotId: 2,
              name: 'Select Pizza 2',
              category: 'pizza',
              size: 'Large',
            },
            {
              slotId: 3,
              name: 'Select Side',
              category: 'sides',
              defaultProduct: 'Garlic Bread',
            },
            {
              slotId: 4,
              name: 'Select Dessert',
              category: 'desserts',
              defaultProduct: 'Brownie',
            },
            {
              slotId: 5,
              name: 'Select Drink 1',
              category: 'drinks',
              defaultProduct: 'Pepsi',
            },
            {
              slotId: 6,
              name: 'Select Drink 2',
              category: 'drinks',
              defaultProduct: 'Coke',
            },
            {
              slotId: 7,
              name: 'Select Drink 3',
              category: 'drinks',
              defaultProduct: 'Sprite',
            },
            {
              slotId: 8,
              name: 'Select Drink 4',
              category: 'drinks',
              defaultProduct: '7Up',
            },
          ],
          ingredients: [
            'Includes 2 custom Large Pizzas, 1 Garlic Bread side, 1 Brownie dessert, and 4 beverages.',
          ],
          nutrition: {
            calories: 2300,
            protein: '85g',
            fat: '90g',
            carbs: '260g',
          },
        },
      ];

      for (const prod of seedProducts) {
        await this.create(prod);
      }
      console.log('Seeding products database complete!');
    } catch (e) {
      console.error('Error seeding database:', e);
    }
  }

  async findAll(category?: ProductCategory): Promise<Product[]> {
    if (category) {
      return this.productRepository.find({
        where: { category, isAvailable: true },
      });
    }
    return this.productRepository.find({ where: { isAvailable: true } });
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const products = await this.productRepository.find();
    const product = products.find((p) => {
      const pSlug = p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      return pSlug === slug;
    });
    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }
    return product;
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    return this.productRepository.save(product);
  }

  async update(id: number, productData: Partial<Product>): Promise<Product> {
    const product = await this.findById(id);
    Object.assign(product, productData);
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findById(id);
    await this.productRepository.remove(product);
  }

  async findCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findCoupons(): Promise<Coupon[]> {
    return this.couponRepository.find({
      where: { isActive: true, isPublic: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getPublicCms(): Promise<Record<string, string>> {
    const items = await this.cmsContentRepository.find();
    const result: Record<string, string> = {};
    items.forEach((i) => {
      result[i.key] = i.value;
    });
    return result;
  }

  async getPublicSettings(): Promise<Record<string, string>> {
    const items = await this.systemSettingRepository.find();
    const result: Record<string, string> = {};
    items.forEach((i) => {
      // Exclude sensitive settings like SMTP credentials in public queries
      if (i.key !== 'smtp_settings') {
        result[i.key] = i.value;
      }
    });
    return result;
  }
}
