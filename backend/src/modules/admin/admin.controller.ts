import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

// Multer storage config helper
const mediaStorage = diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const folder = req.query.folder || 'products';
    const dest = join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `file-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get overview metadata and chart aggregates' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get live KPI values and dashboard summaries' })
  async getDashboardData() {
    return this.adminService.getDashboardData();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get live charts and statistics analytics' })
  async getAnalyticsData() {
    return this.adminService.getAnalyticsData();
  }

  @Get('users')
  @ApiOperation({ summary: 'Retrieve customers and administration users list' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/status')
  @ApiOperation({
    summary: 'Toggle status active or blocked on customer account',
  })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'active' | 'blocked',
    @Request() req: any,
  ) {
    const updated = await this.adminService.updateUserStatus(id, status);
    await this.adminService.createAuditLog(
      'UPDATE_USER_STATUS',
      `Modified user ${updated.email} status to ${status}`,
      req.ip,
      req.user,
    );
    return updated;
  }

  // Coupons CRUD
  @Get('coupons')
  @ApiOperation({ summary: 'List all promotional discount codes' })
  async getAllCoupons() {
    return this.adminService.getAllCoupons();
  }

  @Post('coupons')
  @ApiOperation({ summary: 'Create a new coupon discount rule' })
  async createCoupon(@Body() data: any, @Request() req: any) {
    const coupon = await this.adminService.createCoupon(data);
    await this.adminService.createAuditLog(
      'CREATE_COUPON',
      `Created coupon code ${coupon.code}`,
      req.ip,
      req.user,
    );
    return coupon;
  }

  @Patch('coupons/:id')
  @ApiOperation({ summary: 'Update coupon details' })
  async updateCoupon(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @Request() req: any,
  ) {
    const coupon = await this.adminService.updateCoupon(id, data);
    await this.adminService.createAuditLog(
      'UPDATE_COUPON',
      `Updated coupon ID ${id}`,
      req.ip,
      req.user,
    );
    return coupon;
  }

  @Delete('coupons/:id')
  @ApiOperation({ summary: 'Remove a coupon discount rule' })
  async deleteCoupon(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    await this.adminService.deleteCoupon(id);
    await this.adminService.createAuditLog(
      'DELETE_COUPON',
      `Deleted coupon ID ${id}`,
      req.ip,
      req.user,
    );
    return { success: true };
  }

  // Category CRUD
  @Get('categories')
  @ApiOperation({ summary: 'List categories with sorting' })
  async getAllCategories() {
    return this.adminService.getAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new catalog category' })
  async createCategory(@Body() data: any, @Request() req: any) {
    const cat = await this.adminService.createCategory(data);
    await this.adminService.createAuditLog(
      'CREATE_CATEGORY',
      `Created category: ${cat.name}`,
      req.ip,
      req.user,
    );
    return cat;
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update category rules and sorting order' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @Request() req: any,
  ) {
    const cat = await this.adminService.updateCategory(id, data);
    await this.adminService.createAuditLog(
      'UPDATE_CATEGORY',
      `Updated category ID ${id}`,
      req.ip,
      req.user,
    );
    return cat;
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    await this.adminService.deleteCategory(id);
    await this.adminService.createAuditLog(
      'DELETE_CATEGORY',
      `Deleted category ID ${id}`,
      req.ip,
      req.user,
    );
    return { success: true };
  }

  // Reviews Moderate
  @Get('reviews')
  @ApiOperation({ summary: 'Get all product feedback reviews' })
  async getAllReviews() {
    return this.adminService.getAllReviews();
  }

  @Patch('reviews/:id/status')
  @ApiOperation({ summary: 'Approve or Reject user review' })
  async updateReviewStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'pending' | 'approved' | 'rejected',
    @Request() req: any,
  ) {
    const updated = await this.adminService.updateReviewStatus(id, status);
    await this.adminService.createAuditLog(
      'MODERATE_REVIEW',
      `Set review ID ${id} status to ${status}`,
      req.ip,
      req.user,
    );
    return updated;
  }

  @Post('reviews/:id/reply')
  @ApiOperation({ summary: 'Post administrator reply on review card' })
  async replyToReview(
    @Param('id', ParseIntPipe) id: number,
    @Body('reply') reply: string,
    @Request() req: any,
  ) {
    const updated = await this.adminService.replyToReview(id, reply);
    await this.adminService.createAuditLog(
      'REPLY_REVIEW',
      `Replied to review ID ${id}`,
      req.ip,
      req.user,
    );
    return updated;
  }

  @Post('reviews/:id/report')
  @ApiOperation({ summary: 'Report review details as abuse' })
  async reportAbuseReview(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.reportAbuseReview(id);
  }

  // CMS Endpoints
  @Get('cms')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve layouts CMS banners strings' })
  async getCmsContent() {
    return this.adminService.getCmsContent();
  }

  @Patch('cms')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update text block or campaign banner key' })
  async updateCmsContent(
    @Body('key') key: string,
    @Body('value') value: string,
    @Request() req: any,
  ) {
    const updated = await this.adminService.updateCmsContent(key, value);
    await this.adminService.createAuditLog(
      'UPDATE_CMS',
      `Modified CMS key: ${key}`,
      req.ip,
      req.user,
    );
    return updated;
  }

  // Settings
  @Get('settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Retrieve business hours and store margins settings',
  })
  async getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Patch('settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Save new charges rates or store timings config' })
  async updateSystemSetting(
    @Body('key') key: string,
    @Body('value') value: string,
    @Request() req: any,
  ) {
    const updated = await this.adminService.updateSystemSetting(key, value);
    await this.adminService.createAuditLog(
      'UPDATE_SETTING',
      `Modified settings key: ${key}`,
      req.ip,
      req.user,
    );
    return updated;
  }

  // Audit Logs
  @Get('audit-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get history log of admin actions' })
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  // Media Library Image Upload endpoint
  @Post('media/upload')
  @ApiOperation({ summary: 'Upload file to specified sub-folder' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: mediaStorage,
      fileFilter: (req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|svg\+xml)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    }),
  )
  async uploadMedia(
    @UploadedFile() file: any,
    @Query('folder') folder = 'products',
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    const publicUrl = `http://localhost:4000/uploads/${folder}/${file.filename}`;
    await this.adminService.createAuditLog(
      'UPLOAD_MEDIA',
      `Uploaded image to uploads/${folder}: ${file.filename}`,
      req.ip,
      req.user,
    );
    return {
      name: file.filename,
      size: file.size,
      folder,
      url: publicUrl,
    };
  }

  @Get('media')
  @ApiOperation({ summary: 'Retrieve loaded folder media assets list' })
  async getMediaLibrary(@Query('folder') folder = 'products') {
    const path = join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(path)) {
      return [];
    }
    const files = fs.readdirSync(path);
    return files.map((file) => {
      const stats = fs.statSync(join(path, file));
      return {
        name: file,
        size: stats.size,
        folder,
        url: `http://localhost:4000/uploads/${folder}/${file}`,
        createdAt: stats.birthtime,
      };
    });
  }

  @Delete('media')
  @ApiOperation({ summary: 'Delete file from folder' })
  async deleteMedia(
    @Query('folder') folder: string,
    @Query('filename') filename: string,
    @Request() req: any,
  ) {
    if (!folder || !filename) {
      throw new BadRequestException(
        'Folder and filename parameters are required',
      );
    }
    const path = join(process.cwd(), 'uploads', folder, filename);
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
      await this.adminService.createAuditLog(
        'DELETE_MEDIA',
        `Deleted image uploads/${folder}/${filename}`,
        req.ip,
        req.user,
      );
      return { success: true };
    }
    throw new BadRequestException('File not found');
  }

  // Broadcast marketing notifications and email
  @Post('broadcast-notification')
  @ApiOperation({ summary: 'Broadcast marketing notifications and email' })
  async broadcastNotification(
    @Body('subject') subject: string,
    @Body('title') title: string,
    @Body('message') message: string,
    @Request() req: any,
  ) {
    const finalSubject = subject || title;
    const result = await this.adminService.sendBroadcastNotification(
      finalSubject,
      message,
    );
    await this.adminService.createAuditLog(
      'BROADCAST_NOTIFICATION',
      `Sent broadcast: ${finalSubject}`,
      req.ip,
      req.user,
    );
    return result;
  }

  @Get('broadcast-history')
  @ApiOperation({
    summary: 'Retrieve broadcast logs and delivery status history',
  })
  async getBroadcastHistory() {
    return this.adminService.getBroadcastHistory();
  }

  @Post('managers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new manager user' })
  async createManager(@Body() data: any) {
    return this.adminService.createManager(data);
  }

  @Get('managers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all manager users list' })
  async getManagers() {
    return this.adminService.getManagers();
  }
}
