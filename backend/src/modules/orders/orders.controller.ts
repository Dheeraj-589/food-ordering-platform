import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus } from './entities/order.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

interface RequestWithUser extends ExpressRequest {
  user: User;
}

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('validate-coupon')
  @ApiOperation({ summary: 'Validate coupon for order' })
  @ApiResponse({ status: 200, description: 'Coupon validation result.' })
  async validateCoupon(
    @Body('code') code: string,
    @Body('subtotal') subtotal: number,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.validateCoupon(code, subtotal, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Place a new pizza order' })
  @ApiResponse({ status: 201, description: 'Order successfully created.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid item data or product out of stock.',
  })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve order history list' })
  @ApiResponse({ status: 200, description: 'Order history list returned.' })
  async findAll(@Request() req: RequestWithUser) {
    if (
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.DELIVERY
    ) {
      return this.ordersService.findAll();
    }
    return this.ordersService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve specific order details' })
  @ApiResponse({ status: 200, description: 'Order details returned.' })
  @ApiResponse({
    status: 403,
    description: "Forbidden from viewing another user's order.",
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    const order = await this.ordersService.findById(id);
    if (
      order.user.id !== req.user.id &&
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.DELIVERY
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }
    return order;
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DELIVERY)
  @ApiOperation({
    summary: 'Update order tracking status (Admin/Delivery only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Order status successfully modified.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  @Patch(':id/simulate-status')
  @ApiOperation({
    summary: 'Update order status for simulation (Customer/Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Order status successfully modified.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async simulateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  @Patch(':id/payment')
  @ApiOperation({
    summary: 'Update order payment status (User/Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Order payment status successfully modified.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('paymentStatus') paymentStatus: PaymentStatus,
    @Request() req: RequestWithUser,
  ) {
    const order = await this.ordersService.findById(id);
    if (order.user.id !== req.user.id && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to update this order payment status',
      );
    }
    return this.ordersService.updatePaymentStatus(id, paymentStatus);
  }
}
