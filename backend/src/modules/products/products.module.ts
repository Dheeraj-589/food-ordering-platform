import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../admin/entities/category.entity';
import { Coupon } from '../admin/entities/coupon.entity';
import { CmsContent } from '../admin/entities/cms-content.entity';
import { SystemSetting } from '../admin/entities/system-setting.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Coupon,
      CmsContent,
      SystemSetting,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
