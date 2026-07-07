import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  IsEnum,
  MinLength,
} from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp!: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'register',
    enum: ['register', 'login', 'forgot_password'],
  })
  @IsNotEmpty()
  @IsEnum(['register', 'login', 'forgot_password'])
  type!: 'register' | 'login' | 'forgot_password';
}

export class ForgotPasswordRequestDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ForgotPasswordResetDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp!: string;

  @ApiProperty({ example: 'newPassword123!', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'newPassword123!' })
  @IsNotEmpty()
  @IsString()
  confirmPassword!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'some-refresh-token-jwt' })
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}
