import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Alert,
  AlertDocument,
  AlertStatus,
} from '../alerts/schemas/alert.schema';
import {
  ServiceApplication,
  ServiceApplicationDocument,
} from '../applications/schemas/service-application.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';
import {
  Incident,
  IncidentDocument,
  IncidentStatus,
} from '../incidents/schemas/incident.schema';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from '../services/schemas/service.schema';
import { SyncState, SyncStateDocument } from '../sync/schemas/sync-state.schema';

const ADMIN_LIST_LIMIT = 50;

type AdminDocument = Record<string, unknown> & {
  _id?: unknown;
  id?: unknown;
};

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(ServiceApplication.name)
    private readonly applicationModel: Model<ServiceApplicationDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
    @InjectModel(SyncState.name)
    private readonly syncStateModel: Model<SyncStateDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getDashboard() {
    const [
      totalServices,
      publishedServices,
      completedServices,
      totalApplications,
      totalContracts,
      activeContracts,
      completedContracts,
      totalIncidents,
      openIncidents,
      resolvedIncidents,
      totalAlerts,
      openAlerts,
      knownSyncClients,
    ] = await Promise.all([
      this.serviceModel.countDocuments().exec(),
      this.serviceModel
        .countDocuments({ status: ServiceStatus.PUBLISHED })
        .exec(),
      this.serviceModel
        .countDocuments({ status: ServiceStatus.COMPLETED })
        .exec(),
      this.applicationModel.countDocuments().exec(),
      this.contractModel.countDocuments().exec(),
      this.contractModel
        .countDocuments({ status: ContractStatus.ACTIVE })
        .exec(),
      this.contractModel
        .countDocuments({ status: ContractStatus.COMPLETED })
        .exec(),
      this.incidentModel.countDocuments().exec(),
      this.incidentModel
        .countDocuments({ status: IncidentStatus.OPEN })
        .exec(),
      this.incidentModel
        .countDocuments({ status: IncidentStatus.RESOLVED })
        .exec(),
      this.alertModel.countDocuments().exec(),
      this.alertModel.countDocuments({ status: AlertStatus.OPEN }).exec(),
      this.syncStateModel.countDocuments().exec(),
    ]);

    return {
      totalServices,
      publishedServices,
      completedServices,
      totalApplications,
      totalContracts,
      activeContracts,
      completedContracts,
      totalIncidents,
      openIncidents,
      resolvedIncidents,
      totalAlerts,
      openAlerts,
      knownSyncClients,
      serverTime: new Date(),
    };
  }

  async getRecentServices() {
    const services = await this.serviceModel
      .find()
      .sort({ createdAt: -1 })
      .limit(ADMIN_LIST_LIMIT)
      .select(
        'title category status ownerId neighborhoodId pricePoints selectedApplicationId contractId createdAt updatedAt',
      )
      .lean()
      .exec();

    return services.map((service) =>
      this.pickDocument(service as unknown as AdminDocument, [
        'title',
        'category',
        'status',
        'ownerId',
        'neighborhoodId',
        'pricePoints',
        'selectedApplicationId',
        'contractId',
        'createdAt',
        'updatedAt',
      ]),
    );
  }

  async getRecentContracts() {
    const contracts = await this.contractModel
      .find()
      .sort({ createdAt: -1 })
      .limit(ADMIN_LIST_LIMIT)
      .select(
        'serviceId applicationId requesterId providerId payerId receiverId pricePoints status signedByIds createdAt updatedAt',
      )
      .lean()
      .exec();

    return contracts.map((contract) =>
      this.pickDocument(contract as unknown as AdminDocument, [
        'serviceId',
        'applicationId',
        'requesterId',
        'providerId',
        'payerId',
        'receiverId',
        'pricePoints',
        'status',
        'signedByIds',
        'createdAt',
        'updatedAt',
      ]),
    );
  }

  async getRecentIncidents() {
    const incidents = await this.incidentModel
      .find()
      .sort({ createdAt: -1 })
      .limit(ADMIN_LIST_LIMIT)
      .select(
        'title type status severity neighborhoodId source externalId lastSyncedAt createdAt updatedAt',
      )
      .lean()
      .exec();

    return incidents.map((incident) =>
      this.pickDocument(incident as unknown as AdminDocument, [
        'title',
        'type',
        'status',
        'severity',
        'neighborhoodId',
        'source',
        'externalId',
        'lastSyncedAt',
        'createdAt',
        'updatedAt',
      ]),
    );
  }

  async getIncidentById(id: string) {
    const incident = await this.incidentModel
      .findById(id)
      .select(
        'title type status severity neighborhoodId source externalId lastSyncedAt createdAt updatedAt',
      )
      .lean()
      .exec();

    if (!incident) {
      return null;
    }

    return this.pickDocument(incident as unknown as AdminDocument, [
      'title',
      'type',
      'status',
      'severity',
      'neighborhoodId',
      'source',
      'externalId',
      'lastSyncedAt',
      'createdAt',
      'updatedAt',
    ]);
  }

  async getIncidentAlerts(incidentId: string) {
    const alerts = await this.alertModel
      .find({ incidentId })
      .sort({ createdAt: -1 })
      .limit(ADMIN_LIST_LIMIT)
      .select(
        'incidentId title details severity status source externalId reportedById createdAt resolvedAt',
      )
      .lean()
      .exec();

    const reporterIds = Array.from(
      new Set(
        alerts
          .map((alert) => alert.reportedById as string | null)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const reporters = reporterIds.length
      ? await this.userModel
          .find({ _id: { $in: reporterIds } })
          .select('displayName')
          .lean()
          .exec()
      : [];

    const reporterNameById = new Map(
      reporters.map((user) => [String(user._id), user.displayName]),
    );

    return alerts.map((alert) => {
      const picked = this.pickDocument(alert as unknown as AdminDocument, [
        'incidentId',
        'title',
        'details',
        'severity',
        'status',
        'source',
        'externalId',
        'reportedById',
        'createdAt',
        'resolvedAt',
      ]);

      const reportedById = alert.reportedById as string | null;

      return {
        ...picked,
        reporterName: reportedById
          ? (reporterNameById.get(reportedById) ?? null)
          : null,
      };
    });
  }

  async getSyncStatus() {
    const states = await this.syncStateModel
      .find()
      .sort({ updatedAt: -1 })
      .limit(ADMIN_LIST_LIMIT)
      .select(
        'clientId status lastPullAt lastPushAt lastSuccessfulSyncAt lastError updatedAt',
      )
      .lean()
      .exec();

    return states.map((state) =>
      this.pickDocument(state as unknown as AdminDocument, [
        'clientId',
        'status',
        'lastPullAt',
        'lastPushAt',
        'lastSuccessfulSyncAt',
        'lastError',
        'updatedAt',
      ]),
    );
  }

  async getRecentUsers() {
    const users = await this.userModel
      .find()
      .sort({ createdAt: -1 })
      .limit(ADMIN_LIST_LIMIT)
      .select(
        'email displayName role neighborhoodId pointsBalance reservedPoints createdAt updatedAt',
      )
      .lean()
      .exec();

    return users.map((user) =>
      this.pickDocument(user as unknown as AdminDocument, [
        'email',
        'displayName',
        'role',
        'neighborhoodId',
        'pointsBalance',
        'reservedPoints',
        'createdAt',
        'updatedAt',
      ]),
    );
  }

  private pickDocument(document: AdminDocument, fields: string[]) {
    const output: Record<string, unknown> = {
      id: this.getDocumentId(document),
    };

    for (const field of fields) {
      output[field] = document[field];
    }

    return output;
  }

  private getDocumentId(document: AdminDocument) {
    if (typeof document.id === 'string') {
      return document.id;
    }

    if (document._id) {
      return String(document._id);
    }

    return null;
  }
}
