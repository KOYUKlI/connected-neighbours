import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../auth/schemas/user.schema';
import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import {
  ManagedDocument,
  ManagedDocumentSchema,
} from '../documents/schemas/managed-document.schema';
import {
  PointTransaction,
  PointTransactionSchema,
} from '../points/schemas/point-transaction.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { RgpdController } from './rgpd.controller';
import { RgpdService } from './rgpd.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: PointTransaction.name, schema: PointTransactionSchema },
      { name: ManagedDocument.name, schema: ManagedDocumentSchema },
    ]),
  ],
  controllers: [RgpdController],
  providers: [RgpdService],
})
export class RgpdModule {}
