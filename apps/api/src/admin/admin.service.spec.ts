import { AlertSeverity, AlertStatus } from '../alerts/schemas/alert.schema';
import { ContractStatus } from '../contracts/schemas/contract.schema';
import {
  IncidentSeverity,
  IncidentStatus,
} from '../incidents/schemas/incident.schema';
import { ServiceStatus } from '../services/schemas/service.schema';
import { SyncStateStatus } from '../sync/schemas/sync-state.schema';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;

  const serviceModelMock = createModelMock();
  const applicationModelMock = createModelMock();
  const contractModelMock = createModelMock();
  const incidentModelMock = createModelMock();
  const alertModelMock = createModelMock();
  const syncStateModelMock = createModelMock();
  const userModelMock = createModelMock();

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AdminService(
      serviceModelMock as never,
      applicationModelMock as never,
      contractModelMock as never,
      incidentModelMock as never,
      alertModelMock as never,
      syncStateModelMock as never,
      userModelMock as never,
    );
  });

  it('should build a dashboard from model counters', async () => {
    mockCounts(serviceModelMock, {
      '{}': 12,
      [JSON.stringify({ status: ServiceStatus.PUBLISHED })]: 5,
      [JSON.stringify({ status: ServiceStatus.COMPLETED })]: 3,
    });
    mockCounts(applicationModelMock, { '{}': 8 });
    mockCounts(contractModelMock, {
      '{}': 4,
      [JSON.stringify({ status: ContractStatus.ACTIVE })]: 2,
      [JSON.stringify({ status: ContractStatus.COMPLETED })]: 1,
    });
    mockCounts(incidentModelMock, {
      '{}': 7,
      [JSON.stringify({ status: IncidentStatus.OPEN })]: 2,
      [JSON.stringify({ status: IncidentStatus.RESOLVED })]: 4,
    });
    mockCounts(alertModelMock, {
      '{}': 6,
      [JSON.stringify({ status: AlertStatus.OPEN })]: 2,
    });
    mockCounts(syncStateModelMock, { '{}': 3 });

    const result = await service.getDashboard();

    expect(result).toEqual({
      totalServices: 12,
      publishedServices: 5,
      completedServices: 3,
      totalApplications: 8,
      totalContracts: 4,
      activeContracts: 2,
      completedContracts: 1,
      totalIncidents: 7,
      openIncidents: 2,
      resolvedIncidents: 4,
      totalAlerts: 6,
      openAlerts: 2,
      knownSyncClients: 3,
      serverTime: expect.any(Date) as unknown as Date,
    });
  });

  it('should return recent users without passwordHash', async () => {
    const query = findQuery([
      {
        _id: 'user_1',
        email: 'admin@example.test',
        displayName: 'Admin',
        role: 'admin',
        neighborhoodId: 'quartier-centre',
        pointsBalance: 120,
        reservedPoints: 10,
        passwordHash: 'secret-hash',
        createdAt: new Date('2026-06-30T08:00:00.000Z'),
        updatedAt: new Date('2026-06-30T09:00:00.000Z'),
      },
    ]);

    userModelMock.find.mockReturnValue(query.findResult);

    const result = await service.getRecentUsers();

    expect(userModelMock.find).toHaveBeenCalledWith();
    expect(query.limit).toHaveBeenCalledWith(50);
    expect(query.select).toHaveBeenCalledWith(
      'email displayName role neighborhoodId pointsBalance reservedPoints createdAt updatedAt',
    );
    expect(result[0]).not.toHaveProperty('passwordHash');
    expect(result[0]).toEqual({
      id: 'user_1',
      email: 'admin@example.test',
      displayName: 'Admin',
      role: 'admin',
      neighborhoodId: 'quartier-centre',
      pointsBalance: 120,
      reservedPoints: 10,
      createdAt: new Date('2026-06-30T08:00:00.000Z'),
      updatedAt: new Date('2026-06-30T09:00:00.000Z'),
    });
  });

  it('should return recent services for the admin dashboard', async () => {
    const query = findQuery([
      {
        _id: 'service_1',
        title: 'Aide bricolage',
        category: 'bricolage',
        status: ServiceStatus.PUBLISHED,
        ownerId: 'user_1',
        neighborhoodId: 'quartier-centre',
        pricePoints: 15,
        selectedApplicationId: null,
        contractId: null,
        createdAt: new Date('2026-06-30T08:00:00.000Z'),
        updatedAt: new Date('2026-06-30T09:00:00.000Z'),
      },
    ]);

    serviceModelMock.find.mockReturnValue(query.findResult);

    const result = await service.getRecentServices();

    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.limit).toHaveBeenCalledWith(50);
    expect(result).toEqual([
      {
        id: 'service_1',
        title: 'Aide bricolage',
        category: 'bricolage',
        status: ServiceStatus.PUBLISHED,
        ownerId: 'user_1',
        neighborhoodId: 'quartier-centre',
        pricePoints: 15,
        selectedApplicationId: null,
        contractId: null,
        createdAt: new Date('2026-06-30T08:00:00.000Z'),
        updatedAt: new Date('2026-06-30T09:00:00.000Z'),
      },
    ]);
  });

  it('should return an incident by id', async () => {
    const query = findByIdQuery({
      _id: 'incident_1',
      title: 'Fuite eau',
      type: 'maintenance',
      status: IncidentStatus.OPEN,
      severity: IncidentSeverity.HIGH,
      neighborhoodId: 'quartier-centre',
      source: 'web',
      externalId: null,
      lastSyncedAt: null,
      createdAt: new Date('2026-06-30T08:00:00.000Z'),
      updatedAt: new Date('2026-06-30T09:00:00.000Z'),
    });

    incidentModelMock.findById.mockReturnValue(query.findResult);

    const result = await service.getIncidentById('incident_1');

    expect(incidentModelMock.findById).toHaveBeenCalledWith('incident_1');
    expect(query.select).toHaveBeenCalledWith(
      'title type status severity neighborhoodId source externalId lastSyncedAt createdAt updatedAt',
    );
    expect(result).toEqual({
      id: 'incident_1',
      title: 'Fuite eau',
      type: 'maintenance',
      status: IncidentStatus.OPEN,
      severity: IncidentSeverity.HIGH,
      neighborhoodId: 'quartier-centre',
      source: 'web',
      externalId: null,
      lastSyncedAt: null,
      createdAt: new Date('2026-06-30T08:00:00.000Z'),
      updatedAt: new Date('2026-06-30T09:00:00.000Z'),
    });
  });

  it('should return null when the incident does not exist', async () => {
    const query = findByIdQuery(null);

    incidentModelMock.findById.mockReturnValue(query.findResult);

    const result = await service.getIncidentById('missing_incident');

    expect(result).toBeNull();
  });

  it('should return alerts for an incident with the reporter name', async () => {
    const query = findQuery([
      {
        _id: 'alert_1',
        incidentId: 'incident_1',
        title: 'Alerte critique',
        details: 'Fuite majeure detectee',
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.OPEN,
        source: 'web',
        externalId: null,
        reportedById: 'user_1',
        createdAt: new Date('2026-06-30T08:00:00.000Z'),
        resolvedAt: null,
      },
    ]);

    alertModelMock.find.mockReturnValue(query.findResult);

    userModelMock.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest
            .fn()
            .mockResolvedValue([{ _id: 'user_1', displayName: 'Alice Martin' }]),
        }),
      }),
    });

    const result = await service.getIncidentAlerts('incident_1');

    expect(alertModelMock.find).toHaveBeenCalledWith({
      incidentId: 'incident_1',
    });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.select).toHaveBeenCalledWith(
      'incidentId title details severity status source externalId reportedById createdAt resolvedAt',
    );
    expect(userModelMock.find).toHaveBeenCalledWith({
      _id: { $in: ['user_1'] },
    });
    expect(result).toEqual([
      {
        id: 'alert_1',
        incidentId: 'incident_1',
        title: 'Alerte critique',
        details: 'Fuite majeure detectee',
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.OPEN,
        source: 'web',
        externalId: null,
        reportedById: 'user_1',
        createdAt: new Date('2026-06-30T08:00:00.000Z'),
        resolvedAt: null,
        reporterName: 'Alice Martin',
      },
    ]);
  });

  it('should return known sync states', async () => {
    const query = findQuery([
      {
        _id: 'sync_state_1',
        clientId: 'javafx-client-1',
        status: SyncStateStatus.SUCCESS,
        lastPullAt: new Date('2026-06-30T08:00:00.000Z'),
        lastPushAt: new Date('2026-06-30T08:05:00.000Z'),
        lastSuccessfulSyncAt: new Date('2026-06-30T08:05:00.000Z'),
        lastError: null,
        updatedAt: new Date('2026-06-30T08:05:00.000Z'),
      },
    ]);

    syncStateModelMock.find.mockReturnValue(query.findResult);

    const result = await service.getSyncStatus();

    expect(query.sort).toHaveBeenCalledWith({ updatedAt: -1 });
    expect(query.limit).toHaveBeenCalledWith(50);
    expect(result).toEqual([
      {
        id: 'sync_state_1',
        clientId: 'javafx-client-1',
        status: SyncStateStatus.SUCCESS,
        lastPullAt: new Date('2026-06-30T08:00:00.000Z'),
        lastPushAt: new Date('2026-06-30T08:05:00.000Z'),
        lastSuccessfulSyncAt: new Date('2026-06-30T08:05:00.000Z'),
        lastError: null,
        updatedAt: new Date('2026-06-30T08:05:00.000Z'),
      },
    ]);
  });
});

function createModelMock() {
  return {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };
}

function mockCounts(
  model: ReturnType<typeof createModelMock>,
  counts: Record<string, number>,
) {
  model.countDocuments.mockImplementation(
    (filter: Record<string, unknown> = {}) =>
      execResult(counts[JSON.stringify(filter)] ?? 0),
  );
}

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}

function findQuery<T>(value: T[]) {
  const exec = jest.fn().mockResolvedValue(value);
  const lean = jest.fn().mockReturnValue({ exec });
  const select = jest.fn().mockReturnValue({ lean });
  const limit = jest.fn().mockReturnValue({ select });
  const sort = jest.fn().mockReturnValue({ limit });

  return {
    exec,
    findResult: { sort },
    lean,
    limit,
    select,
    sort,
  };
}

function findByIdQuery<T>(value: T | null) {
  const exec = jest.fn().mockResolvedValue(value);
  const lean = jest.fn().mockReturnValue({ exec });
  const select = jest.fn().mockReturnValue({ lean });

  return {
    exec,
    findResult: { select },
    lean,
    select,
  };
}
