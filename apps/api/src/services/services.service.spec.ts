import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CreateServiceDto } from './dto/create-service.dto';
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getModelToken(Service.name),
          useValue: serviceModelMock,
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

    expect(serviceModelMock.create).toHaveBeenCalledWith({
      ...dto,
      ownerId: 'user_123',
      status: 'published',
      pricePoints: 50,
    });
    expect(result).toEqual(createdDoc);
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

    const updatedDoc = {
      _id: 'abc123',
      title: 'Ancien service',
      isPaid: false,
      pricePoints: null,
    };

    const exec = jest.fn().mockResolvedValue(updatedDoc);

    serviceModelMock.findByIdAndUpdate.mockReturnValue({ exec });

    const result = await service.update('abc123', dto);

    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'abc123',
      {
        isPaid: false,
        pricePoints: null,
      },
      { new: true, runValidators: true },
    );
    expect(result).toEqual(updatedDoc);
  });

  it('should return deleted true when deleting an existing service', async () => {
    const exec = jest.fn().mockResolvedValue({ _id: 'abc123' });

    serviceModelMock.findByIdAndDelete.mockReturnValue({ exec });

    const result = await service.remove('abc123');

    expect(serviceModelMock.findByIdAndDelete).toHaveBeenCalledWith('abc123');
    expect(result).toEqual({
      deleted: true,
      id: 'abc123',
    });
  });

  it('should publish a draft service', async () => {
    const draftService = {
      _id: 'svc_1',
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

    const result = await service.publish('svc_1');

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
        status: ServiceStatus.COMPLETED,
      }),
    );

    await expect(service.publish('svc_1')).rejects.toThrow(BadRequestException);
  });

  it('should cancel a service that is not completed', async () => {
    const publishedService = {
      _id: 'svc_1',
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

    const result = await service.cancel('svc_1');

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
