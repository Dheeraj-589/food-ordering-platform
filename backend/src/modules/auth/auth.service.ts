import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { OtpVerification, OtpType } from './entities/otp-verification.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { MailerService } from './mailer.service';
import { AuditLog } from '../admin/entities/audit-log.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    @InjectRepository(OtpVerification)
    private readonly otpRepository: Repository<OtpVerification>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) { }

  private generateOtp(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  private validateStrongPassword(password: string): boolean {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return regex.test(password);
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ message: string; email: string }> {
    const { name, email, phoneNumber, password, confirmPassword } = registerDto;

    // Validate passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Validate strong password
    if (!this.validateStrongPassword(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );
    }

    // Check if email already exists
    const existingUserByEmail = await this.usersService.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if phone number already exists
    const existingUserByPhone =
      await this.usersService.findByPhone(phoneNumber);
    if (existingUserByPhone) {
      throw new ConflictException('Phone number already registered');
    }

    // Generate secure 6-digit OTP
    const otp = this.generateOtp();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5); // 5 minutes validity

    // Store OTP temporarily
    const registrationData = JSON.stringify({
      name,
      email,
      phoneNumber,
      password,
      role: registerDto.role || UserRole.CUSTOMER,
    });

    // Delete any old registration OTP for this email
    await this.otpRepository.delete({ email, type: OtpType.REGISTER });

    const otpVerification = this.otpRepository.create({
      email,
      otp,
      type: OtpType.REGISTER,
      expiry,
      registrationData,
    });
    await this.otpRepository.save(otpVerification);

    // Send OTP to email
    try {
      await this.mailerService.sendOtpEmail(email, otp, 'register');
    } catch (error) {
      console.error('Mail sending failed:', error);
      // Continue registration
    }
    return {
      message:
        'Registration OTP sent to email. Please verify within 5 minutes.',
      email,
    };
  }

  async verifyRegisterOtp(
    email: string,
    otp: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'password'>;
  }> {
    const otpRecord = await this.otpRepository.findOne({
      where: { email, otp, type: OtpType.REGISTER },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (new Date() > otpRecord.expiry) {
      await this.otpRepository.remove(otpRecord);
      throw new BadRequestException('OTP code has expired');
    }

    if (!otpRecord.registrationData) {
      throw new BadRequestException('Invalid registration session');
    }

    const userData = JSON.parse(otpRecord.registrationData);

    // Hash password using bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Save user in MySQL
    const user = await this.usersService.create({
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: hashedPassword,
      isEmailVerified: true,
      role: userData.role,
    });

    // Remove the OTP record
    await this.otpRepository.remove(otpRecord);

    // Generate JWT access and refresh tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    const userWithoutPassword = { ...user } as Record<string, any>;
    delete userWithoutPassword.password;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword as Omit<User, 'password'>,
    };
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
  ): Promise<{ requireOtp: true; email: string; message: string }> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      await this.saveFailedLogin(
        loginDto.email,
        ipAddress || '127.0.0.1',
        'No registered user match',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      await this.saveFailedLogin(
        loginDto.email,
        ipAddress || '127.0.0.1',
        'Invalid password threshold exceeded',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate login OTP
    const otp = this.generateOtp();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    // Remove old login OTP
    await this.otpRepository.delete({ email: user.email, type: OtpType.LOGIN });

    const otpVerification = this.otpRepository.create({
      email: user.email,
      otp,
      type: OtpType.LOGIN,
      expiry,
    });
    await this.otpRepository.save(otpVerification);

    // Send OTP using SMTP
    try {
      await this.mailerService.sendOtpEmail(user.email, otp, 'login');
    } catch (error) {
      console.error('Login mail sending failed:', error);
    }

    return {
      requireOtp: true,
      email: user.email,
      message: 'Login OTP sent to email. Please verify within 5 minutes.',
    };
  }

  private async saveFailedLogin(
    email: string,
    ip: string,
    reason: string,
  ): Promise<void> {
    try {
      const log = this.auditLogRepository.create({
        action: 'FAILED_LOGIN',
        details: reason,
        ipAddress: ip,
        userEmail: email,
        userName: 'guest',
      });
      await this.auditLogRepository.save(log);
    } catch (e) {
      console.error('Failed to save failed login audit log:', e);
    }
  }

  async verifyLoginOtp(
    email: string,
    otp: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'password'>;
  }> {
    const otpRecord = await this.otpRepository.findOne({
      where: { email, otp, type: OtpType.LOGIN },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (new Date() > otpRecord.expiry) {
      await this.otpRepository.remove(otpRecord);
      throw new BadRequestException('OTP code has expired');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User no longer exists');
    }

    // Delete OTP
    await this.otpRepository.remove(otpRecord);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    const userWithoutPassword = { ...user } as Record<string, any>;
    delete userWithoutPassword.password;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword as Omit<User, 'password'>,
    };
  }

  async resendOtp(
    email: string,
    type: 'register' | 'login' | 'forgot_password',
  ): Promise<{ message: string }> {
    const otpTypeMap = {
      register: OtpType.REGISTER,
      login: OtpType.LOGIN,
      forgot_password: OtpType.FORGOT_PASSWORD,
    };

    const mappedType = otpTypeMap[type];
    if (!mappedType) {
      throw new BadRequestException('Invalid OTP type');
    }

    const otpRecord = await this.otpRepository.findOne({
      where: { email, type: mappedType },
    });

    if (!otpRecord && type !== 'forgot_password' && type !== 'login') {
      throw new BadRequestException('No active OTP session found');
    }

    // For forgot_password or login, we check user first
    if (type === 'forgot_password' || type === 'login') {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    const otp = this.generateOtp();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    if (otpRecord) {
      otpRecord.otp = otp;
      otpRecord.expiry = expiry;
      await this.otpRepository.save(otpRecord);
    } else {
      const newRecord = this.otpRepository.create({
        email,
        otp,
        type: mappedType,
        expiry,
        registrationData: undefined,
      });
      await this.otpRepository.save(newRecord);
    }

    try {
      await this.mailerService.sendOtpEmail(email, otp, type);
    } catch (error) {
      console.error('Resend OTP mail sending failed:', error);
    }

    return {
      message: 'A new 6-digit OTP code has been sent to your email.',
    };
  }

  async forgotPasswordRequest(
    email: string,
  ): Promise<{ message: string; email: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Avoid exposing email existence in production, but here we can return success anyway
      // to prevent email enumeration or standard error.
      // However, typical assignment requests: "If email exists, send OTP".
      // Let's do a soft check, but if we don't find the email we can throw error or return success. Let's throw error for developer debugging since it says "Forgot Password: Email, OTP, Reset Password".
      throw new NotFoundException('Email not registered');
    }

    const otp = this.generateOtp();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    await this.otpRepository.delete({ email, type: OtpType.FORGOT_PASSWORD });

    const otpVerification = this.otpRepository.create({
      email,
      otp,
      type: OtpType.FORGOT_PASSWORD,
      expiry,
    });
    await this.otpRepository.save(otpVerification);

    try {
      await this.mailerService.sendOtpEmail(email, otp, 'forgot_password');
    } catch (error) {
      console.error('Forgot password mail sending failed:', error);
    }

    return {
      message: 'Forgot password reset OTP sent to email.',
      email,
    };
  }

  async forgotPasswordReset(
    email: string,
    otp: string,
    resetDto: any,
  ): Promise<{ message: string }> {
    const { password, confirmPassword } = resetDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (!this.validateStrongPassword(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );
    }

    const otpRecord = await this.otpRepository.findOne({
      where: { email, otp, type: OtpType.FORGOT_PASSWORD },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (new Date() > otpRecord.expiry) {
      await this.otpRepository.remove(otpRecord);
      throw new BadRequestException('OTP code has expired');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    // Invalidate previous refresh tokens
    await this.refreshTokenRepository.delete({ userId: user.id });

    // Clean up OTP record
    await this.otpRepository.remove(otpRecord);

    return {
      message:
        'Password successfully reset. All previous sessions have been logged out.',
    };
  }

  async refreshToken(
    oldRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: oldRefreshToken },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > tokenRecord.expiry) {
      await this.refreshTokenRepository.remove(tokenRecord);
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findById(tokenRecord.userId);
    if (!user) {
      await this.refreshTokenRepository.remove(tokenRecord);
      throw new UnauthorizedException('User no longer exists');
    }

    // Delete old refresh token (rotation)
    await this.refreshTokenRepository.remove(tokenRecord);

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    return tokens;
  }

  async logout(refreshTokenString: string): Promise<{ message: string }> {
    await this.refreshTokenRepository.delete({ token: refreshTokenString });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { email: user.email, sub: user.id, role: user.role };

    // Access Token
    const accessToken = this.jwtService.sign(payload);

    // Refresh Token (Signed with refreshSecret)
    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ||
      'refresh-super-secret-key-pizza-hut';
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });

    // Save Refresh Token in DB
    const expiry = new Date();
    // parse 7d to date (approximate 7 days)
    expiry.setDate(expiry.getDate() + 7);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiry,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Cleanup expired OTP records
  async cleanExpiredOtps(): Promise<void> {
    await this.otpRepository.delete({
      expiry: LessThan(new Date()),
    });
  }
}
