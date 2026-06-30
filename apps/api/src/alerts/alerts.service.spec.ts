import { NotFoundException } from '@nestjs/common';

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

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AlertsService(
      alertModelMock as never,
      incidentModelMock as never,
    );
  });

  it('should create an alert linked to an existing incident', async () => {
    const alert = {
      id: 'alert_1',
      incidentId: 'incident_1',
      status: AlertStatus.CREATED,
    };

    incidentModelMock.findById.mockReturnValue(execResult(incidentDocument()));
    alertModelMock.create.mockResolvedValue(alert);

    const result = await service.create('incident_1', {
      title: 'Porte forcee',
      details: 'La serrure est abimee.',
      severity: AlertSeverity.HIGH,
    });

    expect(alertModelMock.create).toHaveBeenCalledWith({
      incidentId: 'incident_1',
      title: 'Porte forcee',
      details: 'La serrure est abimee.',
      severity: AlertSeverity.HIGH,
      status: AlertStatus.CREATED,
      source: AlertSource.WEB,
      externalId: null,
      resolvedAt: null,
    });
    expect(result).toEqual(alert);
  });

  it('should reject alert creation when the incident does not exist', async () => {
    incidentModelMock.findById.mockReturnValue(execResult(null));

    await expect(
      service.create('missing_incident', {
        title: 'Porte forcee',
        details: 'La serrure est abimee.',
        severity: AlertSeverity.HIGH,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should resolve an alert and set resolvedAt', async () => {
    const alert = {
      id: 'alert_1',
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date(),
    };

    alertModelMock.findByIdAndUpdate.mockReturnValue(execResult(alert));

    const result = await service.resolve('alert_1');

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

function incidentDocument() {
  return {
    id: 'incident_1',
    title: 'Local velo force',
    description: 'La porte semble forcee.',
    type: IncidentType.SECURITY,
    status: IncidentStatus.REPORTED,
    severity: IncidentSeverity.HIGH,
    neighborhoodId: 'quartier-centre',
  };
}
