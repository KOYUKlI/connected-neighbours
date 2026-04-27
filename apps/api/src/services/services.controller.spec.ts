import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServiceType } from './schemas/service.schema';

describe('ServicesController', () => {
  let controller: ServicesController;
  let servicesService: jest.Mocked<Pick<ServicesService, 'create' | 'findAll'>>;

  const servicesServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: servicesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    servicesService = module.get(ServicesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a service with the authenticated user id', async () => {
    const dto = {
      title: 'Cours de maths',
      description: 'Aide pour réviser un contrôle.',
      type: ServiceType.OFFER,
      category: 'Soutien scolaire',
      availability: 'Mercredi soir',
      neighborhoodId: 'quartier-centre',
      isPaid: true,
      pricePoints: 20,
    };
    const created = { _id: 'svc_1', ...dto, ownerId: 'user_123' };

    servicesService.create.mockResolvedValue(created);

    await expect(controller.create(dto, { sub: 'user_123' })).resolves.toEqual(
      created,
    );
    expect(servicesService.create).toHaveBeenCalledWith(dto, 'user_123');
  });
});
