import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { StorageFile, StorageFileSchema } from './schemas/storage-file.schema';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StorageFile.name, schema: StorageFileSchema },
      { name: Contract.name, schema: ContractSchema },
    ]),
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService, MongooseModule],
})
export class StorageModule {}
