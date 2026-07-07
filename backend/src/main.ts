import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Serve static assets from backend/uploads directory
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Set global path prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  const frontendUrl = configService.get<string>('frontendUrl');
  const allowedOrigins = ['http://localhost:3000'];
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        const normalizedAllowed = allowed.replace(/\/$/, '');
        const normalizedOrigin = origin.replace(/\/$/, '');
        return normalizedOrigin === normalizedAllowed;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure Swagger Document API
  const config = new DocumentBuilder()
    .setTitle('Pizza Platform API')
    .setDescription('Pizza Hut inspired food-ordering full-stack platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Retrieve port from env configurations
  const port = configService.get<number>('port') || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server successfully started on http://0.0.0.0:${port}/api`);
  console.log(
    `Swagger documentation running on http://0.0.0.0:${port}/api/docs`,
  );
}
bootstrap().catch((err) => {
  console.error('Error starting backend application:', err);
});
