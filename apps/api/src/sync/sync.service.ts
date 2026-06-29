import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Alert,
  AlertDocument,
  AlertSource,
} from '../alerts/schemas/alert.schema';
import {
  Incident,
  IncidentDocument,
  IncidentSource,
} from '../incidents/schemas/incident.schema';
import { PullSyncQueryDto } from './dto/pull-sync-query.dto';
import { PushSyncDto, SyncOperationInputDto } from './dto/push-sync.dto';
import {
  SyncEntityType,
  SyncOperation,
  SyncOperationDocument,
  SyncOperationStatus,
  SyncOperationType,
} from './schemas/sync-operation.schema';
import {
  SyncState,
  SyncStateDocument,
  SyncStateStatus,
} from './schemas/sync-state.schema';

type SyncOperationResult = {
  operationId: string;
  clientId: string;
  entityType: SyncEntityType;
  entityId: string | null;
  operationType: SyncOperationType;
  status: SyncOperationStatus;
  error: string | null;
  receivedAt: Date;
};

@Injectable()
export class SyncService {
  constructor(
    @InjectModel(SyncOperation.name)
    private readonly syncOperationModel: Model<SyncOperationDocument>,
    @InjectModel(SyncState.name)
    private readonly syncStateModel: Model<SyncStateDocument>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
  ) {}

  async push(dto: PushSyncDto) {
    this.assertClientId(dto.clientId);

    const serverTime = new Date();
    const acceptedOperations: SyncOperationResult[] = [];
    const rejectedOperations: SyncOperationResult[] = [];

    for (const operation of dto.operations) {
      const existingOperation = await this.syncOperationModel
        .findOne({ operationId: operation.operationId })
        .exec();

      if (existingOperation) {
        this.addOperationResult(
          this.toOperationResult(existingOperation),
          acceptedOperations,
          rejectedOperations,
        );
        continue;
      }

      try {
        const entityId = await this.applyOperation(operation);
        const syncOperation = await this.syncOperationModel.create({
          operationId: operation.operationId,
          clientId: dto.clientId,
          entityType: operation.entityType,
          entityId: entityId ?? operation.entityId ?? null,
          operationType: operation.operationType,
          payload: operation.payload,
          status: SyncOperationStatus.ACCEPTED,
          error: null,
          receivedAt: new Date(),
        });

        acceptedOperations.push(this.toOperationResult(syncOperation));
      } catch (error) {
        const syncOperation = await this.syncOperationModel.create({
          operationId: operation.operationId,
          clientId: dto.clientId,
          entityType: operation.entityType,
          entityId: operation.entityId ?? null,
          operationType: operation.operationType,
          payload: operation.payload,
          status: SyncOperationStatus.REJECTED,
          error: this.getErrorMessage(error),
          receivedAt: new Date(),
        });

        rejectedOperations.push(this.toOperationResult(syncOperation));
      }
    }

    await this.updateState(dto.clientId, {
      lastPushAt: serverTime,
      lastSuccessfulSyncAt: serverTime,
      status: SyncStateStatus.SUCCESS,
      lastError: null,
    });

    return {
      serverTime,
      acceptedOperations,
      rejectedOperations,
    };
  }

  async pull(query: PullSyncQueryDto) {
    this.assertClientId(query.clientId);

    const serverTime = new Date();
    const filter = this.buildUpdatedSinceFilter(query.since);

    const [incidents, alerts] = await Promise.all([
      this.incidentModel.find(filter).sort({ updatedAt: -1 }).exec(),
      this.alertModel.find(filter).sort({ updatedAt: -1 }).exec(),
    ]);

    await this.updateState(query.clientId, {
      lastPullAt: serverTime,
    });

    return {
      serverTime,
      incidents,
      alerts,
    };
  }

  async getStatus(clientId: string) {
    this.assertClientId(clientId);

    const existingState = await this.syncStateModel
      .findOne({ clientId })
      .exec();

    if (existingState) {
      return existingState;
    }

    return this.syncStateModel.create({
      clientId,
      lastPullAt: null,
      lastPushAt: null,
      lastSuccessfulSyncAt: null,
      status: SyncStateStatus.IDLE,
      lastError: null,
    });
  }

  async getHistory(clientId: string) {
    this.assertClientId(clientId);

    return this.syncOperationModel
      .find({ clientId })
      .sort({ receivedAt: -1 })
      .exec();
  }

