import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private requests: Map<string, { count: number; resetTime: number }> =
    new Map();
  private readonly WINDOW_SIZE_MS = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 100; // max 100 requests per minute per IP

  use(req: Request, res: Response, next: NextFunction) {
    const ip =
      req.ip || (req.headers['x-forwarded-for'] as string) || 'anonymous';
    const now = Date.now();
    const clientData = this.requests.get(ip);

    if (!clientData || now > clientData.resetTime) {
      this.requests.set(ip, { count: 1, resetTime: now + this.WINDOW_SIZE_MS });
      return next();
    }

    clientData.count++;
    if (clientData.count > this.MAX_REQUESTS) {
      throw new HttpException(
        'Too many requests from this IP, please try again after a minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
