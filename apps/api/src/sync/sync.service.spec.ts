import { BadRequestException } from '@nestjs/common';

import { AlertSeverity } from '../alerts/schemas/alert.schema';
import {
  IncidentSeverity,
  IncidentType,
} from '../incidents/schemas/incident.schema';
import {
  SyncEntityType,
  SyncOperationStatus,
  SyncOperationType,
} from './schemas/sync-operation.schema';
import { SyncStateStatus } from './schemas/sync-state.schema';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  let service: SyncService;

  const syncOperationModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const syncStateModelMock = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const incidentModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const alertModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    syncOperationModelMock.create.mockImplementation(async (value) => value);
    syncOperationModelMock.findOne.mockReturnValue(execResult(null));
    syncStateModelMock.findOneAndUpdate.mockReturnValue(execResult({}));

    service = new SyncService(
      syncOperationModelMock as never,
      syncStateModelMock as never,
      incidentModelMock as never,
      alertModelMock as never,
    );
  });

  it('should push an incident creation from JavaFX', async () => {
    incidentModelMock.create.mockResolvedValue({ id: 'incident_1' });

    const result = await service.push({
      clientId: 'javafx-client-1',
      operations: [
        {
          operationId: 'op_create_incident_1',
          entityType: SyncEntityType.INCIDENT,
          operationType: SyncOperationType.CREATE,
          payload: incidentPayload(),
        },
      ],
    });

    expect(incidentModelMock.create).toHaveBeenCalledWith({
      ...incidentPayload(),
      source: 'javafx',
      lastSyncedAt: expect.any(Date) as unknown as Date,
    });
    expect(syncOperationModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: 'op_create_incident_1',
        clientId: 'javafx-client-1',
        entityType: SyncEntityType.INCIDENT,
        entityId: 'incident_1',
        operationType: SyncOperationType.CREATE,
        status: SyncOperationStatus.ACCEPTED,
        error: null,
      }),
    );
    expect(result.acceptedOperations).toHaveLength(1);
    expect(result.rejectedOperations).toHaveLength(0);
  });

  it('should not replay an operation with the same operationId', async () => {
    syncOperationModelMock.findOne.mockReturnValue(
      execResult({
        operationId: 'op_existing',
        clientId: 'javafx-client-1',
        entityType: SyncEntityType.INCIDENT,
        entityId: 'incident_1',
        operationType: SyncOperationType.CREATE,
        status: SyncOperationStatus.ACCEPTED,
        error: null,
        receivedAt: new Date(),
      }),
    );

    const result = await service.push({
      clientId: 'javafx-client-1',
      operations: [
        {
          operationId: 'op_existing',
          entityType: SyncEntityType.INCIDENT,
          operationType: SyncOperationType.CREATE,
          payload: incidentPayload(),
        },
      ],
    });

    expect(incidentModelMock.create).not.toHaveBeenCalled();
    expect(syncOperationModelMock.create).not.toHaveBeenCalled();
    expect(result.acceptedOperations).toHaveLength(1);
  });

  it('should push an incident update from JavaFX', async () => {
    incidentModelMock.findByIdAndUpdate.mockReturnValue(
      execResult({ id: 'incident_1' }),
    );

    const result = await service.push({
      clientId: 'javafx-client-1',
      operations: [
        {
          operationId: 'op_update_incident_1',
          entityType: SyncEntityType.INCIDENT,
          entityId: 'incident_1',
          operationType: SyncOperationType.UPDATE,
          payload: {
            status: 'in_progress',
            externalId: 'javafx-incident-1',
          },
        },
      ],
    });

    expect(incidentModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'incident_1',
      {
        status: 'in_progress',
        externalId: 'javafx-incident-1',
        lastSyncedAt: expect.any(Date) as unknown as Date,
      },
      { returnDocument: 'after', runValidators: true },
    );
    expect(result.acceptedOperations).toHaveLength(1);
    expect(result.rejectedOperations).toHaveLength(0);
  });

  it('should reject an invalid operation without failing the batch', async () => {
    const result = await service.push({
      clientId: 'javafx-client-1',
      operations: [
        {
          operationId: 'op_invalid_alert',
          entityType: SyncEntityType.ALERT,
          operationType: SyncOperationType.CREATE,
          payload: {
            title: 'Alerte sans incident',
            details: 'Incident manquant.',
            severity: AlertSeverity.HIGH,
          },
        },
      ],
    });

    expect(result.acceptedOperations).toHaveLength(0);
    expect(result.rejectedOperations).toHaveLength(1);
    expect(result.rejectedOperations[0].error).toContain('incidentId');
    expect(syncOperationModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: 'op_invalid_alert',
        status: SyncOperationStatus.REJECTED,
      }),
    );
  });

  it('should pull incidents and alerts updated since a date', async () => {
    const since = '2026-06-30T08:00:00.000Z';
    const incident = { id: 'incident_1' };
    const alert = { id: 'alert_1' };

    incidentModelMock.find.mockReturnValue(sortExecResult([incident]));
    alertModelMock.find.mockReturnValue(sortExecResult([alert]));

    const result = await service.pull({
      clientId: 'javafx-client-1',
      since,
    });

    expect(incidentModelMock.find).toHaveBeenCalledWith({
      updatedAt: { $gt: new Date(since) },
    });
    expect(alertModelMock.find).toHaveBeenCalledWith({
      updatedAt: { $gt: new Date(since) },
    });
    expect(result.incidents).toEqual([incident]);
    expect(result.alerts).toEqual([alert]);
    expect(syncStateModelMock.findOneAndUpdate).toHaveBeenCalledWith(
      { clientId: 'javafx-client-1' },
      {
        $set: { lastPullAt: expect.any(Date) as unknown as Date },
        $setOnInsert: { clientId: 'javafx-client-1' },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    );
  });

  it('should expose a client sync status', async () => {
    const state = {
      clientId: 'javafx-client-1',
      status: SyncStateStatus.SUCCESS,
      lastError: null,
    };

    syncStateModelMock.findOne.mockReturnValue(execResult(state));

    const result = await service.getStatus('javafx-client-1');

    expect(result).toEqual(state);
  });

  it('should reject an invalid pull date', async () => {
    await expect(
      service.pull({ clientId: 'javafx-client-1', since: 'not-a-date' }),
    ).rejects.toThrow(BadRequestException);
  });
});

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}

function sortExecResult<T>(value: T) {
  return {
    sort: jest.fn().mockReturnValue(execResult(value)),
  };
}

function incidentPayload() {
  return {
    title: 'Eclairage en panne',
    description: 'Lampadaire eteint devant le batiment B.',
    type: IncidentType.MAINTENANCE,
    severity: IncidentSeverity.MEDIUM,
    neighborhoodId: 'quartier-centre',
    externalId: 'javafx-incident-1',
  };
}
