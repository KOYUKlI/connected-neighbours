import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../auth/schemas/user.schema';
import { NeighborhoodEvent } from '../events/schemas/event.schema';
import { Incident } from '../incidents/schemas/incident.schema';
import { Service } from '../services/schemas/service.schema';
import { Vote } from '../votes/schemas/vote.schema';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { NeighborhoodsService } from './neighborhoods.service';
import { Neighborhood } from './schemas/neighborhood.schema';

describe('NeighborhoodsService', () => {
  let service: NeighborhoodsService;

  const neighborhoodModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  const userModelMock = {
    find: jest.fn(),
    countDocuments: jest.fn(),
  };
  const serviceModelMock = {
    countDocuments: jest.fn(),
  };
  const incidentModelMock = {
    countDocuments: jest.fn(),
  };
  const eventModelMock = {
    countDocuments: jest.fn(),
  };
  const voteModelMock = {
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NeighborhoodsService,
        {
          provide: getModelToken(Neighborhood.name),
          useValue: neighborhoodModelMock,
        },
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: getModelToken(Service.name), useValue: serviceModelMock },
        { provide: getModelToken(Incident.name), useValue: incidentModelMock },
        {
          provide: getModelToken(NeighborhoodEvent.name),
          useValue: eventModelMock,
        },
        { provide: getModelToken(Vote.name), useValue: voteModelMock },
      ],
    }).compile();

    service = module.get(NeighborhoodsService);
  });

  it('should create a neighborhood with a valid GeoJSON polygon', async () => {
    const dto = validNeighborhoodDto();
    const created = { _id: 'n_1', ...dto, createdById: 'admin' };
    neighborhoodModelMock.create.mockResolvedValue(created);

    const result = await service.create(dto, 'admin');

    expect(neighborhoodModelMock.create).toHaveBeenCalledWith({
      ...dto,
      slug: 'quartier-test',
      createdById: 'admin',
      status: 'active',
      isActive: true,
    });
    expect(result).toEqual(created);
  });

  it('should reject an invalid polygon', async () => {
    const dto = validNeighborhoodDto();
    dto.boundary.coordinates[0][4] = [2.4, 48.85];

    await expect(service.create(dto, 'admin')).rejects.toThrow(
      BadRequestException,
    );
    expect(neighborhoodModelMock.create).not.toHaveBeenCalled();
  });

  it('should return true when a point is inside the polygon', async () => {
    neighborhoodModelMock.findOne.mockReturnValue(
      execResult(neighborhoodDocument()),
    );

    const result = await service.containsPoint('quartier-test', {
      point: [2.35, 48.856],
    });

    expect(result.contains).toBe(true);
  });

  it('should return false when a point is outside the polygon', async () => {
    neighborhoodModelMock.findOne.mockReturnValue(
      execResult(neighborhoodDocument()),
    );

    const result = await service.containsPoint('quartier-test', {
      point: [2.5, 48.856],
    });

    expect(result.contains).toBe(false);
  });

  it('should return members without passwordHash', async () => {
    neighborhoodModelMock.findOne.mockReturnValue(
      execResult(neighborhoodDocument()),
    );
    const members = [
      {
        _id: 'user_1',
        email: 'alice@connected-neighbours.local',
        displayName: 'Alice Martin',
      },
    ];
    const exec = jest.fn().mockResolvedValue(members);
    const lean = jest.fn().mockReturnValue({ exec });
    const sort = jest.fn().mockReturnValue({ lean });
    const select = jest.fn().mockReturnValue({ sort });
    userModelMock.find.mockReturnValue({ select });

    const result = await service.findMembers('quartier-test');

    expect(select).toHaveBeenCalledWith('-passwordHash');
    expect(result).toEqual(members);
    expect(result[0]).not.toHaveProperty('passwordHash');
  });

  it('should return neighborhood stats', async () => {
    neighborhoodModelMock.findOne.mockReturnValue(
      execResult(neighborhoodDocument()),
    );
    userModelMock.countDocuments.mockReturnValue(execResult(3));
    serviceModelMock.countDocuments.mockReturnValue(execResult(4));
    incidentModelMock.countDocuments.mockReturnValue(execResult(2));
    eventModelMock.countDocuments.mockReturnValue(execResult(1));
    voteModelMock.countDocuments.mockReturnValue(execResult(5));

    await expect(service.getStats('quartier-test')).resolves.toEqual({
      neighborhoodId: 'neighborhood_1',
      slug: 'quartier-test',
      users: 3,
      services: 4,
      incidents: 2,
      events: 1,
      votes: 5,
    });
  });

  it('should throw when a neighborhood is missing', async () => {
    neighborhoodModelMock.findOne.mockReturnValue(execResult(null));

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});

function validNeighborhoodDto(): CreateNeighborhoodDto {
  return {
    name: 'Quartier Test',
    slug: 'quartier-test',
    description: 'Zone de test',
    city: 'Paris',
    postalCode: '75001',
    boundary: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [2.34, 48.85],
          [2.36, 48.85],
          [2.36, 48.86],
          [2.34, 48.86],
          [2.34, 48.85],
        ],
      ],
    },
  };
}

function neighborhoodDocument() {
  return {
    id: 'neighborhood_1',
    slug: 'quartier-test',
    boundary: validNeighborhoodDto().boundary,
  };
}

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}
