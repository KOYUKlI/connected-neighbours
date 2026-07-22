import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ServiceApplication,
  ServiceApplicationSchema,
} from '../applications/schemas/service-application.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { EventsModule } from '../events/events.module';
import { Incident, IncidentSchema } from '../incidents/schemas/incident.schema';
import {
  Neighborhood,
  NeighborhoodSchema,
} from '../neighborhoods/schemas/neighborhood.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { VotesModule } from '../votes/votes.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [
    ServicesModule,
    UsersModule,
    EventsModule,
    VotesModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Neighborhood.name, schema: NeighborhoodSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: ServiceApplication.name, schema: ServiceApplicationSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Incident.name, schema: IncidentSchema },
    ]),
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
