import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    const existing = await this.transactionModel
      .findOne({ contractId, type: PointTransactionType.RESERVATION })
      .exec();
    if (existing) {
      throw new BadRequestException(
        'Les points sont déjà réservés pour ce contrat.',
      );
    }

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
        { returnDocument: 'after' },
      )
      .exec();

    if (!payer) {
      throw new BadRequestException('Solde de points insuffisant');
    }

    try {
      await this.transactionModel.create({
        type: PointTransactionType.RESERVATION,
        amount,
        serviceId,
        contractId,
        fromUserId: payerId,
        toUserId: null,
      });
    } catch (error) {
      await this.userModel
        .updateOne(
          { _id: payerId },
          {
            $inc: {
              pointsBalance: amount,
              reservedPoints: -amount,
            },
          },
        )
        .exec();
      throw error;
    }

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

    const existing = await this.transactionModel
      .findOne({ contractId, type: PointTransactionType.TRANSFER })
      .exec();
    if (existing) {
      return {
        payer: null,
        receiver: null,
        alreadyTransferred: true,
      };
    }

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
        { returnDocument: 'after' },
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
        { returnDocument: 'after' },
      )
      .exec();

    if (!receiver) {
      await this.restorePayerReservation(payerId, amount);
      throw new BadRequestException('Bénéficiaire introuvable');
    }

    try {
      await this.transactionModel.create({
        type: PointTransactionType.TRANSFER,
        amount,
        serviceId,
        contractId,
        fromUserId: payerId,
        toUserId: receiverId,
      });
    } catch (error) {
      await Promise.all([
        this.restorePayerReservation(payerId, amount),
        this.userModel
          .updateOne(
            { _id: receiverId, pointsBalance: { $gte: amount } },
            { $inc: { pointsBalance: -amount } },
          )
          .exec(),
      ]);
      throw error;
    }

    return {
      payer,
      receiver,
      alreadyTransferred: false,
    };
  }

  async hasFinalTransfer(contractId: string) {
    const transaction = await this.transactionModel
      .findOne({ contractId, type: PointTransactionType.TRANSFER })
      .select('_id')
      .lean()
      .exec();
    return Boolean(transaction);
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
        { returnDocument: 'after' },
      )
      .exec();

    if (!payer) {
      throw new BadRequestException('Aucun point réservé disponible');
    }

    try {
      await this.transactionModel.create({
        type: PointTransactionType.RELEASE,
        amount,
        serviceId,
        contractId,
        fromUserId: payerId,
        toUserId: null,
      });
    } catch (error) {
      await this.userModel
        .updateOne(
          { _id: payerId, pointsBalance: { $gte: amount } },
          {
            $inc: {
              pointsBalance: -amount,
              reservedPoints: amount,
            },
          },
        )
        .exec();
      throw error;
    }

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

  async getBalance(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return {
      userId: user.id,
      pointsBalance: user.pointsBalance,
      reservedPoints: user.reservedPoints,
      availablePoints: user.pointsBalance,
    };
  }

  private restorePayerReservation(payerId: string, amount: number) {
    return this.userModel
      .updateOne(
        { _id: payerId },
        {
          $inc: {
            reservedPoints: amount,
          },
        },
      )
      .exec();
  }

  private assertPositiveAmount(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Le montant de points doit être positif');
    }
  }
}
