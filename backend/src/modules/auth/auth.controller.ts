import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import {
  VerifyOtpDto,
  ResendOtpDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResetDto,
  RefreshTokenDto,
} from './dto/auth-flow.dto';

interface RequestWithUser extends ExpressRequest {
  user: User;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Initiate registration (sends verification OTP)' })
  @ApiResponse({ status: 201, description: 'OTP successfully sent to email.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or passwords do not match.',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone number already exists.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify register OTP and create user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully created and logged in.',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  async verifyRegister(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyRegisterOtp(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and send login OTP' })
  @ApiResponse({
    status: 200,
    description: 'Credentials verified. Login OTP sent to email.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password credentials.',
  })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    return this.authService.login(loginDto, req.ip);
  }

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify login OTP and issue JWT access & refresh tokens',
  })
  @ApiResponse({ status: 200, description: 'Logged in successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  async verifyLogin(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyLoginOtp(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP verification code' })
  @ApiResponse({ status: 200, description: 'OTP successfully resent.' })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto.email, resendOtpDto.type);
  }

  @Post('forgot-password/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset (sends OTP)' })
  @ApiResponse({ status: 200, description: 'Forgot password reset OTP sent.' })
  @ApiResponse({ status: 404, description: 'Email address not found.' })
  async forgotPasswordRequest(
    @Body() forgotPasswordRequestDto: ForgotPasswordRequestDto,
  ) {
    return this.authService.forgotPasswordRequest(
      forgotPasswordRequestDto.email,
    );
  }

  @Post('forgot-password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify forgot-password OTP and update password' })
  @ApiResponse({ status: 200, description: 'Password successfully reset.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP or password strength check failed.',
  })
  async forgotPasswordReset(
    @Body() forgotPasswordResetDto: ForgotPasswordResetDto,
  ) {
    const { email, otp, ...resetData } = forgotPasswordResetDto;
    return this.authService.forgotPasswordReset(email, otp, resetData);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT access token using a refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Access token successfully refreshed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token.',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out and invalidate the refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve logged-in user profile details' })
  @ApiResponse({ status: 200, description: 'User details returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized request.' })
  getProfile(@Request() req: RequestWithUser): Omit<User, 'password'> {
    const userWithoutPassword = { ...req.user } as Record<string, any>;
    delete userWithoutPassword.password;
    return userWithoutPassword as Omit<User, 'password'>;
  }
}
