import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ServiceApplication,
  ServiceApplicationDocument,
  ServiceApplicationStatus,
} from '../applications/schemas/service-application.schema';
import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';
import {
  Incident,
  IncidentDocument,
} from '../incidents/schemas/incident.schema';
import {
  Neighborhood,
  NeighborhoodDocument,
} from '../neighborhoods/schemas/neighborhood.schema';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from '../services/schemas/service.schema';
import { ServiceRow, ServicesService } from '../services/services.service';
import { PublicUsersService } from '../users/public-users.service';

type UserRow = User & { _id: unknown };
type NeighborhoodRow = Neighborhood & { _id: unknown };
type IncomingApplicationGroup = { _id: string; count: number };
type ContractRow = Contract & { _id: unknown; createdAt?: Date };
type IncidentRow = Incident & { _id: unknown; createdAt?: Date };
type ServiceTitleRow = { _id: unknown; title: string };

@Injectable()
export class HomeService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(ServiceApplication.name)
    private readonly applicationModel: Model<ServiceApplicationDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    private readonly publicUsersService: PublicUsersService,
    private readonly servicesService: ServicesService,
  ) {}

  async getHome(actor: AuthenticatedUser) {
    if (!Types.ObjectId.isValid(actor.sub)) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const [
      user,
      publicProfile,
      neighborhood,
      incomingApplications,
      contracts,
      recentServiceRows,
      recentIncidents,
      createdServicesCount,
      applicationsCount,
      contractsCount,
    ] = await Promise.all([
      this.userModel
        .findOne({ _id: actor.sub, isActive: true })
        .select('_id pointsBalance reservedPoints neighborhoodId')
        .lean<UserRow | null>()
        .exec(),
      this.publicUsersService.findOne(actor.sub),
      this.neighborhoodModel
        .findOne(this.neighborhoodFilter(actor.neighborhoodId))
        .select('_id slug name city postalCode')
        .lean<NeighborhoodRow | null>()
        .exec(),
      this.applicationModel
        .aggregate<IncomingApplicationGroup>([
          {
            $match: {
              ownerId: actor.sub,
              status: {
                $in: [
                  ServiceApplicationStatus.SUBMITTED,
                  ServiceApplicationStatus.VIEWED,
                ],
              },
            },
          },
          { $group: { _id: '$serviceId', count: { $sum: 1 } } },
          { $limit: 10 },
        ])
        .exec(),
      this.contractModel
        .find({
          $or: [{ requesterId: actor.sub }, { providerId: actor.sub }],
          status: { $in: [ContractStatus.SENT, ContractStatus.ACTIVE] },
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean<ContractRow[]>()
        .exec(),
      this.serviceModel
        .find({
          neighborhoodId: actor.neighborhoodId,
          status: {
            $in: [ServiceStatus.PUBLISHED, ServiceStatus.APPLICATION_RECEIVED],
          },
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean<ServiceRow[]>()
        .exec(),
      this.incidentModel
        .find({ neighborhoodId: actor.neighborhoodId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<IncidentRow[]>()
        .exec(),
      this.serviceModel.countDocuments({ ownerId: actor.sub }).exec(),
      this.applicationModel.countDocuments({ applicantId: actor.sub }).exec(),
      this.contractModel
        .countDocuments({
          $or: [{ requesterId: actor.sub }, { providerId: actor.sub }],
        })
        .exec(),
    ]);

    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const actionServiceIds = [
      ...new Set([
        ...incomingApplications.map((entry) => entry._id),
        ...contracts.map((contract) => contract.serviceId),
      ]),
    ];
    const serviceTitles = await this.getServiceTitles(actionServiceIds);
    const recentServices = await this.servicesService.presentServices(
      recentServiceRows,
      actor,
    );

    return {
      profile: {
        ...publicProfile,
        neighborhood: neighborhood
          ? {
              id: String(neighborhood._id),
              name: neighborhood.name,
              city: neighborhood.city,
              postalCode: neighborhood.postalCode,
            }
          : null,
      },
      points: {
        availablePoints: user.pointsBalance,
        reservedPoints: user.reservedPoints,
      },
      todoItems: [
        ...incomingApplications.map((entry) => ({
          type: 'compare_applications',
          serviceId: entry._id,
          serviceTitle: serviceTitles.get(entry._id) ?? null,
          count: entry.count,
        })),
        ...contracts
          .filter(
            (contract) =>
              contract.status === ContractStatus.SENT &&
              !contract.signedByIds.includes(actor.sub),
          )
          .map((contract) => ({
            type: 'sign_contract',
            contractId: String(contract._id),
            serviceId: contract.serviceId,
            serviceTitle: serviceTitles.get(contract.serviceId) ?? null,
          })),
        ...contracts
          .filter((contract) => contract.status === ContractStatus.ACTIVE)
          .map((contract) => ({
            type: 'follow_active_contract',
            contractId: String(contract._id),
            serviceId: contract.serviceId,
            serviceTitle: serviceTitles.get(contract.serviceId) ?? null,
          })),
      ],
      recentServices,
      recentIncidents: recentIncidents.map((incident) => ({
        id: String(incident._id),
        title: incident.title,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        neighborhoodId: incident.neighborhoodId,
        createdAt: incident.createdAt,
      })),
      counts: {
        createdServices: createdServicesCount,
        applications: applicationsCount,
        contracts: contractsCount,
      },
    };
  }

  private async getServiceTitles(serviceIds: string[]) {
    const validIds = serviceIds.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) return new Map<string, string>();
    const services = await this.serviceModel
      .find({ _id: { $in: validIds } })
      .select('_id title')
      .lean<ServiceTitleRow[]>()
      .exec();
    return new Map(
      services.map((service) => [String(service._id), service.title]),
    );
  }

  private neighborhoodFilter(neighborhoodId: string) {
    const clauses: Array<Record<string, unknown>> = [{ slug: neighborhoodId }];
    if (Types.ObjectId.isValid(neighborhoodId))
      clauses.push({ _id: neighborhoodId });
    return { $or: clauses };
  }
}
