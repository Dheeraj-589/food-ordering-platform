import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { Category } from './entities/category.entity';
import { Coupon } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { Broadcast } from './entities/broadcast.entity';
import { Review } from './entities/review.entity';
import { AuditLog } from './entities/audit-log.entity';
import { CmsContent } from './entities/cms-content.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Coupon,
      CouponUsage,
      Broadcast,
      Review,
      AuditLog,
      CmsContent,
      SystemSetting,
      Order,
      User,
      Product,
    ]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
