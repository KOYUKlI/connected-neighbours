import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { Role } from '../auth/role.enum';
import { IncidentsService } from './incidents.service';
import {
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  IncidentType,
} from './schemas/incident.schema';

describe('IncidentsService', () => {
  let service: IncidentsService;

  const incidentModelMock = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new IncidentsService(incidentModelMock as never);
  });

  it('should create an incident with web source and reported status by default', async () => {
    const incident = {
      id: 'incident_1',
      title: 'Local velo force',
      status: IncidentStatus.REPORTED,
      source: IncidentSource.WEB,
    };

    incidentModelMock.create.mockResolvedValue(incident);

    const result = await service.create(
      {
        title: 'Local velo force',
        description: 'La porte semble forcee.',
        type: IncidentType.SECURITY,
        severity: IncidentSeverity.HIGH,
        neighborhoodId: 'quartier-centre',
      },
      user('user_1'),
    );

    expect(incidentModelMock.create).toHaveBeenCalledWith({
      title: 'Local velo force',
      description: 'La porte semble forcee.',
      type: IncidentType.SECURITY,
      status: IncidentStatus.REPORTED,
      severity: IncidentSeverity.HIGH,
      neighborhoodId: 'quartier-centre',
      reportedById: 'user_1',
      source: IncidentSource.WEB,
      externalId: null,
      lastSyncedAt: null,
    });
    expect(result).toEqual(incident);
  });

  it('should allow an admin to resolve an incident', async () => {
    const incident = {
      id: 'incident_1',
      status: IncidentStatus.RESOLVED,
    };

    incidentModelMock.findByIdAndUpdate.mockReturnValue(execResult(incident));

    const result = await service.resolve('incident_1', user('admin', Role.ADMIN));

    expect(incidentModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'incident_1',
      { status: IncidentStatus.RESOLVED },
      { returnDocument: 'after', runValidators: true },
    );
    expect(result).toEqual(incident);
  });

  it('should reject resolving an incident as a resident', async () => {
    await expect(
      service.resolve('incident_1', user('resident')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow the reporter to update simple incident fields', async () => {
    const incident = incidentDocument({
      id: 'incident_1',
      reportedById: 'reporter',
      status: IncidentStatus.REPORTED,
    });
    const updatedIncident = {
      ...incident,
      title: 'Nouveau titre',
    };

    incidentModelMock.findById.mockReturnValue(execResult(incident));
    incidentModelMock.findByIdAndUpdate.mockReturnValue(
      execResult(updatedIncident),
    );

    const result = await service.update(
      'incident_1',
      { title: 'Nouveau titre' },
      user('reporter'),
    );

    expect(incidentModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'incident_1',
      { title: 'Nouveau titre' },
      { returnDocument: 'after', runValidators: true },
    );
    expect(result).toEqual(updatedIncident);
  });

  it('should reject sensitive updates by the reporter', async () => {
    incidentModelMock.findById.mockReturnValue(
      execResult(
        incidentDocument({
          id: 'incident_1',
          reportedById: 'reporter',
          status: IncidentStatus.REPORTED,
        }),
      ),
    );

    await expect(
      service.update(
        'incident_1',
        { status: IncidentStatus.RESOLVED },
        user('reporter'),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow a moderator to close an incident', async () => {
    const incident = incidentDocument({
      id: 'incident_1',
      reportedById: 'reporter',
      status: IncidentStatus.OPEN,
    });

    incidentModelMock.findById.mockReturnValue(execResult(incident));

    const result = await service.close(
      'incident_1',
      user('moderator', Role.MODERATOR),
    );

    expect(incident.status).toBe(IncidentStatus.CLOSED);
    expect(incident.save).toHaveBeenCalled();
    expect(result).toEqual(incident);
  });

  it('should reject closing a rejected incident', async () => {
    incidentModelMock.findById.mockReturnValue(
      execResult(
        incidentDocument({
          id: 'incident_1',
          reportedById: 'reporter',
          status: IncidentStatus.REJECTED,
        }),
      ),
    );

    await expect(
      service.close('incident_1', user('admin', Role.ADMIN)),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when the incident does not exist', async () => {
    incidentModelMock.findById.mockReturnValue(execResult(null));

    await expect(service.findOne('missing_incident')).rejects.toThrow(
      NotFoundException,
    );
  });
});

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}

function incidentDocument(input: {
  id: string;
  reportedById?: string;
  status: IncidentStatus;
}) {
  const incident = {
    id: input.id,
    reportedById: input.reportedById ?? null,
    status: input.status,
    save: jest.fn(),
  };

  incident.save.mockResolvedValue(incident);
  return incident;
}

function user(sub: string, role = Role.RESIDENT) {
  return {
    sub,
    role,
  };
}
