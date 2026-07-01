import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  Alert,
  AlertDocument,
} from '../alerts/schemas/alert.schema';
import {
  ServiceApplication,
  ServiceApplicationDocument,
} from '../applications/schemas/service-application.schema';
import {
  Contract,
  ContractDocument,
} from '../contracts/schemas/contract.schema';
import {
  ManagedDocument,
  ManagedDocumentDocument,
} from '../documents/schemas/managed-document.schema';
import {
  PointTransaction,
  PointTransactionDocument,
} from '../points/schemas/point-transaction.schema';
import {
  Incident,
  IncidentDocument,
} from '../incidents/schemas/incident.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import {
  SyncOperation,
  SyncOperationDocument,
} from '../sync/schemas/sync-operation.schema';

type RgpdExportDocument = Record<string, unknown> & {
  _id?: unknown;
  __v?: unknown;
  id?: unknown;
};

type ObjectLikeDocument = {
  _id?: unknown;
  id?: unknown;
  toObject?: (options?: { virtuals?: boolean }) => Record<string, unknown>;
};

@Injectable()
export class RgpdService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(ServiceApplication.name)
    private readonly applicationModel: Model<ServiceApplicationDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(PointTransaction.name)
    private readonly transactionModel: Model<PointTransactionDocument>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
    @InjectModel(SyncOperation.name)
    private readonly syncOperationModel: Model<SyncOperationDocument>,
    @InjectModel(ManagedDocument.name)
    private readonly documentModel: Model<ManagedDocumentDocument>,
  ) {}

  async exportPersonalData(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const [
      services,
      applicationsAsApplicant,
      applicationsAsOwner,
      contracts,
      pointTransactions,
      incidents,
      documents,
      syncOperations,
    ] = await Promise.all([
      this.serviceModel.find({ ownerId: userId }).exec(),
      this.applicationModel.find({ applicantId: userId }).exec(),
      this.applicationModel.find({ ownerId: userId }).exec(),
      this.contractModel
        .find({ $or: [{ requesterId: userId }, { providerId: userId }] })
        .exec(),
      this.transactionModel
        .find({ $or: [{ fromUserId: userId }, { toUserId: userId }] })
        .exec(),
      this.incidentModel.find({ reportedById: userId }).exec(),
      this.documentModel
        .find({
          $or: [
            { ownerId: userId },
            { 'fields.assignedToUserId': userId },
            { 'fields.signedByUserId': userId },
          ],
        })
        .exec(),
      // JavaFX clientId is not guaranteed to be an authenticated user id.
      // Export only operations with a direct user link in clientId or payload.
      this.syncOperationModel
        .find({
          $or: [
            { clientId: userId },
            { 'payload.userId': userId },
            { 'payload.reportedById': userId },
            { 'payload.ownerId': userId },
            { 'payload.applicantId': userId },
          ],
        })
        .exec(),
    ]);

    const incidentIds = incidents.map((incident) => incident.id);
    const alerts =
      incidentIds.length > 0
        ? await this.alertModel.find({ incidentId: { $in: incidentIds } }).exec()
        : [];

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        neighborhoodId: user.neighborhoodId,
        isActive: user.isActive,
        pointsBalance: user.pointsBalance,
        reservedPoints: user.reservedPoints,
      },
      services: this.normalizeDocuments(services),
      applicationsAsApplicant: this.normalizeDocuments(
        applicationsAsApplicant,
      ),
      applicationsAsOwner: this.normalizeDocuments(applicationsAsOwner),
      contracts: this.normalizeDocuments(contracts),
      pointTransactions: this.normalizeDocuments(pointTransactions),
      incidents: this.normalizeDocuments(incidents),
      alerts: this.normalizeDocuments(alerts),
      syncOperations: this.normalizeDocuments(syncOperations),
      documents: this.normalizeDocuments(documents),
    };
  }

  private normalizeDocuments(documents: unknown[]) {
    return documents.map((document) => this.normalizeDocument(document));
  }

  private normalizeDocument(document: unknown) {
    const plainDocument = this.toPlainDocument(document);
    const id = this.resolveDocumentId(document, plainDocument);
    const { _id, __v, id: _plainId, ...payload } = plainDocument;

    return {
      id,
      ...payload,
    };
  }

  private toPlainDocument(document: unknown): RgpdExportDocument {
    if (!document || typeof document !== 'object') {
      return {};
    }

    const objectDocument = document as ObjectLikeDocument;

    if (typeof objectDocument.toObject === 'function') {
      return objectDocument.toObject({ virtuals: false });
    }

    return { ...(document as Record<string, unknown>) };
  }

  private resolveDocumentId(
    originalDocument: unknown,
    plainDocument: RgpdExportDocument,
  ) {
    const originalObject =
      originalDocument && typeof originalDocument === 'object'
        ? (originalDocument as ObjectLikeDocument)
        : null;

    if (typeof originalObject?.id === 'string') {
      return originalObject.id;
    }

    if (typeof plainDocument.id === 'string') {
      return plainDocument.id;
    }

    if (plainDocument._id) {
      return String(plainDocument._id);
    }

    if (originalObject?._id) {
      return String(originalObject._id);
    }

    return null;
  }
}
