import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import { ServiceApplicationStatus } from '../applications/schemas/service-application.schema';
import { PointsService } from '../points/points.service';
import { ServiceStatus, ServiceType } from '../services/schemas/service.schema';
import { ContractsService } from './contracts.service';
import { ContractStatus } from './schemas/contract.schema';

describe('ContractsService', () => {
  let service: ContractsService;

  const contractModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  const serviceModelMock = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const applicationModelMock = {
    findById: jest.fn(),
  };

  const pointsServiceMock = {
    reservePoints: jest.fn(),
    transferReservedPoints: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ContractsService(
      contractModelMock as never,
      serviceModelMock as never,
      applicationModelMock as never,
      pointsServiceMock as unknown as PointsService,
    );
  });

  it('should create a contract from an accepted application and reserve points', async () => {
    const application = applicationDocument({
      id: 'app_1',
      serviceId: 'svc_1',
      applicantId: 'provider_1',
      ownerId: 'requester_1',
      proposedPricePoints: 40,
      status: ServiceApplicationStatus.ACCEPTED,
    });
    const serviceDoc = serviceDocument({
      id: 'svc_1',
      ownerId: 'requester_1',
      status: ServiceStatus.CANDIDATE_SELECTED,
      isPaid: true,
      pricePoints: 50,
    });
    const contract = { id: 'contract_1', serviceId: 'svc_1' };
    const updatedService = {
      ...serviceDoc,
      contractId: 'contract_1',
      status: ServiceStatus.AWAITING_SIGNATURES,
    };

    applicationModelMock.findById.mockReturnValue(execResult(application));
    serviceModelMock.findById.mockReturnValue(execResult(serviceDoc));
    contractModelMock.findOne.mockReturnValue(execResult(null));
    contractModelMock.create.mockResolvedValue(contract);
    serviceModelMock.findByIdAndUpdate.mockReturnValue(execResult(updatedService));

    const result = await service.createFromApplication(
      'app_1',
      authUser('requester_1'),
    );

    expect(pointsServiceMock.reservePoints).toHaveBeenCalledWith(
      'requester_1',
      40,
      expect.any(String),
      'svc_1',
    );
    expect(contractModelMock.create).toHaveBeenCalledWith({
      _id: expect.any(String) as unknown as string,
      serviceId: 'svc_1',
      applicationId: 'app_1',
      requesterId: 'requester_1',
      providerId: 'provider_1',
      payerId: 'requester_1',
      receiverId: 'provider_1',
      pricePoints: 40,
      status: ContractStatus.SENT,
      signedByIds: [],
      signedAt: null,
      completedAt: null,
    });
    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'svc_1',
      {
        contractId: expect.any(String) as unknown as string,
        status: ServiceStatus.AWAITING_SIGNATURES,
      },
      { new: true, runValidators: true },
    );
    expect(result).toEqual({
      service: updatedService,
      contract,
    });
  });

  it('should reject contract generation when the application is not accepted', async () => {
    applicationModelMock.findById.mockReturnValue(
      execResult(
        applicationDocument({
          id: 'app_1',
          serviceId: 'svc_1',
          applicantId: 'provider_1',
          ownerId: 'requester_1',
          proposedPricePoints: null,
          status: ServiceApplicationStatus.SUBMITTED,
        }),
      ),
    );

    await expect(
      service.createFromApplication('app_1', authUser('requester_1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject contract generation by a non-owner', async () => {
    applicationModelMock.findById.mockReturnValue(
      execResult(
        applicationDocument({
          id: 'app_1',
          serviceId: 'svc_1',
          applicantId: 'provider_1',
          ownerId: 'requester_1',
          proposedPricePoints: null,
          status: ServiceApplicationStatus.ACCEPTED,
        }),
      ),
    );
    serviceModelMock.findById.mockReturnValue(
      execResult(
        serviceDocument({
          id: 'svc_1',
          ownerId: 'requester_1',
          status: ServiceStatus.CANDIDATE_SELECTED,
          isPaid: true,
          pricePoints: 50,
        }),
      ),
    );

    await expect(
      service.createFromApplication('app_1', authUser('other_user')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject contract generation when a contract already exists', async () => {
    applicationModelMock.findById.mockReturnValue(
      execResult(
        applicationDocument({
          id: 'app_1',
          serviceId: 'svc_1',
          applicantId: 'provider_1',
          ownerId: 'requester_1',
          proposedPricePoints: null,
          status: ServiceApplicationStatus.ACCEPTED,
        }),
      ),
    );
    serviceModelMock.findById.mockReturnValue(
      execResult(
        serviceDocument({
          id: 'svc_1',
          ownerId: 'requester_1',
          status: ServiceStatus.CANDIDATE_SELECTED,
          isPaid: true,
          pricePoints: 50,
        }),
      ),
    );
    contractModelMock.findOne.mockReturnValue(
      execResult({ id: 'existing_contract' }),
    );

    await expect(
      service.createFromApplication('app_1', authUser('requester_1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create a free contract without reserving points from an accepted application', async () => {
    const application = applicationDocument({
      id: 'app_1',
      serviceId: 'svc_1',
      applicantId: 'provider_1',
      ownerId: 'requester_1',
      proposedPricePoints: null,
      status: ServiceApplicationStatus.ACCEPTED,
    });
    const serviceDoc = serviceDocument({
      id: 'svc_1',
      ownerId: 'requester_1',
      status: ServiceStatus.CANDIDATE_SELECTED,
      isPaid: false,
      pricePoints: null,
    });
    const contract = { id: 'contract_1', serviceId: 'svc_1', pricePoints: 0 };

    applicationModelMock.findById.mockReturnValue(execResult(application));
    serviceModelMock.findById.mockReturnValue(execResult(serviceDoc));
    contractModelMock.findOne.mockReturnValue(execResult(null));
    contractModelMock.create.mockResolvedValue(contract);
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult({ ...serviceDoc, status: ServiceStatus.AWAITING_SIGNATURES }),
    );

    await service.createFromApplication('app_1', authUser('requester_1'));

    expect(pointsServiceMock.reservePoints).not.toHaveBeenCalled();
    expect(contractModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pricePoints: 0,
      }),
    );
  });

  it('should accept a free service through the legacy route without creating a contract', async () => {
    const serviceDoc = {
      _id: 'svc_1',
      ownerId: 'owner_1',
      type: ServiceType.OFFER,
      status: ServiceStatus.PUBLISHED,
      isPaid: false,
      pricePoints: null,
    };
    const acceptedService = {
      ...serviceDoc,
      status: ServiceStatus.ACCEPTED,
    };

    serviceModelMock.findById.mockReturnValue(execResult(serviceDoc));
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult(acceptedService),
    );

    const result = await service.acceptService('svc_1', 'requester_1');

    expect(result).toEqual({
      service: acceptedService,
      contract: null,
    });
    expect(contractModelMock.create).not.toHaveBeenCalled();
    expect(pointsServiceMock.reservePoints).not.toHaveBeenCalled();
    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'svc_1',
      { status: ServiceStatus.ACCEPTED },
      { new: true },
    );
  });

  it('should create a contract and reserve points through the legacy route', async () => {
    const serviceDoc = {
      _id: 'svc_1',
      ownerId: 'provider_1',
      type: ServiceType.OFFER,
      status: ServiceStatus.PUBLISHED,
      isPaid: true,
      pricePoints: 50,
    };
    const contract = { id: 'contract_1', serviceId: 'svc_1' };

    serviceModelMock.findById.mockReturnValue(execResult(serviceDoc));
    contractModelMock.create.mockResolvedValue(contract);
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult({
        ...serviceDoc,
        status: ServiceStatus.AWAITING_SIGNATURES,
      }),
    );

    const result = await service.acceptService('svc_1', 'requester_1');

    expect(contractModelMock.create).toHaveBeenCalledWith({
      _id: expect.any(String) as unknown as string,
      serviceId: 'svc_1',
      applicationId: null,
      requesterId: 'requester_1',
      providerId: 'provider_1',
      payerId: 'requester_1',
      receiverId: 'provider_1',
      pricePoints: 50,
      status: ContractStatus.SENT,
      signedByIds: [],
      signedAt: null,
      completedAt: null,
    });
    expect(pointsServiceMock.reservePoints).toHaveBeenCalledWith(
      'requester_1',
      50,
      expect.any(String),
      'svc_1',
    );
    expect(result.contract).toEqual(contract);
  });

  it('should reject when a user accepts their own service through the legacy route', async () => {
    serviceModelMock.findById.mockReturnValue(
      execResult({
        _id: 'svc_1',
        ownerId: 'owner_1',
        type: ServiceType.OFFER,
        status: ServiceStatus.PUBLISHED,
        isPaid: false,
      }),
    );

    await expect(service.acceptService('svc_1', 'owner_1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should activate a contract when both parties have signed', async () => {
    const contract = contractDocument({
      id: 'contract_1',
      serviceId: 'svc_1',
      requesterId: 'requester_1',
      providerId: 'provider_1',
      status: ContractStatus.SENT,
      signedByIds: ['requester_1'],
      pricePoints: 50,
    });

    contractModelMock.findById.mockReturnValue(execResult(contract));
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult({ _id: 'svc_1', status: ServiceStatus.CONTRACT_ACTIVE }),
    );

    const result = await service.sign('contract_1', 'provider_1');

    expect(contract.status).toBe(ContractStatus.ACTIVE);
    expect(contract.signedByIds).toEqual(['requester_1', 'provider_1']);
    expect(contract.signedAt).toBeInstanceOf(Date);
    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'svc_1',
      { status: ServiceStatus.CONTRACT_ACTIVE },
      { new: true },
    );
    expect(result).toEqual(contract);
  });

  it('should reject duplicate signatures', async () => {
    const contract = contractDocument({
      id: 'contract_1',
      serviceId: 'svc_1',
      requesterId: 'requester_1',
      providerId: 'provider_1',
      status: ContractStatus.SENT,
      signedByIds: ['requester_1'],
      pricePoints: 50,
    });

    contractModelMock.findById.mockReturnValue(execResult(contract));

    await expect(service.sign('contract_1', 'requester_1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should transfer reserved points when completing an active paid contract', async () => {
    const contract = contractDocument({
      id: 'contract_1',
      serviceId: 'svc_1',
      requesterId: 'requester_1',
      providerId: 'provider_1',
      payerId: 'requester_1',
      receiverId: 'provider_1',
      status: ContractStatus.ACTIVE,
      pricePoints: 50,
    });

    contractModelMock.findById.mockReturnValue(execResult(contract));
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult({ _id: 'svc_1', status: ServiceStatus.COMPLETED }),
    );

    const result = await service.complete('contract_1', 'requester_1');

    expect(pointsServiceMock.transferReservedPoints).toHaveBeenCalledWith(
      'requester_1',
      'provider_1',
      50,
      'contract_1',
      'svc_1',
    );
    expect(contract.status).toBe(ContractStatus.COMPLETED);
    expect(contract.completedAt).toBeInstanceOf(Date);
    expect(result).toEqual(contract);
  });

  it('should complete a free contract without transferring points', async () => {
    const contract = contractDocument({
      id: 'contract_1',
      serviceId: 'svc_1',
      requesterId: 'requester_1',
      providerId: 'provider_1',
      payerId: 'requester_1',
      receiverId: 'provider_1',
      status: ContractStatus.ACTIVE,
      pricePoints: 0,
    });

    contractModelMock.findById.mockReturnValue(execResult(contract));
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult({ _id: 'svc_1', status: ServiceStatus.COMPLETED }),
    );

    await service.complete('contract_1', 'provider_1');

    expect(pointsServiceMock.transferReservedPoints).not.toHaveBeenCalled();
    expect(contract.status).toBe(ContractStatus.COMPLETED);
  });

  it('should throw when the contract does not exist', async () => {
    contractModelMock.findById.mockReturnValue(execResult(null));

    await expect(service.findOne('missing_contract', 'user_1')).rejects.toThrow(
      NotFoundException,
    );
  });
});

function authUser(id: string): AuthenticatedUser {
  return {
    sub: id,
    email: `${id}@connected.local`,
    role: Role.RESIDENT,
    displayName: id,
    neighborhoodId: 'quartier-centre',
  };
}

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}

function serviceDocument(input: {
  id: string;
  ownerId: string;
  status: ServiceStatus;
  isPaid: boolean;
  pricePoints: number | null;
}) {
  return {
    _id: input.id,
    id: input.id,
    ownerId: input.ownerId,
    type: ServiceType.REQUEST,
    status: input.status,
    isPaid: input.isPaid,
    pricePoints: input.pricePoints,
  };
}

function applicationDocument(input: {
  id: string;
  serviceId: string;
  applicantId: string;
  ownerId: string;
  proposedPricePoints: number | null;
  status: ServiceApplicationStatus;
}) {
  return {
    _id: input.id,
    id: input.id,
    serviceId: input.serviceId,
    applicantId: input.applicantId,
    ownerId: input.ownerId,
    proposedPricePoints: input.proposedPricePoints,
    status: input.status,
  };
}

function contractDocument(input: {
  id: string;
  serviceId: string;
  requesterId: string;
  providerId: string;
  payerId?: string;
  receiverId?: string;
  status: ContractStatus;
  signedByIds?: string[];
  pricePoints: number;
}) {
  const contract = {
    id: input.id,
    serviceId: input.serviceId,
    requesterId: input.requesterId,
    providerId: input.providerId,
    payerId: input.payerId ?? input.requesterId,
    receiverId: input.receiverId ?? input.providerId,
    status: input.status,
    signedByIds: input.signedByIds ?? [],
    pricePoints: input.pricePoints,
    signedAt: null as Date | null,
    completedAt: null as Date | null,
    save: jest.fn(),
  };

  contract.save.mockResolvedValue(contract);
  return contract;
}
