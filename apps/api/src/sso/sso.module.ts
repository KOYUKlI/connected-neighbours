import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module';
import { SsoCode, SsoCodeSchema } from './schemas/sso-code.schema';
import { SsoController } from './sso.controller';
import { SsoService } from './sso.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SsoCode.name, schema: SsoCodeSchema }]),
    AuthModule,
  ],
  controllers: [SsoController],
  providers: [SsoService],
})
export class SsoModule {}
