import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AlertsModule } from './alerts/alerts.module';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { ContractsModule } from './contracts/contracts.module';
import { DocumentsModule } from './documents/documents.module';
import { DslModule } from './dsl/dsl.module';
import { EventsModule } from './events/events.module';
import { IncidentsModule } from './incidents/incidents.module';
import { MessagingModule } from './messaging/messaging.module';
import { NeighborhoodsModule } from './neighborhoods/neighborhoods.module';
import { PointsModule } from './points/points.module';
import { RgpdModule } from './rgpd/rgpd.module';
import { ServicesModule } from './services/services.module';
import { SyncModule } from './sync/sync.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env.local', '../../.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),

        HOST: Joi.string().default('0.0.0.0'),
        PORT: Joi.number().port().default(3000),

        CORS_ORIGIN: Joi.string().required(),
        COOKIE_SECRET: Joi.string().min(8).required(),

        MONGODB_URI: Joi.string().uri().required(),

        NEO4J_URI: Joi.string().required(),
        NEO4J_USERNAME: Joi.string().required(),
        NEO4J_PASSWORD: Joi.string().required(),

        MINIO_ENDPOINT: Joi.string().required(),
        MINIO_PORT: Joi.number().port().required(),
        MINIO_USE_SSL: Joi.boolean().required(),
        MINIO_PUBLIC_ENDPOINT: Joi.string().optional(),
        MINIO_PUBLIC_PORT: Joi.number().port().optional(),
        MINIO_PUBLIC_USE_SSL: Joi.boolean().optional(),
        MINIO_ACCESS_KEY: Joi.string().required(),
        MINIO_SECRET_KEY: Joi.string().required(),
        MINIO_BUCKET: Joi.string().required(),

        KEYCLOAK_BASE_URL: Joi.string().uri().required(),
        KEYCLOAK_REALM: Joi.string().required(),
        KEYCLOAK_CLIENT_ID: Joi.string().required(),
        KEYCLOAK_CLIENT_SECRET: Joi.string().required(),

        JWT_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRES_IN: Joi.string().default('1d'),
        DEV_AUTH_SEED: Joi.boolean().default(true),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    MongooseModule.forRootAsync({
      useFactory: () => {
        const isTest = process.env.NODE_ENV === 'test';

        return {
          uri: process.env.MONGODB_URI,
          retryAttempts: isTest ? 1 : 9,
          retryDelay: isTest ? 500 : 3000,
          serverSelectionTimeoutMS: isTest ? 5000 : undefined,
        };
      },
    }),

    AdminModule,
    ServicesModule,
    ApplicationsModule,
    AuthModule,
    PointsModule,
    ContractsModule,
    NeighborhoodsModule,
    EventsModule,
    DslModule,
    IncidentsModule,
    AlertsModule,
    SyncModule,
    VotesModule,
    DocumentsModule,
    MessagingModule,
    RgpdModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
