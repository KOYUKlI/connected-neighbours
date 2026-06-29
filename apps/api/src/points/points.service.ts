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
    return this.reservePoints(
      input.payerId,
      input.amount,
      input.contractId,
      input.serviceId,
    );
  }

  async reservePoints(
    payerId: string,
    amount: number,
    contractId: string,
    serviceId: string,
  ) {
    this.assertPositiveAmount(amount);

    const payer = await this.userModel
      .findOneAndUpdate(
        {
          _id: payerId,
          pointsBalance: { $gte: amount },
        },
        {
          $inc: {
            pointsBalance: -amount,
            reservedPoints: amount,
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
      amount,
      serviceId,
      contractId,
      fromUserId: payerId,
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
    return this.transferReservedPoints(
      input.payerId,
      input.receiverId,
      input.amount,
      input.contractId,
      input.serviceId,
    );
  }

  async transferReservedPoints(
    payerId: string,
    receiverId: string,
    amount: number,
    contractId: string,
    serviceId: string,
  ) {
    this.assertPositiveAmount(amount);

    const payer = await this.userModel
      .findOneAndUpdate(
        {
          _id: payerId,
          reservedPoints: { $gte: amount },
        },
        {
          $inc: {
            reservedPoints: -amount,
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
        receiverId,
        {
          $inc: {
            pointsBalance: amount,
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
      amount,
      serviceId,
      contractId,
      fromUserId: payerId,
      toUserId: receiverId,
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
    return this.releaseReservedPoints(
      input.payerId,
      input.amount,
      input.contractId,
      input.serviceId,
    );
  }

  async releaseReservedPoints(
    payerId: string,
    amount: number,
    contractId: string,
    serviceId: string,
  ) {
    this.assertPositiveAmount(amount);

    const payer = await this.userModel
      .findOneAndUpdate(
        {
          _id: payerId,
          reservedPoints: { $gte: amount },
        },
        {
          $inc: {
            pointsBalance: amount,
            reservedPoints: -amount,
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
      amount,
      serviceId,
      contractId,
      fromUserId: payerId,
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
