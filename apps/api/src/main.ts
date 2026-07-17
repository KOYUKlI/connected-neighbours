import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';

import { AppModule } from './app.module';

async function bootstrap() {
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  const cookieSecret = process.env.COOKIE_SECRET ?? 'change-me-in-env';

  const rawCorsOrigins =
    process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174';

  const corsOrigins = rawCorsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Sécurité Fastify : doit être enregistré tôt
  await app.register(helmet);

  // Cookies utiles pour auth/session/refresh token plus tard
  await app.register(fastifyCookie, {
    secret: cookieSecret,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  // Préfixe global de l'API
  app.setGlobalPrefix('api');

  // Validation globale DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS pour les fronts React
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Connected Neighbours API')
    .setDescription('Documentation de l’API REST de Connected Neighbours')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(port, host);

  Logger.log(`API démarrée sur http://${host}:${port}/api`, 'Bootstrap');
  Logger.log(`Swagger disponible sur http://${host}:${port}/docs`, 'Bootstrap');
}

void bootstrap();
