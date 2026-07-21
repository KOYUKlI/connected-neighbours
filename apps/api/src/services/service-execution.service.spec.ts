import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import { ContractStatus } from '../contracts/schemas/contract.schema';
import { ServiceProofType } from './schemas/service-proof.schema';
import { ServiceStatus } from './schemas/service.schema';
import { ServiceExecutionService } from './service-execution.service';

const SERVICE_ID = '507f1f77bcf86cd799439011';
const CONTRACT_ID = '507f1f77bcf86cd799439012';
const REQUESTER_ID = '507f1f77bcf86cd799439013';
const PROVIDER_ID = '507f1f77bcf86cd799439014';
const THIRD_PARTY_ID = '507f1f77bcf86cd799439015';

describe('ServiceExecutionService', () => {
  const serviceModel = {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  };
  const contractModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const proofModel = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  };
  const pointsService = {
    transferReservedPoints: jest.fn(),
    hasFinalTransfer: jest.fn(),
  };
  const publicUsersService = {
    findByIds: jest.fn(),
  };

  let execution: ServiceExecutionService;
  let service: ReturnType<typeof serviceDocument>;
  let contract: ReturnType<typeof contractDocument>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = serviceDocument(ServiceStatus.SCHEDULED);
    contract = contractDocument(ContractStatus.ACTIVE);
    serviceModel.findById.mockReturnValue(selectExec(service));
    contractModel.findById.mockReturnValue(execResult(contract));
    serviceModel.updateOne.mockReturnValue(execResult({ acknowledged: true }));
    pointsService.hasFinalTransfer.mockResolvedValue(false);
    publicUsersService.findByIds.mockResolvedValue(new Map());

    execution = new ServiceExecutionService(
      serviceModel as never,
      contractModel as never,
      proofModel as never,
      pointsService as never,
      publicUsersService as never,
    );
  });

  it('allows the selected provider to start a scheduled service', async () => {
    const started = serviceDocument(ServiceStatus.IN_PROGRESS);
    started.startedAt = new Date();
    serviceModel.findOneAndUpdate.mockReturnValue(execResult(started));

    const result = await execution.start(SERVICE_ID, actor(PROVIDER_ID));

    expect(result.executionStatus).toBe(ServiceStatus.IN_PROGRESS);
    expect(serviceModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: SERVICE_ID,
        status: {
          $in: [ServiceStatus.CONTRACT_ACTIVE, ServiceStatus.SCHEDULED],
        },
      }),
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Jest types asymmetric matchers as any.
        $set: expect.objectContaining({ status: ServiceStatus.IN_PROGRESS }),
      }),
      { returnDocument: 'after', runValidators: true },
    );
  });

  it('forbids the requester and a third party from starting', async () => {
    await expect(
      execution.start(SERVICE_ID, actor(REQUESTER_ID)),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      execution.start(SERVICE_ID, actor(THIRD_PARTY_ID)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('requires an active contract before starting', async () => {
    contract.status = ContractStatus.SENT;
    await expect(
      execution.start(SERVICE_ID, actor(PROVIDER_ID)),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects a duplicate start', async () => {
    service.status = ServiceStatus.IN_PROGRESS;
    await expect(
      execution.start(SERVICE_ID, actor(PROVIDER_ID)),
    ).rejects.toThrow('Ce service a déjà été démarré.');
  });

  it('allows a participant to add a text proof', async () => {
    service.status = ServiceStatus.IN_PROGRESS;
    const proof = proofDocument();
    proofModel.create.mockResolvedValue(proof);

    const result = await execution.addProof(
      SERVICE_ID,
      { type: ServiceProofType.NOTE, message: 'Travail réalisé proprement.' },
      actor(PROVIDER_ID),
    );

    expect(proofModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceId: SERVICE_ID,
        authorId: PROVIDER_ID,
        type: ServiceProofType.NOTE,
      }),
    );
    expect(result.type).toBe(ServiceProofType.NOTE);
  });

  it('validates proof content and protects proof visibility', async () => {
    service.status = ServiceStatus.IN_PROGRESS;
    await expect(
      execution.addProof(
        SERVICE_ID,
        { type: ServiceProofType.NOTE, message: ' ' },
        actor(PROVIDER_ID),
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      execution.findProofs(SERVICE_ID, actor(THIRD_PARTY_ID)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('marks an in-progress service done without transferring points', async () => {
    service.status = ServiceStatus.IN_PROGRESS;
    proofModel.countDocuments.mockReturnValue(execResult(1));
    const waiting = serviceDocument(ServiceStatus.AWAITING_VALIDATION);
    waiting.markedDoneAt = new Date();
    serviceModel.findOneAndUpdate.mockReturnValue(execResult(waiting));

    const result = await execution.markDone(SERVICE_ID, actor(PROVIDER_ID));

    expect(result.executionStatus).toBe(ServiceStatus.AWAITING_VALIDATION);
    expect(pointsService.transferReservedPoints).not.toHaveBeenCalled();
  });

  it('requires a proof before marking the service done', async () => {
    service.status = ServiceStatus.IN_PROGRESS;
    proofModel.countDocuments.mockReturnValue(execResult(0));

    await expect(
      execution.markDone(SERVICE_ID, actor(PROVIDER_ID)),
    ).rejects.toThrow(ConflictException);
  });

  it('allows the requester to request a correction', async () => {
    service.status = ServiceStatus.AWAITING_VALIDATION;
    const corrected = serviceDocument(ServiceStatus.CORRECTION_REQUESTED);
    corrected.correctionReason = 'Merci de reprendre la fixation murale.';
    serviceModel.findOneAndUpdate.mockReturnValue(execResult(corrected));

    const result = await execution.requestCorrection(
      SERVICE_ID,
      { reason: 'Merci de reprendre la fixation murale.' },
      actor(REQUESTER_ID),
    );

    expect(result.executionStatus).toBe(ServiceStatus.CORRECTION_REQUESTED);
    expect(pointsService.transferReservedPoints).not.toHaveBeenCalled();
  });

  it('requires a new proof after a correction before marking done again', async () => {
    service.status = ServiceStatus.CORRECTION_REQUESTED;
    service.correctionRequestedAt = new Date();
    proofModel.countDocuments.mockReturnValue(execResult(0));

    await expect(
      execution.markDone(SERVICE_ID, actor(PROVIDER_ID)),
    ).rejects.toThrow('Ajoutez une nouvelle preuve');

    proofModel.countDocuments.mockReturnValue(execResult(1));
    serviceModel.findOneAndUpdate.mockReturnValue(
      execResult(serviceDocument(ServiceStatus.AWAITING_VALIDATION)),
    );
    await expect(
      execution.markDone(SERVICE_ID, actor(PROVIDER_ID)),
    ).resolves.toEqual(
      expect.objectContaining({
        executionStatus: ServiceStatus.AWAITING_VALIDATION,
      }),
    );
  });

  it('allows only the requester to validate and completes both resources', async () => {
    service.status = ServiceStatus.AWAITING_VALIDATION;
    const claimed = serviceDocument(ServiceStatus.AWAITING_VALIDATION);
    claimed.validationClaimedAt = new Date();
    const completedService = serviceDocument(ServiceStatus.COMPLETED);
    completedService.validatedAt = new Date();
    completedService.completedAt = completedService.validatedAt;
    const completedContract = contractDocument(ContractStatus.COMPLETED);
    completedContract.completedAt = completedService.completedAt;

    serviceModel.findOneAndUpdate
      .mockReturnValueOnce(selectExec(claimed))
      .mockReturnValueOnce(execResult(completedService));
    contractModel.findOneAndUpdate.mockReturnValue(
      execResult(completedContract),
    );
    pointsService.transferReservedPoints.mockResolvedValue({
      payer: {},
      receiver: {},
      alreadyTransferred: false,
    });

    const result = await execution.validate(SERVICE_ID, actor(REQUESTER_ID));

    expect(pointsService.transferReservedPoints).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        executionStatus: ServiceStatus.COMPLETED,
        contractStatus: ContractStatus.COMPLETED,
        pointsTransferred: true,
      }),
    );
  });

  it('forbids the provider from validating', async () => {
    service.status = ServiceStatus.AWAITING_VALIDATION;
    await expect(
      execution.validate(SERVICE_ID, actor(PROVIDER_ID)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects a second validation without a second transfer', async () => {
    service.status = ServiceStatus.COMPLETED;
    contract.status = ContractStatus.COMPLETED;

    await expect(
      execution.validate(SERVICE_ID, actor(REQUESTER_ID)),
    ).rejects.toThrow('Les points ont déjà été transférés.');
    expect(pointsService.transferReservedPoints).not.toHaveBeenCalled();
  });
});

function actor(id: string): AuthenticatedUser {
  return {
    sub: id,
    email: id + '@example.test',
    displayName: id,
    neighborhoodId: 'quartier-centre',
    role: Role.RESIDENT,
  };
}

function serviceDocument(status: ServiceStatus) {
  return {
    id: SERVICE_ID,
    _id: SERVICE_ID,
    title: 'Service test',
    contractId: CONTRACT_ID,
    status,
    scheduledAt: null as Date | null,
    startedAt: null as Date | null,
    markedDoneAt: null as Date | null,
    validatedAt: null as Date | null,
    correctionRequestedAt: null as Date | null,
    correctionReason: null as string | null,
    completedAt: null as Date | null,
    validationClaimedAt: null as Date | null,
  };
}

function contractDocument(status: ContractStatus) {
  return {
    id: CONTRACT_ID,
    _id: CONTRACT_ID,
    serviceId: SERVICE_ID,
    requesterId: REQUESTER_ID,
    providerId: PROVIDER_ID,
    payerId: REQUESTER_ID,
    receiverId: PROVIDER_ID,
    pricePoints: 25,
    status,
    completedAt: null as Date | null,
  };
}

function proofDocument() {
  return {
    id: '507f1f77bcf86cd799439016',
    _id: '507f1f77bcf86cd799439016',
    serviceId: SERVICE_ID,
    authorId: PROVIDER_ID,
    type: ServiceProofType.NOTE,
    message: 'Travail réalisé proprement.',
    fileReference: null,
    createdAt: new Date(),
    toObject: () => ({
      _id: '507f1f77bcf86cd799439016',
      serviceId: SERVICE_ID,
      authorId: PROVIDER_ID,
      type: ServiceProofType.NOTE,
      message: 'Travail réalisé proprement.',
      fileReference: null,
      createdAt: new Date(),
    }),
  };
}

function execResult<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

function selectExec<T>(value: T) {
  return {
    select: jest.fn().mockReturnValue(execResult(value)),
  };
}
