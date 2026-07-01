import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import {
  ServiceApplication,
  ServiceApplicationSchema,
} from './schemas/service-application.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceApplication.name, schema: ServiceApplicationSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
