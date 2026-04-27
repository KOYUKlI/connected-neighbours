import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  PointTransaction,
  PointTransactionDocument,
  PointTransactionType,
} from './schemas/point-transaction.schema';

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PointTransaction.name)
    private readonly transactionModel: Model<PointTransactionDocument>,
  ) {}

  async reserve(input: {
    payerId: string;
    serviceId: string;
    contractId: string;
    amount: number;
  }) {
    this.assertPositiveAmount(input.amount);

    const payer = await this.userModel
      .findOneAndUpdate(
        {
          _id: input.payerId,
          pointsBalance: { $gte: input.amount },
        },
        {
          $inc: {
            pointsBalance: -input.amount,
            reservedPoints: input.amount,
          },
        },
        { new: true },
      )
      .exec();

    if (!payer) {
      throw new BadRequestException('Solde de points insuffisant');
    }

    await this.transactionModel.create({
      type: PointTransactionType.RESERVATION,
      amount: input.amount,
      serviceId: input.serviceId,
      contractId: input.contractId,
      fromUserId: input.payerId,
      toUserId: null,
    });

    return payer;
  }

  async transferReserved(input: {
    payerId: string;
    receiverId: string;
    serviceId: string;
    contractId: string;
    amount: number;
  }) {
    this.assertPositiveAmount(input.amount);

    const payer = await this.userModel
      .findOneAndUpdate(
        {
          _id: input.payerId,
          reservedPoints: { $gte: input.amount },
        },
        {
          $inc: {
            reservedPoints: -input.amount,
          },
        },
        { new: true },
      )
      .exec();

    if (!payer) {
      throw new BadRequestException('Aucun point réservé disponible');
    }

    const receiver = await this.userModel
      .findByIdAndUpdate(
        input.receiverId,
        {
          $inc: {
            pointsBalance: input.amount,
          },
        },
        { new: true },
      )
      .exec();

    if (!receiver) {
      throw new BadRequestException('Bénéficiaire introuvable');
    }

    await this.transactionModel.create({
      type: PointTransactionType.TRANSFER,
      amount: input.amount,
      serviceId: input.serviceId,
      contractId: input.contractId,
      fromUserId: input.payerId,
      toUserId: input.receiverId,
    });

    return {
      payer,
      receiver,
    };
  }

  async release(input: {
    payerId: string;
    serviceId: string;
    contractId: string;
    amount: number;
  }) {
    this.assertPositiveAmount(input.amount);

    const payer = await this.userModel
      .findOneAndUpdate(
        {
          _id: input.payerId,
          reservedPoints: { $gte: input.amount },
        },
        {
          $inc: {
            pointsBalance: input.amount,
            reservedPoints: -input.amount,
          },
        },
        { new: true },
      )
      .exec();

    if (!payer) {
      throw new BadRequestException('Aucun point réservé disponible');
    }

    await this.transactionModel.create({
      type: PointTransactionType.RELEASE,
      amount: input.amount,
      serviceId: input.serviceId,
      contractId: input.contractId,
      fromUserId: input.payerId,
      toUserId: null,
    });

    return payer;
  }

  async findTransactionsForUser(userId: string) {
    return this.transactionModel
      .find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  private assertPositiveAmount(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Le montant de points doit être positif');
    }
  }
}
