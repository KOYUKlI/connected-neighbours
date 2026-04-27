import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  Contract,
  ContractDocument,
} from '../contracts/schemas/contract.schema';
import {
  ManagedDocument,
  ManagedDocumentDocument,
} from '../documents/schemas/managed-document.schema';
import {
  PointTransaction,
  PointTransactionDocument,
} from '../points/schemas/point-transaction.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';

@Injectable()
export class RgpdService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(PointTransaction.name)
    private readonly transactionModel: Model<PointTransactionDocument>,
    @InjectModel(ManagedDocument.name)
    private readonly documentModel: Model<ManagedDocumentDocument>,
  ) {}

  async exportPersonalData(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const [services, contracts, pointTransactions, documents] =
      await Promise.all([
        this.serviceModel.find({ ownerId: userId }).exec(),
        this.contractModel
          .find({ $or: [{ requesterId: userId }, { providerId: userId }] })
          .exec(),
        this.transactionModel
          .find({ $or: [{ fromUserId: userId }, { toUserId: userId }] })
          .exec(),
        this.documentModel
          .find({
            $or: [
              { ownerId: userId },
              { 'fields.assignedToUserId': userId },
              { 'fields.signedByUserId': userId },
            ],
          })
          .exec(),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        neighborhoodId: user.neighborhoodId,
        isActive: user.isActive,
        pointsBalance: user.pointsBalance,
        reservedPoints: user.reservedPoints,
      },
      services,
      contracts,
      pointTransactions,
      documents,
    };
  }
}
