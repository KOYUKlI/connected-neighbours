import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { Role } from '../auth/role.enum';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServicesService } from './services.service';
import { ServiceStatus, ServiceType } from './schemas/service.schema';

const SERVICE_ID = '507f1f77bcf86cd799439011';

describe('ServicesService', () => {
  let service: ServicesService;

  const serviceModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
  const neighborhoodModel = { findOne: jest.fn() };
  const applicationModel = {
    aggregate: jest.fn(),
    find: jest.fn(),
  };
  const contractModel = { find: jest.fn() };
  const proofModel = { aggregate: jest.fn() };
  const publicUsersService = { findByIds: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    proofModel.aggregate.mockReturnValue(execResult([]));
    neighborhoodModel.findOne.mockReturnValue(
      execResult({ slug: 'quartier-centre', status: 'active', isActive: true }),
    );
    service = new ServicesService(
      serviceModel as never,
      neighborhoodModel as never,
      applicationModel as never,
      contractModel as never,
      proofModel as never,
      publicUsersService as never,
    );
  });

  it('creates a service with the authenticated owner and a published default', async () => {
    const dto: CreateServiceDto = {
      title: 'Aide informatique',
      description: 'Installation et prise en main.',
      type: ServiceType.OFFER,
      category: 'Informatique',
      availability: 'Mercredi soir',
      neighborhoodId: 'quartier-centre',
      isPaid: true,
      pricePoints: 20,
    };
    serviceModel.create.mockResolvedValue({ id: SERVICE_ID });

    await service.create(dto, 'alice');

    expect(serviceModel.create).toHaveBeenCalledWith({
      ...dto,
      ownerId: 'alice',
      status: ServiceStatus.PUBLISHED,
      pricePoints: 20,
    });
  });

  it('rejects a missing neighborhood', async () => {
    proofModel.aggregate.mockReturnValue(execResult([]));
    neighborhoodModel.findOne.mockReturnValue(execResult(null));
    await expect(
      service.create(
        {
          title: 'Test',
          description: 'Description',
          type: ServiceType.REQUEST,
          category: 'Test',
          availability: 'Demain',
          neighborhoodId: 'absent',
          isPaid: false,
        },
        'alice',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows the owner to update an editable service', async () => {
    serviceModel.findById.mockReturnValue(
      execResult(serviceDocument(ServiceStatus.PUBLISHED)),
    );
    serviceModel.findByIdAndUpdate.mockReturnValue(
      execResult({
        ...serviceDocument(ServiceStatus.PUBLISHED),
        title: 'Nouveau',
      }),
    );

    await service.update(SERVICE_ID, { title: 'Nouveau' }, actor('alice'));

    expect(serviceModel.findByIdAndUpdate).toHaveBeenCalledWith(
      SERVICE_ID,
      { title: 'Nouveau' },
      { returnDocument: 'after', runValidators: true },
    );
  });

  it.each([
    ['resident', actor('bob')],
    ['admin', actor('admin', Role.ADMIN)],
  ])('forbids a non-owner %s from updating', async (_label, otherActor) => {
    serviceModel.findById.mockReturnValue(
      execResult(serviceDocument(ServiceStatus.PUBLISHED)),
    );
    await expect(
      service.update(SERVICE_ID, { title: 'Tentative' }, otherActor),
    ).rejects.toThrow(ForbiddenException);
  });

  it('publishes an owner draft', async () => {
    serviceModel.findById.mockReturnValue(
      execResult(serviceDocument(ServiceStatus.DRAFT)),
    );
    serviceModel.findByIdAndUpdate.mockReturnValue(
      execResult(serviceDocument(ServiceStatus.PUBLISHED)),
    );

    await expect(service.publish(SERVICE_ID, actor('alice'))).resolves.toEqual(
      serviceDocument(ServiceStatus.PUBLISHED),
    );
  });

  it('returns 409 when publishing a completed service', async () => {
    serviceModel.findById.mockReturnValue(
      execResult(serviceDocument(ServiceStatus.COMPLETED)),
    );
    await expect(service.publish(SERVICE_ID, actor('alice'))).rejects.toThrow(
      ConflictException,
    );
  });

  it('deletes only an unengaged owner draft', async () => {
    const draft = serviceDocument(ServiceStatus.DRAFT);
    serviceModel.findById.mockReturnValue(execResult(draft));
    serviceModel.findByIdAndDelete.mockReturnValue(execResult(draft));

    await expect(service.remove(SERVICE_ID, actor('alice'))).resolves.toEqual({
      deleted: true,
      id: SERVICE_ID,
    });
  });

  it('returns 409 when deleting a published service', async () => {
    serviceModel.findById.mockReturnValue(
      execResult(serviceDocument(ServiceStatus.PUBLISHED)),
    );
    await expect(service.remove(SERVICE_ID, actor('alice'))).rejects.toThrow(
      ConflictException,
    );
  });

  it('returns 409 when cancelling an engaged service', async () => {
    serviceModel.findById.mockReturnValue(
      execResult({
        ...serviceDocument(ServiceStatus.APPLICATION_RECEIVED),
        selectedApplicationId: 'application-id',
      }),
    );
    await expect(service.cancel(SERVICE_ID, actor('alice'))).rejects.toThrow(
      ConflictException,
    );
  });
});

function execResult<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

function serviceDocument(status: ServiceStatus) {
  return {
    _id: SERVICE_ID,
    id: SERVICE_ID,
    ownerId: 'alice',
    status,
    isPaid: false,
    selectedApplicationId: null,
    contractId: null,
  };
}

function actor(sub: string, role = Role.RESIDENT) {
  return { sub, role };
}
