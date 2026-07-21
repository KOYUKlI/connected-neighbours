import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { Role } from '../auth/role.enum';
import { ContractStatus } from '../contracts/schemas/contract.schema';
import { ServiceStatus } from '../services/schemas/service.schema';
import { DisputesService } from './disputes.service';
import {
  DisputeReason,
  DisputeResolutionType,
  DisputeStatus,
} from './schemas/dispute.schema';

const requester = {
  sub: '507f1f77bcf86cd799439011',
  email: 'alice@example.test',
  displayName: 'Alice',
  neighborhoodId: 'quartier-centre',
  role: Role.RESIDENT,
};
const provider = {
  ...requester,
  sub: '507f1f77bcf86cd799439012',
  email: 'bob@example.test',
  displayName: 'Bob',
};
const moderator = {
  ...requester,
  sub: '507f1f77bcf86cd799439013',
  email: 'moderator@example.test',
  displayName: 'Moderation',
  role: Role.MODERATOR,
};

function query<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

describe('DisputesService', () => {
  const serviceDocument = {
    id: '507f1f77bcf86cd799439021',
    contractId: '507f1f77bcf86cd799439022',
    activeDisputeId: null,
    isPaid: true,
    pricePoints: 25,
    status: ServiceStatus.AWAITING_VALIDATION,
  };
  const contractDocument = {
    id: '507f1f77bcf86cd799439022',
    serviceId: serviceDocument.id,
    requesterId: requester.sub,
    providerId: provider.sub,
    payerId: requester.sub,
    receiverId: provider.sub,
    activeDisputeId: null,
    pricePoints: 25,
    status: ContractStatus.ACTIVE,
  };

  let disputeModel: Record<string, jest.Mock>;
  let evidenceModel: Record<string, jest.Mock>;
  let serviceModel: Record<string, jest.Mock>;
  let contractModel: Record<string, jest.Mock>;
  let proofModel: Record<string, jest.Mock>;
  let userModel: Record<string, jest.Mock>;
  let pointsService: Record<string, jest.Mock>;
  let publicUsersService: Record<string, jest.Mock>;
  let disputesService: DisputesService;

  beforeEach(() => {
    disputeModel = {
      create: jest.fn(),
      findOne: jest.fn(() => ({
        select: jest.fn(() => ({
          lean: jest.fn(() => query(null)),
        })),
      })),
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn(),
    };
    evidenceModel = {};
    serviceModel = {
      findById: jest.fn(() => query({ ...serviceDocument })),
      findOneAndUpdate: jest.fn(() => query({ ...serviceDocument })),
      updateOne: jest.fn(() => query({ acknowledged: true })),
    };
    contractModel = {
      findById: jest.fn(() => query({ ...contractDocument })),
      findOneAndUpdate: jest.fn(() => query({ ...contractDocument })),
      updateOne: jest.fn(() => query({ acknowledged: true })),
    };
    proofModel = {};
    userModel = {};
    pointsService = {
      hasFinalTransfer: jest.fn().mockResolvedValue(false),
      hasReservedPoints: jest.fn().mockResolvedValue(true),
      transferReservedPoints: jest.fn(),
      releaseReservedPoints: jest.fn(),
      hasPointOperation: jest.fn().mockResolvedValue(true),
    };
    publicUsersService = {};

    disputesService = new DisputesService(
      disputeModel as never,
      evidenceModel as never,
      serviceModel as never,
      contractModel as never,
      proofModel as never,
      userModel as never,
      pointsService as never,
      publicUsersService as never,
    );
    Object.defineProperty(disputesService, 'presentDispute', {
      value: jest.fn().mockResolvedValue({ id: 'dispute-id' }),
    });
  });

  it.each([requester, provider])(
    'allows a contract party to open a dispute',
    async (actor) => {
      const created = {
        id: '507f1f77bcf86cd799439099',
        contractId: contractDocument.id,
        serviceId: serviceDocument.id,
      };
      disputeModel.create.mockResolvedValue(created);

      await expect(
        disputesService.openForService(
          serviceDocument.id,
          {
            reason: DisputeReason.SERVICE_QUALITY,
            description:
              'La réalisation nécessite encore une correction importante.',
          },
          actor,
        ),
      ).resolves.toEqual({ id: 'dispute-id' });

      const serviceClaimCall = serviceModel.findOneAndUpdate.mock
        .calls[0] as unknown as [
        { _id: string; status: ServiceStatus },
        { $set: { status: ServiceStatus } },
      ];
      const contractClaimCall = contractModel.findOneAndUpdate.mock
        .calls[0] as unknown as [
        { _id: string; status: ContractStatus },
        { $set: { status: ContractStatus } },
      ];
      expect(serviceClaimCall[0]).toMatchObject({
        _id: serviceDocument.id,
        status: ServiceStatus.AWAITING_VALIDATION,
      });
      expect(serviceClaimCall[1].$set.status).toBe(ServiceStatus.DISPUTED);
      expect(contractClaimCall[0]).toMatchObject({
        _id: contractDocument.id,
        status: ContractStatus.ACTIVE,
      });
      expect(contractClaimCall[1].$set.status).toBe(ContractStatus.DISPUTED);
    },
  );

  it('rejects a third party before claiming the resources', async () => {
    await expect(
      disputesService.openForService(
        serviceDocument.id,
        {
          reason: DisputeReason.OTHER,
          description: 'Une contestation suffisamment détaillée pour le test.',
        },
        { ...requester, sub: '507f1f77bcf86cd799439014' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(serviceModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(contractModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects opening when the final transfer already exists', async () => {
    pointsService.hasFinalTransfer.mockResolvedValue(true);

    await expect(
      disputesService.openForService(
        serviceDocument.id,
        {
          reason: DisputeReason.PAYMENT_DISAGREEMENT,
          description: 'Le transfert est contesté après sa finalisation.',
        },
        requester,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('validates an exact split of the reserved amount', () => {
    const resolveAmounts = (
      disputesService as unknown as {
        resolveAmounts: (
          input: {
            type: DisputeResolutionType;
            justification: string;
            providerPoints?: number;
            requesterPoints?: number;
          },
          total: number,
        ) => { providerPoints: number; requesterPoints: number };
      }
    ).resolveAmounts.bind(disputesService);

    expect(
      resolveAmounts(
        {
          type: DisputeResolutionType.SPLIT,
          justification: 'Partage fondé sur une prestation partielle.',
          providerPoints: 15,
          requesterPoints: 10,
        },
        25,
      ),
    ).toEqual({ providerPoints: 15, requesterPoints: 10 });
  });

  it('rejects a split that creates or destroys points', () => {
    const resolveAmounts = (
      disputesService as unknown as {
        resolveAmounts: (
          input: {
            type: DisputeResolutionType;
            justification: string;
            providerPoints?: number;
            requesterPoints?: number;
          },
          total: number,
        ) => unknown;
      }
    ).resolveAmounts.bind(disputesService);

    expect(() =>
      resolveAmounts(
        {
          type: DisputeResolutionType.SPLIT,
          justification: 'Montants volontairement incohérents.',
          providerPoints: 20,
          requesterPoints: 10,
        },
        25,
      ),
    ).toThrow(BadRequestException);
  });

  it('prevents a resident from resolving a dispute', async () => {
    await expect(
      disputesService.resolve(
        serviceDocument.id,
        {
          type: DisputeResolutionType.PROVIDER_PAYMENT,
          justification: 'Décision non autorisée par une partie.',
        },
        requester,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(pointsService.transferReservedPoints).not.toHaveBeenCalled();
  });

  it('rejects a second resolution without another financial operation', async () => {
    Object.defineProperty(disputesService, 'findDispute', {
      value: jest.fn().mockResolvedValue({
        id: '507f1f77bcf86cd799439099',
        status: DisputeStatus.RESOLVED,
        assignedModeratorId: moderator.sub,
      }),
    });

    await expect(
      disputesService.resolve(
        '507f1f77bcf86cd799439099',
        {
          type: DisputeResolutionType.PROVIDER_PAYMENT,
          justification: 'La décision est déjà enregistrée.',
        },
        moderator,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(pointsService.transferReservedPoints).not.toHaveBeenCalled();
    expect(pointsService.releaseReservedPoints).not.toHaveBeenCalled();
  });
});
