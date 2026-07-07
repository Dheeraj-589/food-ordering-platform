import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the user' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Unique email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Unique phone number',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    example: 'securePassword123',
    description:
      'Password, minimum 8 characters with at least one uppercase, lowercase, number, and special character',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Password confirmation',
  })
  @IsNotEmpty()
  @IsString()
  confirmPassword!: string;

  @ApiProperty({
    example: 'customer',
    enum: UserRole,
    description: 'System role',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
