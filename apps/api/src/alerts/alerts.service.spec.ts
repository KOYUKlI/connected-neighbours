import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { Role } from '../auth/role.enum';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from '../incidents/schemas/incident.schema';
import { AlertsService } from './alerts.service';
import {
  AlertSeverity,
  AlertSource,
  AlertStatus,
} from './schemas/alert.schema';

describe('AlertsService', () => {
  let service: AlertsService;

  const alertModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const incidentModelMock = {
    findById: jest.fn(),
  };

  const userModelMock = {
    find: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AlertsService(
      alertModelMock as never,
      incidentModelMock as never,
      userModelMock as never,
    );
  });

  it('should create an alert linked to an existing incident', async () => {
    const alert = {
      id: 'alert_1',
      incidentId: 'incident_1',
      status: AlertStatus.CREATED,
    };

    incidentModelMock.findById.mockReturnValue(
      execResult(incidentDocument({ reportedById: 'reporter' })),
    );
    alertModelMock.create.mockResolvedValue(alert);

    const result = await service.create(
      'incident_1',
      {
        title: 'Porte forcee',
        details: 'La serrure est abimee.',
        severity: AlertSeverity.HIGH,
      },
      'user_1',
    );

    expect(alertModelMock.create).toHaveBeenCalledWith({
      incidentId: 'incident_1',
      title: 'Porte forcee',
      details: 'La serrure est abimee.',
      severity: AlertSeverity.HIGH,
      status: AlertStatus.CREATED,
      source: AlertSource.WEB,
      externalId: null,
      reportedById: 'user_1',
      resolvedAt: null,
    });
    expect(result).toEqual(alert);
  });

  it('should enrich alerts with the reporter display name', async () => {
    incidentModelMock.findById.mockReturnValue(execResult(incidentDocument()));

    const alertsExec = jest.fn().mockResolvedValue([
      {
        id: 'alert_1',
        incidentId: 'incident_1',
        title: 'Porte forcee',
        reportedById: 'user_1',
      },
      {
        id: 'alert_2',
        incidentId: 'incident_1',
        title: 'Alerte anonyme',
        reportedById: null,
      },
    ]);
    alertModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({ exec: alertsExec }),
      }),
    });

    const usersExec = jest
      .fn()
      .mockResolvedValue([{ _id: 'user_1', displayName: 'Alice Martin' }]);
    userModelMock.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({ exec: usersExec }),
      }),
    });

    const result = await service.findForIncident('incident_1');

    expect(userModelMock.find).toHaveBeenCalledWith({
      _id: { $in: ['user_1'] },
    });
    expect(result).toEqual([
      {
        id: 'alert_1',
        incidentId: 'incident_1',
        title: 'Porte forcee',
        reportedById: 'user_1',
        reporterName: 'Alice Martin',
      },
      {
        id: 'alert_2',
        incidentId: 'incident_1',
        title: 'Alerte anonyme',
        reportedById: null,
        reporterName: null,
      },
    ]);
  });

  it('should reject alert creation when the incident does not exist', async () => {
    incidentModelMock.findById.mockReturnValue(execResult(null));

    await expect(
      service.create(
        'missing_incident',
        {
          title: 'Porte forcee',
          details: 'La serrure est abimee.',
          severity: AlertSeverity.HIGH,
        },
        user('reporter'),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject alert creation from an unrelated resident', async () => {
    incidentModelMock.findById.mockReturnValue(
      execResult(incidentDocument({ reportedById: 'reporter' })),
    );

    await expect(
      service.create(
        'incident_1',
        {
          title: 'Porte forcee',
          details: 'La serrure est abimee.',
          severity: AlertSeverity.HIGH,
        },
        user('other_resident'),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow an admin to resolve an alert and set resolvedAt', async () => {
    const alert = {
      id: 'alert_1',
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date(),
    };

    alertModelMock.findByIdAndUpdate.mockReturnValue(execResult(alert));

    const result = await service.resolve('alert_1', user('admin', Role.ADMIN));

    expect(alertModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'alert_1',
      {
        status: AlertStatus.RESOLVED,
        resolvedAt: expect.any(Date) as unknown as Date,
      },
      { returnDocument: 'after', runValidators: true },
    );
    expect(result).toEqual(alert);
  });

  it('should reject resolving an alert as a resident', async () => {
    await expect(service.resolve('alert_1', user('resident'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw when the alert does not exist', async () => {
    alertModelMock.findById.mockReturnValue(execResult(null));

    await expect(service.findOne('missing_alert')).rejects.toThrow(
      NotFoundException,
    );
  });
});

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}

function incidentDocument(input: { reportedById?: string } = {}) {
  return {
    id: 'incident_1',
    title: 'Local velo force',
    description: 'La porte semble forcee.',
    type: IncidentType.SECURITY,
    status: IncidentStatus.REPORTED,
    severity: IncidentSeverity.HIGH,
    neighborhoodId: 'quartier-centre',
    reportedById: input.reportedById ?? null,
  };
}

function user(sub: string, role = Role.RESIDENT) {
  return {
    sub,
    role,
  };
}
