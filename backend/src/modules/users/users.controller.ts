import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

// Ensure avatars upload directory exists
const uploadDir = join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.id);
    const { password, ...result } = user;
    return result;
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile details' })
  async updateProfile(
    @Request() req: any,
    @Body()
    body: {
      name?: string;
      email?: string;
      phoneNumber?: string;
      language?: string;
      darkMode?: boolean;
    },
  ) {
    const user = await this.usersService.findById(req.user.id);

    if (body.name !== undefined) user.name = body.name;
    if (body.email !== undefined && body.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: body.email },
      });
      if (existing && existing.id !== user.id) {
        throw new BadRequestException(
          'Email already registered by another account',
        );
      }
      user.email = body.email;
    }
    if (
      body.phoneNumber !== undefined &&
      body.phoneNumber !== user.phoneNumber
    ) {
      const existing = await this.userRepository.findOne({
        where: { phoneNumber: body.phoneNumber },
      });
      if (existing && existing.id !== user.id) {
        throw new BadRequestException(
          'Phone number already registered by another account',
        );
      }
      user.phoneNumber = body.phoneNumber;
    }
    if (body.language !== undefined) user.language = body.language;
    if (body.darkMode !== undefined) user.darkMode = body.darkMode;

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword?: string; newPassword?: string },
  ) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException(
        'Both currentPassword and newPassword are required',
      );
    }

    const user = await this.usersService.findById(req.user.id);
    const isMatch = await bcrypt.compare(body.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    if (body.newPassword.length < 6) {
      throw new BadRequestException(
        'New password must be at least 6 characters long',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(body.newPassword, salt);
    await this.usersService.updatePassword(user.id, hash);

    return { message: 'Password updated successfully' };
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user profile avatar photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `avatar-${req.user.id}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    }),
  )
  async uploadAvatar(@Request() req: any, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const user = await this.usersService.findById(req.user.id);
    const publicUrl = `http://localhost:4000/uploads/avatars/${file.filename}`;
    user.avatarUrl = publicUrl;

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  @Patch('addresses')
  @ApiOperation({ summary: 'Update saved delivery addresses list' })
  async updateAddresses(
    @Request() req: any,
    @Body('addresses') addresses: any[],
  ) {
    if (!Array.isArray(addresses)) {
      throw new BadRequestException('Addresses must be an array');
    }

    const user = await this.usersService.findById(req.user.id);
    user.addresses = JSON.stringify(addresses);

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  @Patch('wishlist')
  @ApiOperation({ summary: 'Update product wishlist list' })
  async updateWishlist(
    @Request() req: any,
    @Body('wishlist') wishlist: number[],
  ) {
    if (!Array.isArray(wishlist)) {
      throw new BadRequestException('Wishlist must be an array of product IDs');
    }

    const user = await this.usersService.findById(req.user.id);
    user.wishlist = JSON.stringify(wishlist);

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  @Patch('notifications')
  @ApiOperation({ summary: 'Update user notifications array' })
  async updateNotifications(
    @Request() req: any,
    @Body('notifications') notifications: any[],
  ) {
    if (!Array.isArray(notifications)) {
      throw new BadRequestException('Notifications must be an array');
    }

    const user = await this.usersService.findById(req.user.id);
    user.notifications = JSON.stringify(notifications);

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  @Patch('loyalty')
  @ApiOperation({ summary: 'Update user loyalty points' })
  async updateLoyalty(
    @Request() req: any,
    @Body() body: { points?: number; rewardLevel?: string },
  ) {
    const user = await this.usersService.findById(req.user.id);
    if (body.points !== undefined) {
      user.loyaltyPoints = body.points;
    }
    if (body.rewardLevel !== undefined) {
      user.rewardLevel = body.rewardLevel;
    }

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }
}
