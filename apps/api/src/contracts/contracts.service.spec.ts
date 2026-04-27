import { BadRequestException } from '@nestjs/common';

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
  };

  const serviceModelMock = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const pointsServiceMock = {
    reserve: jest.fn(),
    transferReserved: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ContractsService(
      contractModelMock as never,
      serviceModelMock as never,
      pointsServiceMock as unknown as PointsService,
    );
  });

  it('should accept a free service without creating a contract', async () => {
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
    expect(pointsServiceMock.reserve).not.toHaveBeenCalled();
    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'svc_1',
      { status: ServiceStatus.ACCEPTED },
      { new: true },
    );
  });

  it('should create a contract and reserve points when accepting a paid offer', async () => {
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
      execResult({ ...serviceDoc, status: ServiceStatus.ACCEPTED }),
    );

    const result = await service.acceptService('svc_1', 'requester_1');

    expect(contractModelMock.create).toHaveBeenCalledWith({
      _id: expect.any(String) as unknown as string,
      serviceId: 'svc_1',
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
    expect(pointsServiceMock.reserve).toHaveBeenCalledWith({
      payerId: 'requester_1',
      serviceId: 'svc_1',
      contractId: expect.any(String) as unknown as string,
      amount: 50,
    });
    expect(result.contract).toEqual(contract);
  });

  it('should reject when a user accepts their own service', async () => {
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
    const contract = {
      id: 'contract_1',
      serviceId: 'svc_1',
      requesterId: 'requester_1',
      providerId: 'provider_1',
      status: ContractStatus.SENT,
      signedByIds: ['requester_1'],
      signedAt: null as Date | null,
      save: jest.fn(),
    };
    contract.save.mockResolvedValue(contract);

    contractModelMock.findById.mockReturnValue(execResult(contract));
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult({ _id: 'svc_1', status: ServiceStatus.IN_PROGRESS }),
    );

    const result = await service.sign('contract_1', 'provider_1');

    expect(contract.status).toBe(ContractStatus.ACTIVE);
    expect(contract.signedByIds).toEqual(['requester_1', 'provider_1']);
    expect(contract.signedAt).toBeInstanceOf(Date);
    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'svc_1',
      { status: ServiceStatus.IN_PROGRESS },
      { new: true },
    );
    expect(result).toEqual(contract);
  });

  it('should transfer reserved points when completing an active contract', async () => {
    const contract = {
      id: 'contract_1',
      serviceId: 'svc_1',
      requesterId: 'requester_1',
      providerId: 'provider_1',
      payerId: 'requester_1',
      receiverId: 'provider_1',
      pricePoints: 50,
      status: ContractStatus.ACTIVE,
      completedAt: null as Date | null,
      save: jest.fn(),
    };
    contract.save.mockResolvedValue(contract);

    contractModelMock.findById.mockReturnValue(execResult(contract));
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult({ _id: 'svc_1', status: ServiceStatus.COMPLETED }),
    );

    const result = await service.complete('contract_1', 'requester_1');

    expect(pointsServiceMock.transferReserved).toHaveBeenCalledWith({
      payerId: 'requester_1',
      receiverId: 'provider_1',
      serviceId: 'svc_1',
      contractId: 'contract_1',
      amount: 50,
    });
    expect(contract.status).toBe(ContractStatus.COMPLETED);
    expect(contract.completedAt).toBeInstanceOf(Date);
    expect(result).toEqual(contract);
  });
});

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}
