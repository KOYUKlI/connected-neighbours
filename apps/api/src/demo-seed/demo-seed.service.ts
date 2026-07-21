import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ServiceApplication,
  ServiceApplicationDocument,
  ServiceApplicationStatus,
} from '../applications/schemas/service-application.schema';
import { Role } from '../auth/role.enum';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { UsersService } from '../auth/users.service';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';
import {
  Incident,
  IncidentDocument,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  IncidentType,
} from '../incidents/schemas/incident.schema';
import { PointsService } from '../points/points.service';
import {
  ServiceProof,
  ServiceProofDocument,
  ServiceProofType,
} from '../services/schemas/service-proof.schema';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
  ServiceType,
} from '../services/schemas/service.schema';

type DemoServiceInput = Pick<
  Service,
  | 'title'
  | 'description'
  | 'type'
  | 'category'
  | 'availability'
  | 'isPaid'
  | 'pricePoints'
  | 'status'
>;

@Injectable()
export class DemoSeedService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(ServiceApplication.name)
    private readonly applicationModel: Model<ServiceApplicationDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(ServiceProof.name)
    private readonly proofModel: Model<ServiceProofDocument>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    private readonly usersService: UsersService,
    private readonly pointsService: PointsService,
  ) {}

  async onModuleInit() {
    if (
      process.env.DEV_AUTH_SEED !== 'true' ||
      process.env.NODE_ENV === 'test'
    ) {
      return;
    }

    const [alice, bob, claire] = await Promise.all([
      this.usersService.ensureDevUser({
        email: 'alice@connected-neighbours.local',
        displayName: 'Alice Martin',
        role: Role.RESIDENT,
        neighborhoodId: 'quartier-centre',
        password: 'alice123',
      }),
      this.usersService.ensureDevUser({
        email: 'bob@connected-neighbours.local',
        displayName: 'Bob Dupont',
        role: Role.RESIDENT,
        neighborhoodId: 'quartier-centre',
        password: 'bob123',
      }),
      this.usersService.ensureDevUser({
        email: 'claire@connected-neighbours.local',
        displayName: 'Claire Bernard',
        role: Role.RESIDENT,
        neighborhoodId: 'quartier-centre',
        password: 'claire123',
      }),
    ]);

    await this.userModel
      .updateOne(
        { _id: bob.id, pointsBalance: 100, reservedPoints: 0 },
        { $set: { pointsBalance: 125 } },
      )
      .exec();

    const furniture = await this.ensureService(alice.id, {
      title: 'Aide pour monter un meuble',
      description:
        "Je cherche un voisin disponible samedi pour m'aider a monter une armoire.",
      type: ServiceType.REQUEST,
      category: 'Bricolage',
      availability: 'Samedi apres-midi',
      isPaid: true,
      pricePoints: 25,
      status: ServiceStatus.PUBLISHED,
    });
    await this.ensureService(bob.id, {
      title: 'Garde de chat ce week-end',
      description: 'Je peux garder votre chat a domicile pendant le week-end.',
      type: ServiceType.OFFER,
      category: 'Animaux',
      availability: 'Ce week-end',
      isPaid: true,
      pricePoints: 20,
      status: ServiceStatus.PUBLISHED,
    });
    await this.ensureService(claire.id, {
      title: 'Cours de maths niveau lycee',
      description: 'Cours de soutien et revision des bases pour le lycee.',
      type: ServiceType.OFFER,
      category: 'Cours',
      availability: 'Mercredi et vendredi soir',
      isPaid: true,
      pricePoints: 30,
      status: ServiceStatus.PUBLISHED,
    });
    await this.ensureService(alice.id, {
      title: 'Arrosage de plantes',
      description:
        "Brouillon d'une demande pour la prochaine periode de vacances.",
      type: ServiceType.REQUEST,
      category: 'Jardinage',
      availability: 'A definir',
      isPaid: false,
      pricePoints: null,
      status: ServiceStatus.DRAFT,
    });
    const computerHelp = await this.ensureService(bob.id, {
      title: 'Aide informatique',
      description:
        'Installation, mises a jour et prise en main de votre ordinateur.',
      type: ServiceType.OFFER,
      category: 'Informatique',
      availability: 'En semaine apres 18 h',
      isPaid: true,
      pricePoints: 15,
      status: ServiceStatus.APPLICATION_RECEIVED,
    });

    await this.ensureFurnitureWorkflow(furniture, alice, bob, claire);
    await this.ensureExecutionDemos(alice, bob);
    await this.ensureApplication(
      computerHelp,
      claire.id,
      bob.id,
      ServiceApplicationStatus.SUBMITTED,
      "Bonjour Bob, j'aurais besoin d'aide pour securiser mon ordinateur.",
    );
    await this.ensureIncident(alice.id);
  }

  private async ensureService(ownerId: string, input: DemoServiceInput) {
    const existing = await this.serviceModel
      .findOne({ ownerId, title: input.title })
      .exec();
    if (existing) return existing;
    return this.serviceModel.create({
      ...input,
      ownerId,
      neighborhoodId: 'quartier-centre',
      selectedApplicationId: null,
      contractId: null,
    });
  }

  private async ensureFurnitureWorkflow(
    service: ServiceDocument,
    alice: UserDocument,
    bob: UserDocument,
    claire: UserDocument,
  ) {
    const accepted = await this.ensureApplication(
      service,
      bob.id,
      alice.id,
      ServiceApplicationStatus.ACCEPTED,
      'Bonjour Alice, je suis disponible samedi et je peux apporter mes outils.',
    );
    await this.ensureApplication(
      service,
      claire.id,
      alice.id,
      ServiceApplicationStatus.REJECTED,
      'Je peux egalement vous aider dimanche matin.',
    );

    const existingContract = await this.contractModel
      .findOne({ serviceId: service.id })
      .exec();
    if (accepted.status !== ServiceApplicationStatus.ACCEPTED) return;

    if (existingContract) {
      if (existingContract.status === ContractStatus.SENT) {
        const signedAt = new Date();
        await this.contractModel
          .updateOne(
            { _id: existingContract.id, status: ContractStatus.SENT },
            {
              $set: {
                status: ContractStatus.ACTIVE,
                signedByIds: [alice.id, bob.id],
                signedAt,
              },
            },
          )
          .exec();
        await this.serviceModel
          .updateOne(
            { _id: service.id },
            {
              $set: {
                status: ServiceStatus.SCHEDULED,
                scheduledAt: signedAt,
              },
            },
          )
          .exec();
      }
      return;
    }

    const contractId = new Types.ObjectId().toString();
    await this.userModel
      .updateOne(
        { _id: alice.id },
        { $set: { pointsBalance: 100, reservedPoints: 0 } },
      )
      .exec();
    await this.pointsService.reservePoints(
      alice.id,
      25,
      contractId,
      service.id,
    );
    await this.contractModel.create({
      _id: contractId,
      serviceId: service.id,
      applicationId: accepted.id,
      requesterId: alice.id,
      providerId: bob.id,
      payerId: alice.id,
      receiverId: bob.id,
      pricePoints: 25,
      status: ContractStatus.ACTIVE,
      signedByIds: [alice.id, bob.id],
      signedAt: new Date(),
      completedAt: null,
    });
    await this.serviceModel
      .findByIdAndUpdate(
        service.id,
        {
          selectedApplicationId: accepted.id,
          contractId,
          status: ServiceStatus.SCHEDULED,
          scheduledAt: new Date(),
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  private async ensureExecutionDemos(alice: UserDocument, bob: UserDocument) {
    await this.ensureExecutionDemo(
      alice,
      bob,
      {
        title: 'Réglage final d une étagère',
        description:
          'Bob ajuste les fixations et vérifie la stabilité de l étagère.',
        type: ServiceType.REQUEST,
        category: 'Bricolage',
        availability: 'Mardi soir',
        isPaid: true,
        pricePoints: 10,
        status: ServiceStatus.IN_PROGRESS,
      },
      ServiceStatus.IN_PROGRESS,
      null,
    );
    await this.ensureExecutionDemo(
      alice,
      bob,
      {
        title: 'Installation d une imprimante',
        description:
          'Installation du pilote, connexion au réseau et page de test.',
        type: ServiceType.REQUEST,
        category: 'Informatique',
        availability: 'Jeudi après-midi',
        isPaid: true,
        pricePoints: 15,
        status: ServiceStatus.AWAITING_VALIDATION,
      },
      ServiceStatus.AWAITING_VALIDATION,
      'Imprimante installée et page de test imprimée avec succès.',
    );
  }

  private async ensureExecutionDemo(
    alice: UserDocument,
    bob: UserDocument,
    input: DemoServiceInput,
    status: ServiceStatus,
    proofMessage: string | null,
  ) {
    const service = await this.ensureService(alice.id, input);
    let contract = await this.contractModel
      .findOne({ serviceId: service.id })
      .exec();

    if (!contract) {
      const contractId = new Types.ObjectId().toString();
      await this.pointsService.reservePoints(
        alice.id,
        input.pricePoints ?? 0,
        contractId,
        service.id,
      );
      contract = await this.contractModel.create({
        _id: contractId,
        serviceId: service.id,
        applicationId: null,
        requesterId: alice.id,
        providerId: bob.id,
        payerId: alice.id,
        receiverId: bob.id,
        pricePoints: input.pricePoints ?? 0,
        status: ContractStatus.ACTIVE,
        signedByIds: [alice.id, bob.id],
        signedAt: new Date(),
        completedAt: null,
      });
    }

    const now = new Date();
    await this.serviceModel
      .updateOne(
        { _id: service.id },
        {
          $set: {
            contractId: contract.id,
            status,
            scheduledAt: service.scheduledAt ?? now,
            startedAt:
              status === ServiceStatus.IN_PROGRESS ||
              status === ServiceStatus.AWAITING_VALIDATION
                ? (service.startedAt ?? now)
                : null,
            markedDoneAt:
              status === ServiceStatus.AWAITING_VALIDATION
                ? (service.markedDoneAt ?? now)
                : null,
          },
        },
      )
      .exec();

    if (proofMessage) {
      const exists = await this.proofModel
        .findOne({ serviceId: service.id, message: proofMessage })
        .exec();
      if (!exists) {
        await this.proofModel.create({
          serviceId: service.id,
          authorId: bob.id,
          type: ServiceProofType.NOTE,
          message: proofMessage,
          fileReference: null,
        });
      }
    }
  }

  private async ensureApplication(
    service: ServiceDocument,
    applicantId: string,
    ownerId: string,
    status: ServiceApplicationStatus,
    message: string,
  ) {
    const existing = await this.applicationModel
      .findOne({ serviceId: service.id, applicantId })
      .exec();
    if (existing) return existing;

    const now = new Date();
    return this.applicationModel.create({
      serviceId: service.id,
      applicantId,
      ownerId,
      message,
      proposedDate: null,
      proposedPricePoints: service.pricePoints,
      status,
      acceptedAt: status === ServiceApplicationStatus.ACCEPTED ? now : null,
      rejectedAt: status === ServiceApplicationStatus.REJECTED ? now : null,
    });
  }

  private async ensureIncident(reportedById: string) {
    const title = 'Eclairage public en panne';
    const existing = await this.incidentModel
      .findOne({ title, reportedById, neighborhoodId: 'quartier-centre' })
      .exec();
    if (existing) return existing;
    return this.incidentModel.create({
      title,
      description:
        "Le lampadaire a l'angle de la rue reste eteint depuis deux soirs.",
      type: IncidentType.MAINTENANCE,
      status: IncidentStatus.REPORTED,
      severity: IncidentSeverity.MEDIUM,
      neighborhoodId: 'quartier-centre',
      reportedById,
      source: IncidentSource.WEB,
      externalId: null,
      lastSyncedAt: null,
    });
  }
}
