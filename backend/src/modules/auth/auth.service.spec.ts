import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditLog } from '../admin/entities/audit-log.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    updatePassword: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
  };

  const refreshTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const auditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokenRepository },
        { provide: getRepositoryToken(AuditLog), useValue: auditLogRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('registers users directly without an OTP step', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByPhone.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 1,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phoneNumber: '+919999999999',
      password: 'hashed-password',
      role: UserRole.CUSTOMER,
    } as User);
    jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

    const result = await service.register({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phoneNumber: '+919999999999',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: UserRole.CUSTOMER,
    });

    expect(result.message).toContain('registered successfully');
    expect(usersService.create).toHaveBeenCalled();
  });
});
