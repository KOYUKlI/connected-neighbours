import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';

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
        MINIO_ACCESS_KEY: Joi.string().required(),
        MINIO_SECRET_KEY: Joi.string().required(),
        MINIO_BUCKET: Joi.string().required(),

        KEYCLOAK_BASE_URL: Joi.string().uri().required(),
        KEYCLOAK_REALM: Joi.string().required(),
        KEYCLOAK_CLIENT_ID: Joi.string().required(),
        KEYCLOAK_CLIENT_SECRET: Joi.string().required(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
