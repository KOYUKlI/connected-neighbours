import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ServiceStatus, ServiceType } from '../services/schemas/service.schema';
import { ApplicationsService } from './applications.service';
import {
  ServiceApplicationStatus,
} from './schemas/service-application.schema';

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  const applicationModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    updateMany: jest.fn(),
  };

  const serviceModelMock = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ApplicationsService(
      applicationModelMock as never,
      serviceModelMock as never,
    );
  });

  it('should create an application and mark the service as having applications', async () => {
    const serviceDoc = serviceDocument({
      _id: 'svc_1',
      ownerId: 'owner_1',
      status: ServiceStatus.PUBLISHED,
    });
    const applicationDoc = {
      _id: 'app_1',
      serviceId: 'svc_1',
      applicantId: 'user_1',
      ownerId: 'owner_1',
      message: 'Je suis disponible samedi.',
      proposedDate: null,
      proposedPricePoints: 30,
      status: ServiceApplicationStatus.SUBMITTED,
      acceptedAt: null,
      rejectedAt: null,
    };

    serviceModelMock.findById.mockReturnValue(execResult(serviceDoc));
    applicationModelMock.findOne.mockReturnValue(execResult(null));
    applicationModelMock.create.mockResolvedValue(applicationDoc);
    serviceModelMock.findByIdAndUpdate.mockReturnValue(execResult(serviceDoc));

    const result = await service.create('svc_1', 'user_1', {
      message: 'Je suis disponible samedi.',
      proposedPricePoints: 30,
    });

    expect(applicationModelMock.create).toHaveBeenCalledWith({
      serviceId: 'svc_1',
      applicantId: 'user_1',
      ownerId: 'owner_1',
      message: 'Je suis disponible samedi.',
      proposedDate: null,
      proposedPricePoints: 30,
      status: ServiceApplicationStatus.SUBMITTED,
      acceptedAt: null,
      rejectedAt: null,
    });
    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith('svc_1', {
      status: ServiceStatus.APPLICATION_RECEIVED,
    });
    expect(result).toEqual(applicationDoc);
  });

  it('should reject applications on own service', async () => {
    serviceModelMock.findById.mockReturnValue(
      execResult(
        serviceDocument({
          _id: 'svc_1',
          ownerId: 'owner_1',
          status: ServiceStatus.PUBLISHED,
        }),
      ),
    );

    await expect(
      service.create('svc_1', 'owner_1', { message: 'Je candidate.' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject duplicate active applications for the same service', async () => {
    serviceModelMock.findById.mockReturnValue(
      execResult(
        serviceDocument({
          _id: 'svc_1',
          ownerId: 'owner_1',
          status: ServiceStatus.PUBLISHED,
        }),
      ),
    );
    applicationModelMock.findOne.mockReturnValue(
      execResult({ _id: 'existing_app' }),
    );

    await expect(
      service.create('svc_1', 'user_1', { message: 'Je candidate.' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should accept a submitted application and reject the other submitted ones', async () => {
    const application = applicationDocument({
      id: 'app_1',
      serviceId: 'svc_1',
      applicantId: 'user_1',
      ownerId: 'owner_1',
      status: ServiceApplicationStatus.SUBMITTED,
    });

    serviceModelMock.findById.mockReturnValue(
      execResult(
        serviceDocument({
          _id: 'svc_1',
          ownerId: 'owner_1',
          status: ServiceStatus.APPLICATION_RECEIVED,
        }),
      ),
    );
    applicationModelMock.findById.mockReturnValue(execResult(application));
    applicationModelMock.updateMany.mockReturnValue(execResult({ modifiedCount: 2 }));
    serviceModelMock.findByIdAndUpdate.mockReturnValue(
      execResult({ _id: 'svc_1', status: ServiceStatus.CANDIDATE_SELECTED }),
    );

    const result = await service.accept('app_1', 'owner_1');

    expect(application.status).toBe(ServiceApplicationStatus.ACCEPTED);
    expect(application.acceptedAt).toBeInstanceOf(Date);
    expect(application.save).toHaveBeenCalled();
    expect(applicationModelMock.updateMany).toHaveBeenCalledWith(
      {
        serviceId: 'svc_1',
        _id: { $ne: 'app_1' },
        status: {
          $in: [
            ServiceApplicationStatus.SUBMITTED,
            ServiceApplicationStatus.VIEWED,
          ],
        },
      },
      {
        status: ServiceApplicationStatus.REJECTED,
        rejectedAt: expect.any(Date) as unknown as Date,
      },
    );
    expect(serviceModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'svc_1',
      {
        selectedApplicationId: 'app_1',
        status: ServiceStatus.CANDIDATE_SELECTED,
      },
      { new: true, runValidators: true },
    );
    expect(result).toEqual(application);
  });

  it('should reject accepting a non-submitted application', async () => {
    const application = applicationDocument({
      id: 'app_1',
      serviceId: 'svc_1',
      applicantId: 'user_1',
      ownerId: 'owner_1',
      status: ServiceApplicationStatus.WITHDRAWN,
    });

    applicationModelMock.findById.mockReturnValue(execResult(application));
    serviceModelMock.findById.mockReturnValue(
      execResult(
        serviceDocument({
          _id: 'svc_1',
          ownerId: 'owner_1',
          status: ServiceStatus.APPLICATION_RECEIVED,
        }),
      ),
    );

    await expect(service.accept('app_1', 'owner_1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject an application as the service owner', async () => {
    const application = applicationDocument({
      id: 'app_1',
      serviceId: 'svc_1',
      applicantId: 'user_1',
      ownerId: 'owner_1',
      status: ServiceApplicationStatus.SUBMITTED,
    });

    applicationModelMock.findById.mockReturnValue(execResult(application));
    serviceModelMock.findById.mockReturnValue(
      execResult(
        serviceDocument({
          _id: 'svc_1',
          ownerId: 'owner_1',
          status: ServiceStatus.APPLICATION_RECEIVED,
        }),
      ),
    );

    const result = await service.reject('app_1', 'owner_1');

    expect(application.status).toBe(ServiceApplicationStatus.REJECTED);
    expect(application.rejectedAt).toBeInstanceOf(Date);
    expect(application.save).toHaveBeenCalled();
    expect(result).toEqual(application);
  });

  it('should withdraw an application as the applicant', async () => {
    const application = applicationDocument({
      id: 'app_1',
      serviceId: 'svc_1',
      applicantId: 'user_1',
      ownerId: 'owner_1',
      status: ServiceApplicationStatus.SUBMITTED,
    });

    applicationModelMock.findById.mockReturnValue(execResult(application));

    const result = await service.withdraw('app_1', 'user_1');

    expect(application.status).toBe(ServiceApplicationStatus.WITHDRAWN);
    expect(application.save).toHaveBeenCalled();
    expect(result).toEqual(application);
  });

  it('should forbid withdrawing someone else application', async () => {
    applicationModelMock.findById.mockReturnValue(
      execResult(
        applicationDocument({
          id: 'app_1',
          serviceId: 'svc_1',
          applicantId: 'user_1',
          ownerId: 'owner_1',
          status: ServiceApplicationStatus.SUBMITTED,
        }),
      ),
    );

    await expect(service.withdraw('app_1', 'user_2')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw when the application does not exist', async () => {
    applicationModelMock.findById.mockReturnValue(execResult(null));

    await expect(service.accept('missing_app', 'owner_1')).rejects.toThrow(
      NotFoundException,
    );
  });
});

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}

function serviceDocument(input: {
  _id: string;
  ownerId: string;
  status: ServiceStatus;
  selectedApplicationId?: string | null;
}) {
  return {
    _id: input._id,
    id: input._id,
    ownerId: input.ownerId,
    status: input.status,
    selectedApplicationId: input.selectedApplicationId ?? null,
    type: ServiceType.OFFER,
  };
}

function applicationDocument(input: {
  id: string;
  serviceId: string;
  applicantId: string;
  ownerId: string;
  status: ServiceApplicationStatus;
}) {
  return {
    ...input,
    acceptedAt: null as Date | null,
    rejectedAt: null as Date | null,
    save: jest.fn().mockImplementation(function save(this: unknown) {
      return Promise.resolve(this);
    }),
  };
}
