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
  app.enableCors({
    origin: '*', // In production, replace with specific frontend domains
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
  await app.listen(port);
  console.log(`Server successfully started on http://localhost:${port}/api`);
  console.log(
    `Swagger documentation running on http://localhost:${port}/api/docs`,
  );
}
bootstrap().catch((err) => {
  console.error('Error starting backend application:', err);
});
