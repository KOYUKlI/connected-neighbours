import { BadRequestException } from '@nestjs/common';

import { PointsService } from './points.service';
import { PointTransactionType } from './schemas/point-transaction.schema';

describe('PointsService', () => {
  let service: PointsService;

  const userModelMock = {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const transactionModelMock = {
    create: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PointsService(
      userModelMock as never,
      transactionModelMock as never,
    );
  });

  it('should reserve points from the payer balance', async () => {
    const payer = {
      id: 'user_1',
      pointsBalance: 70,
      reservedPoints: 30,
    };

    userModelMock.findOneAndUpdate.mockReturnValue(execResult(payer));

    const result = await service.reservePoints(
      'user_1',
      30,
      'contract_1',
      'svc_1',
    );

    expect(userModelMock.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'user_1',
        pointsBalance: { $gte: 30 },
      },
      {
        $inc: {
          pointsBalance: -30,
          reservedPoints: 30,
        },
      },
      { returnDocument: 'after' },
    );
    expect(transactionModelMock.create).toHaveBeenCalledWith({
      type: PointTransactionType.RESERVATION,
      amount: 30,
      serviceId: 'svc_1',
      contractId: 'contract_1',
      fromUserId: 'user_1',
      toUserId: null,
    });
    expect(result).toEqual(payer);
  });

  it('should reject reservation when balance is insufficient', async () => {
    userModelMock.findOneAndUpdate.mockReturnValue(execResult(null));

    await expect(
      service.reservePoints('user_1', 30, 'contract_1', 'svc_1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should transfer reserved points to the receiver', async () => {
    const payer = {
      id: 'payer_1',
      pointsBalance: 70,
      reservedPoints: 0,
    };
    const receiver = {
      id: 'receiver_1',
      pointsBalance: 130,
      reservedPoints: 0,
    };

    userModelMock.findOneAndUpdate.mockReturnValue(execResult(payer));
    userModelMock.findByIdAndUpdate.mockReturnValue(execResult(receiver));

    const result = await service.transferReservedPoints(
      'payer_1',
      'receiver_1',
      30,
      'contract_1',
      'svc_1',
    );

    expect(userModelMock.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'payer_1',
        reservedPoints: { $gte: 30 },
      },
      {
        $inc: {
          reservedPoints: -30,
        },
      },
      { returnDocument: 'after' },
    );
    expect(userModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'receiver_1',
      {
        $inc: {
          pointsBalance: 30,
        },
      },
      { returnDocument: 'after' },
    );
    expect(transactionModelMock.create).toHaveBeenCalledWith({
      type: PointTransactionType.TRANSFER,
      amount: 30,
      serviceId: 'svc_1',
      contractId: 'contract_1',
      fromUserId: 'payer_1',
      toUserId: 'receiver_1',
    });
    expect(result).toEqual({
      payer,
      receiver,
    });
  });

  it('should release reserved points back to the payer balance', async () => {
    const payer = {
      id: 'payer_1',
      pointsBalance: 100,
      reservedPoints: 0,
    };

    userModelMock.findOneAndUpdate.mockReturnValue(execResult(payer));

    const result = await service.releaseReservedPoints(
      'payer_1',
      30,
      'contract_1',
      'svc_1',
    );

    expect(userModelMock.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'payer_1',
        reservedPoints: { $gte: 30 },
      },
      {
        $inc: {
          pointsBalance: 30,
          reservedPoints: -30,
        },
      },
      { returnDocument: 'after' },
    );
    expect(transactionModelMock.create).toHaveBeenCalledWith({
      type: PointTransactionType.RELEASE,
      amount: 30,
      serviceId: 'svc_1',
      contractId: 'contract_1',
      fromUserId: 'payer_1',
      toUserId: null,
    });
    expect(result).toEqual(payer);
  });

  it('should return the current user point balance', async () => {
    userModelMock.findById.mockReturnValue(
      execResult({
        id: 'user_1',
        pointsBalance: 75,
        reservedPoints: 25,
        passwordHash: 'not-exposed',
      }),
    );

    const result = await service.getBalance('user_1');

    expect(userModelMock.findById).toHaveBeenCalledWith('user_1');
    expect(result).toEqual({
      userId: 'user_1',
      pointsBalance: 75,
      reservedPoints: 25,
      availablePoints: 75,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });
});

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}
