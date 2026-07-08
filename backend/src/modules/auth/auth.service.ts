import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditLog } from '../admin/entities/audit-log.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

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

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (!this.validateStrongPassword(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );
    }

    const existingUserByEmail = await this.usersService.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingUserByPhone = await this.usersService.findByPhone(phoneNumber);
    if (existingUserByPhone) {
      throw new ConflictException('Phone number already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersService.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      role: registerDto.role || UserRole.CUSTOMER,
    });

    return {
      message: 'User registered successfully.',
      email,
    };
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'password'>;
  }> {
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

    const { accessToken, refreshToken } = await this.generateTokens(user);

    const userWithoutPassword = { ...user } as Record<string, any>;
    delete userWithoutPassword.password;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword as Omit<User, 'password'>,
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

    await this.refreshTokenRepository.remove(tokenRecord);

    return this.generateTokens(user);
  }

  async logout(refreshTokenString: string): Promise<{ message: string }> {
    await this.refreshTokenRepository.delete({ token: refreshTokenString });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload);

    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ||
      'refresh-super-secret-key-pizza-hut';
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });

    const expiry = new Date();
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

}
