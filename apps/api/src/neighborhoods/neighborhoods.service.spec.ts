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

  const neighborhoodModel = {
    create: jest.fn<Promise<unknown>, [unknown]>(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  };
  const userModel = modelMock();
  const serviceModel = modelMock();
  const incidentModel = modelMock();
  const eventModel = modelMock();
  const voteModel = modelMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    neighborhoodModel.find.mockReturnValue(queryResult([]));
    neighborhoodModel.updateOne.mockReturnValue(
      execResult({ modifiedCount: 1 }),
    );
    for (const model of [
      userModel,
      serviceModel,
      incidentModel,
      eventModel,
      voteModel,
    ]) {
      model.aggregate.mockReturnValue(execResult([]));
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NeighborhoodsService,
        {
          provide: getModelToken(Neighborhood.name),
          useValue: neighborhoodModel,
        },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Service.name), useValue: serviceModel },
        { provide: getModelToken(Incident.name), useValue: incidentModel },
        {
          provide: getModelToken(NeighborhoodEvent.name),
          useValue: eventModel,
        },
        { provide: getModelToken(Vote.name), useValue: voteModel },
      ],
    }).compile();

    service = module.get(NeighborhoodsService);
  });

  it('creates a canonical neighborhood with center and audit history', async () => {
    const dto = validNeighborhoodDto();
    let createPayload: unknown;
    neighborhoodModel.create.mockImplementation((value) => {
      createPayload = value;
      return Promise.resolve({ _id: 'n_1', ...dto });
    });

    await service.create(dto, 'admin');

    expect(createPayload).toMatchObject({
      boundary: dto.geometry,
      geometry: dto.geometry,
      postalCodes: ['75001'],
      slug: 'quartier-test',
      createdById: 'admin',
      status: 'active',
      isActive: true,
      center: { type: 'Point' },
      history: [{ type: 'created', actorId: 'admin' }],
    });
  });

  it('rejects a malformed polygon before persistence', async () => {
    const dto = validNeighborhoodDto();
    dto.geometry.coordinates[0][4] = [2.4, 48.85];

    await expect(service.create(dto, 'admin')).rejects.toThrow(
      BadRequestException,
    );
    expect(neighborhoodModel.create).not.toHaveBeenCalled();
  });

  it.each([
    [[2.35, 48.856] as [number, number], true],
    [[2.5, 48.856] as [number, number], false],
  ])(
    'checks whether a point is inside the canonical polygon',
    async (point, expected) => {
      neighborhoodModel.findOne.mockReturnValue(
        execResult(neighborhoodDocument()),
      );

      await expect(
        service.containsPoint('quartier-test', { point }),
      ).resolves.toEqual({
        neighborhoodId: 'neighborhood_1',
        contains: expected,
      });
    },
  );

  it('resolves a point without storing its coordinates', async () => {
    neighborhoodModel.find.mockReturnValue(queryResult([neighborhoodRow()]));
    let update: unknown;
    userModel.updateOne.mockImplementation((...args: unknown[]) => {
      update = args[1];
      return execResult({ matchedCount: 1 });
    });

    const result = await service.resolve(
      { type: 'Point', coordinates: [2.35, 48.856] },
      '507f1f77bcf86cd799439011',
    );

    expect(result.status).toBe('found');
    expect(JSON.stringify(update)).not.toContain('2.35');
    expect(JSON.stringify(update)).not.toContain('48.856');
    expect(update).toMatchObject({
      $set: {
        pendingNeighborhoodId: 'quartier-test',
      },
    });
  });

  it('returns paginated members with an explicit safe projection', async () => {
    neighborhoodModel.findOne.mockReturnValue(
      execResult(neighborhoodDocument()),
    );
    userModel.find.mockReturnValue(
      queryResult([{ _id: 'user_1', displayName: 'Alice Martin' }]),
    );
    userModel.countDocuments.mockReturnValue(execResult(1));

    const result = await service.findMembers('quartier-test');

    expect(result.total).toBe(1);
    expect(result.items[0]).not.toHaveProperty('passwordHash');
  });

  it('aggregates neighborhood statistics without per-row queries', async () => {
    neighborhoodModel.findOne.mockReturnValue(queryResult(neighborhoodRow()));
    userModel.aggregate.mockReturnValue(
      execResult([{ _id: 'quartier-test', count: 3 }]),
    );
    serviceModel.aggregate.mockReturnValue(
      execResult([{ _id: 'quartier-test', count: 4 }]),
    );
    incidentModel.aggregate.mockReturnValue(
      execResult([{ _id: 'quartier-test', count: 2 }]),
    );
    eventModel.aggregate.mockReturnValue(
      execResult([{ _id: 'quartier-test', count: 1 }]),
    );
    voteModel.aggregate.mockReturnValue(
      execResult([{ _id: 'quartier-test', count: 5 }]),
    );

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

  it('hides a missing or archived public neighborhood', async () => {
    neighborhoodModel.findOne.mockReturnValue(queryResult(null));
    await expect(service.findPublicOne('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});

function validNeighborhoodDto(): CreateNeighborhoodDto {
  return {
    name: 'Quartier Test',
    slug: 'quartier-test',
    description: 'Zone de test',
    city: 'Paris',
    postalCode: '75001',
    postalCodes: ['75001'],
    geometry: polygon(),
  };
}

function polygon() {
  return {
    type: 'Polygon' as const,
    coordinates: [
      [
        [2.34, 48.85] as [number, number],
        [2.36, 48.85] as [number, number],
        [2.36, 48.86] as [number, number],
        [2.34, 48.86] as [number, number],
        [2.34, 48.85] as [number, number],
      ],
    ],
  };
}

function neighborhoodRow() {
  return {
    _id: 'neighborhood_1',
    name: 'Quartier Test',
    slug: 'quartier-test',
    description: 'Zone de test',
    city: 'Paris',
    postalCode: '75001',
    postalCodes: ['75001'],
    status: 'active',
    isActive: true,
    geometry: polygon(),
    boundary: polygon(),
  };
}

function neighborhoodDocument() {
  return { ...neighborhoodRow(), id: 'neighborhood_1' };
}

function modelMock() {
  return {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn<unknown, unknown[]>(),
  };
}

function execResult<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

function queryResult<T>(value: T) {
  const query: Record<string, jest.Mock> = {};
  for (const method of ['lean', 'limit', 'select', 'skip', 'sort']) {
    query[method] = jest.fn(() => query);
  }
  query.exec = jest.fn().mockResolvedValue(value);
  return query;
}
