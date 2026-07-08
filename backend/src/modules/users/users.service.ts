import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    try {
      const defaultUsers = [
        {
          name: 'Admin User',
          email: 'admin@foodies.com',
          role: UserRole.ADMIN,
          phone: '+919999999999',
        },
        {
          name: 'Manager User',
          email: 'manager@foodies.com',
          role: UserRole.MANAGER,
          phone: '+918888888888',
        },
        {
          name: 'Kitchen Chef',
          email: 'kitchen@foodies.com',
          role: UserRole.KITCHEN,
          phone: '+917777777777',
        },
        {
          name: 'Delivery Rider',
          email: 'delivery@foodies.com',
          role: UserRole.DELIVERY,
          phone: '+916666666666',
        },
        {
          name: 'Standard Customer',
          email: 'customer@foodies.com',
          role: UserRole.CUSTOMER,
          phone: '+915555555555',
        },
      ];

      for (const u of defaultUsers) {
        const exists = await this.userRepository.findOne({
          where: { email: u.email },
        });
        if (!exists) {
          const hashedPassword = await bcrypt.hash('Password@123', 10);
          const user = this.userRepository.create({
            name: u.name,
            email: u.email,
            phoneNumber: u.phone,
            password: hashedPassword,
            role: u.role,
            status: 'active',
            loyaltyPoints: u.role === UserRole.CUSTOMER ? 150 : 0,
            rewardLevel: u.role === UserRole.CUSTOMER ? 'Silver' : 'Bronze',
          });
          await this.userRepository.save(user);
          console.log(`Seeded ${u.role} user: ${u.email}`);
        }
      }
    } catch (e) {
      console.error('Error seeding default users:', e);
    }
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: userData.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }
    }
    if (userData.phoneNumber) {
      const existingPhone = await this.userRepository.findOne({
        where: { phoneNumber: userData.phoneNumber },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phoneNumber } });
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.userRepository.update(id, { password: passwordHash });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
