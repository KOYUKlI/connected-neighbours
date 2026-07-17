import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { CreateServiceDto } from './dto/create-service.dto';
import { Neighborhood } from '../neighborhoods/schemas/neighborhood.schema';
import { Role } from '../auth/role.enum';
import { ServiceStatus, ServiceType } from './schemas/service.schema';

import { ServicesService } from './services.service';
import { Service } from './schemas/service.schema';

describe('ServicesService', () => {
  let service: ServicesService;

  const serviceModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const neighborhoodModelMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    neighborhoodModelMock.findOne.mockReturnValue(
      execResult({
        _id: 'neighborhood_1',
        slug: 'quartier-centre',
        isActive: true,
        status: 'active',
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getModelToken(Service.name),
          useValue: serviceModelMock,
        },
        {
          provide: getModelToken(Neighborhood.name),
          useValue: neighborhoodModelMock,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  it('should create a service and default status to published', async () => {
    const dto: CreateServiceDto = {
      title: 'Babysitting samedi soir',
      description: 'Je propose 3 heures de babysitting.',
      type: ServiceType.OFFER,
      category: 'Entraide',
      availability: 'Samedi 19h-22h',
      neighborhoodId: 'quartier-centre',
      isPaid: true,
      pricePoints: 50,
    };

    const createdDoc = {
      _id: 'abc123',
      ...dto,
      ownerId: 'user_123',
      status: 'published',
    };

    serviceModelMock.create.mockResolvedValue(createdDoc);

    const result = await service.create(dto, 'user_123');

    expect(neighborhoodModelMock.findOne).toHaveBeenCalledWith({
      $or: [{ slug: 'quartier-centre' }],
    });
    expect(serviceModelMock.create).toHaveBeenCalledWith({
      ...dto,
      ownerId: 'user_123',
      status: 'published',
      pricePoints: 50,
    });
    expect(result).toEqual(createdDoc);
  });

  it('should reject creating a service in a missing neighborhood', async () => {
    neighborhoodModelMock.findOne.mockReturnValue(execResult(null));

    const dto: CreateServiceDto = {
      title: 'Babysitting samedi soir',
      description: 'Je propose 3 heures de babysitting.',
      type: ServiceType.OFFER,
      category: 'Entraide',
      availability: 'Samedi 19h-22h',
      neighborhoodId: 'quartier-inconnu',
      isPaid: false,
    };

    await expect(service.create(dto, 'user_123')).rejects.toThrow(
      BadRequestException,
    );
    expect(serviceModelMock.create).not.toHaveBeenCalled();
  });

  it('should reject creating a service in an archived neighborhood', async () => {
    neighborhoodModelMock.findOne.mockReturnValue(
      execResult({
        _id: 'neighborhood_1',
        slug: 'quartier-centre',
        isActive: false,
        status: 'archived',
      }),
    );

    const dto: CreateServiceDto = {
      title: 'Babysitting samedi soir',
      description: 'Je propose 3 heures de babysitting.',
      type: ServiceType.OFFER,
      category: 'Entraide',
      availability: 'Samedi 19h-22h',
      neighborhoodId: 'quartier-centre',
      isPaid: false,
    };

    await expect(service.create(dto, 'user_123')).rejects.toThrow(
      BadRequestException,
    );
    expect(serviceModelMock.create).not.toHaveBeenCalled();
  });

  it('should list services sorted by newest first', async () => {
    const docs = [
      { _id: '2', title: 'Service 2' },
      { _id: '1', title: 'Service 1' },
    ];

    const exec = jest.fn().mockResolvedValue(docs);
    const sort = jest.fn().mockReturnValue({ exec });

    serviceModelMock.find.mockReturnValue({ sort });

    const result = await service.findAll();

    expect(serviceModelMock.find).toHaveBeenCalled();
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual(docs);
  });

  it('should return one service by id', async () => {
    const doc = { _id: 'abc123', title: 'Babysitting' };
    const exec = jest.fn().mockResolvedValue(doc);

    serviceModelMock.findById.mockReturnValue({ exec });

    const result = await service.findOne('abc123');

    expect(serviceModelMock.findById).toHaveBeenCalledWith('abc123');
    expect(result).toEqual(doc);
  });

  it('should throw if service is not found', async () => {
    const exec = jest.fn().mockResolvedValue(null);

    serviceModelMock.findById.mockReturnValue({ exec });

    await expect(service.findOne('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should nullify pricePoints when isPaid becomes false', async () => {
    const dto = {
      isPaid: false,
      pricePoints: 80,
    };

    const existingDoc = {
      _id: 'abc123',
      title: 'Ancien service',
      ownerId: 'alice',
      status: ServiceStatus.PUBLISHED,
    };
    const updatedDoc = {
      ...existingDoc,
      isPaid: false,
      pricePoints: null,
    };

    const exec = jest.fn().mockResolvedValue(updatedDoc);

    serviceModelMock.findById.mockReturnValue(execResult(existingDoc));
    serviceModelMock.findByIdAndUpdate.mockReturnValue({ exec });

    const result = await service.update('abc123', dto, resident('alice'));

    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'abc123',
      {
        isPaid: false,
        pricePoints: null,
      },
      { returnDocument: 'after', runValidators: true },
    );
    expect(result).toEqual(updatedDoc);
  });

  it('should return deleted true when deleting an existing service', async () => {
    const existingDoc = { _id: 'abc123', ownerId: 'alice' };
    const exec = jest.fn().mockResolvedValue(existingDoc);

    serviceModelMock.findById.mockReturnValue(execResult(existingDoc));
    serviceModelMock.findByIdAndDelete.mockReturnValue({ exec });

    const result = await service.remove('abc123', resident('alice'));

    expect(serviceModelMock.findByIdAndDelete).toHaveBeenCalledWith('abc123');
    expect(result).toEqual({
      deleted: true,
      id: 'abc123',
    });
  });

  it('should publish a draft service', async () => {
    const draftService = {
      _id: 'svc_1',
      ownerId: 'alice',
      status: ServiceStatus.DRAFT,
    };
    const publishedService = {
      ...draftService,
      status: ServiceStatus.PUBLISHED,
    };

    serviceModelMock.findById.mockReturnValue(execResult(draftService));
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult(publishedService),
    );

    const result = await service.publish('svc_1', resident('alice'));

    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'svc_1',
      { status: ServiceStatus.PUBLISHED },
      { returnDocument: 'after', runValidators: true },
    );
    expect(result).toEqual(publishedService);
  });

  it('should reject publishing a completed service', async () => {
    serviceModelMock.findById.mockReturnValue(
      execResult({
        _id: 'svc_1',
        ownerId: 'alice',
        status: ServiceStatus.COMPLETED,
      }),
    );

    await expect(service.publish('svc_1', resident('alice'))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject updates by another resident', async () => {
    serviceModelMock.findById.mockReturnValue(
      execResult({
        _id: 'svc_1',
        ownerId: 'alice',
        status: ServiceStatus.PUBLISHED,
      }),
    );

    await expect(
      service.update('svc_1', { title: 'Tentative Bob' }, resident('bob')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject publishing, cancelling and deleting by another resident', async () => {
    serviceModelMock.findById.mockReturnValue(
      execResult({
        _id: 'svc_1',
        ownerId: 'alice',
        status: ServiceStatus.DRAFT,
      }),
    );

    await expect(service.publish('svc_1', resident('bob'))).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.cancel('svc_1', resident('bob'))).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.remove('svc_1', resident('bob'))).rejects.toThrow(
      ForbiddenException,
    );
    expect(serviceModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(serviceModelMock.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('should cancel a service that is not completed', async () => {
    const publishedService = {
      _id: 'svc_1',
      ownerId: 'alice',
      status: ServiceStatus.PUBLISHED,
    };
    const cancelledService = {
      ...publishedService,
      status: ServiceStatus.CANCELLED,
    };

    serviceModelMock.findById.mockReturnValue(execResult(publishedService));
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult(cancelledService),
    );

    const result = await service.cancel('svc_1', resident('alice'));

    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'svc_1',
      { status: ServiceStatus.CANCELLED },
      { returnDocument: 'after', runValidators: true },
    );
    expect(result).toEqual(cancelledService);
  });
});

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}

function resident(sub: string) {
  return {
    sub,
    role: Role.RESIDENT,
  };
}
