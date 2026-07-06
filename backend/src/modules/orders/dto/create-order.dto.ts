import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @ApiProperty({ example: 1, description: 'Product identifier' })
  @IsInt()
  @IsNotEmpty()
  productId!: number;

  @ApiProperty({ example: 2, description: 'Quantity of this item' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity!: number;

  @ApiProperty({
    example: 'Extra cheese, thin crust',
    description: 'Special instructions',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class CreateOrderDto {
  @ApiProperty({
    example: '123 Pizza Street, Food City',
    description: 'Delivery destination address',
  })
  @IsNotEmpty()
  @IsString()
  deliveryAddress!: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Items included in the order',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