  private async applyOperation(operation: SyncOperationInputDto) {
    if (operation.entityType === SyncEntityType.INCIDENT) {
      return this.applyIncidentOperation(operation);
    }

    if (operation.entityType === SyncEntityType.ALERT) {
      return this.applyAlertOperation(operation);
    }

    throw new BadRequestException('Type d entite de synchronisation invalide');
  }

  private async applyIncidentOperation(operation: SyncOperationInputDto) {
    if (operation.operationType === SyncOperationType.CREATE) {
      const incident = await this.incidentModel.create({
        ...operation.payload,
        source: IncidentSource.JAVAFX,
        lastSyncedAt: new Date(),
      });

      return this.getDocumentId(incident);
    }

    if (operation.operationType === SyncOperationType.UPDATE) {
      if (!operation.entityId) {
        throw new BadRequestException(
          'entityId est requis pour mettre a jour un incident',
        );
      }

      const incident = await this.incidentModel
        .findByIdAndUpdate(
          operation.entityId,
          {
            ...operation.payload,
            lastSyncedAt: new Date(),
          },
          { new: true, runValidators: true },
        )
        .exec();

      if (!incident) {
        throw new NotFoundException(
          `Incident ${operation.entityId} introuvable`,
        );
      }

      return this.getDocumentId(incident);
    }

    throw new BadRequestException(
      'Type d operation incident de synchronisation invalide',
    );
  }

  private async applyAlertOperation(operation: SyncOperationInputDto) {
    if (operation.operationType === SyncOperationType.CREATE) {
      const incidentId = this.getPayloadString(operation.payload, 'incidentId');

      if (!incidentId) {
        throw new BadRequestException(
          'incidentId est requis pour creer une alerte',
        );
      }

      const incident = await this.incidentModel.findById(incidentId).exec();

      if (!incident) {
        throw new NotFoundException(`Incident ${incidentId} introuvable`);
      }

      const alert = await this.alertModel.create({
        ...operation.payload,
        incidentId,
        source: AlertSource.JAVAFX,
      });

      return this.getDocumentId(alert);
    }

    if (operation.operationType === SyncOperationType.UPDATE) {
      if (!operation.entityId) {
        throw new BadRequestException(
          'entityId est requis pour mettre a jour une alerte',
        );
      }

      const alert = await this.alertModel
        .findByIdAndUpdate(operation.entityId, operation.payload, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!alert) {
        throw new NotFoundException(`Alerte ${operation.entityId} introuvable`);
      }

      return this.getDocumentId(alert);
    }

    throw new BadRequestException(
      'Type d operation alerte de synchronisation invalide',
    );
  }

  private async updateState(
    clientId: string,
    updates: Partial<SyncState>,
  ) {
    await this.syncStateModel
      .findOneAndUpdate(
        { clientId },
        {
          $set: updates,
          $setOnInsert: { clientId },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  private buildUpdatedSinceFilter(since?: string) {
    if (!since) {
      return {};
    }

    const sinceDate = new Date(since);

    if (Number.isNaN(sinceDate.getTime())) {
      throw new BadRequestException('Le parametre since doit etre une date ISO');
    }

    return {
      updatedAt: {
        $gt: sinceDate,
      },
    };
  }

  private addOperationResult(
    operation: SyncOperationResult,
    acceptedOperations: SyncOperationResult[],
    rejectedOperations: SyncOperationResult[],
  ) {
    if (operation.status === SyncOperationStatus.ACCEPTED) {
      acceptedOperations.push(operation);
      return;
    }

    rejectedOperations.push(operation);
  }

  private toOperationResult(operation: SyncOperation): SyncOperationResult {
    return {
      operationId: operation.operationId,
      clientId: operation.clientId,
      entityType: operation.entityType,
      entityId: operation.entityId,
      operationType: operation.operationType,
      status: operation.status,
      error: operation.error,
      receivedAt: operation.receivedAt,
    };
  }

  private getPayloadString(
    payload: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = payload[key];

    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private getDocumentId(document: unknown): string | null {
    if (!document || typeof document !== 'object') {
      return null;
    }

    const record = document as { id?: unknown; _id?: unknown };

    if (typeof record.id === 'string') {
      return record.id;
    }

    if (record._id) {
      return String(record._id);
    }

    return null;
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error
      ? error.message
      : 'Operation de synchronisation rejetee';
  }

  private assertClientId(clientId: string) {
    if (!clientId || clientId.trim().length === 0) {
      throw new BadRequestException('clientId est requis');
    }
  }
}
