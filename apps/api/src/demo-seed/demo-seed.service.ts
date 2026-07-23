import { Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ServiceApplication,
  ServiceApplicationDocument,
  ServiceApplicationStatus,
} from '../applications/schemas/service-application.schema';
import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import {
  ProfileVisibility,
  User,
  UserDocument,
} from '../auth/schemas/user.schema';
import {
  SecurityAuditEvent,
  SecurityAuditEventDocument,
  SecurityEventResult,
  SecurityEventType,
} from '../auth/schemas/security-audit-event.schema';
import { UsersService } from '../auth/users.service';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';
import {
  DisputeEvidence,
  DisputeEvidenceDocument,
  DisputeEvidenceType,
} from '../disputes/schemas/dispute-evidence.schema';
import {
  Dispute,
  DisputeAuditEvent,
  DisputeAuditEventType,
  DisputeDocument,
  DisputeOutcome,
  DisputeReason,
  DisputeResolutionType,
  DisputeStatus,
} from '../disputes/schemas/dispute.schema';
import {
  EventResponse,
  EventResponseDocument,
  EventResponseStatus,
} from '../events/schemas/event-response.schema';
import {
  EventCategory,
  EventDocument,
  EventStatus,
  NeighborhoodEvent,
} from '../events/schemas/event.schema';
import { DocumentsService } from '../documents/documents.service';
import { ManagedDocumentStatus } from '../documents/schemas/managed-document.schema';
import {
  ManagedDocument,
  ManagedDocumentDocument,
} from '../documents/schemas/managed-document.schema';
import { PointsService } from '../points/points.service';
import {
  PointTransaction,
  PointTransactionDocument,
  PointTransactionType,
} from '../points/schemas/point-transaction.schema';
import {
  Neighborhood,
  NeighborhoodAuditType,
  NeighborhoodDocument,
} from '../neighborhoods/schemas/neighborhood.schema';
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
import {
  VoteAnswer,
  VoteAnswerDocument,
} from '../votes/schemas/vote-answer.schema';
import {
  Vote,
  VoteBallotType,
  VoteDocument,
  VotePrivacy,
  VoteResultsVisibility,
  VoteStatus,
} from '../votes/schemas/vote.schema';
import {
  Review,
  ReviewDocument,
  ReviewStatus,
} from '../reviews/schemas/review.schema';
import { GraphSyncService } from '../graph/graph-sync.service';
import { GraphEntityType } from '../graph/graph.types';
import {
  GraphSyncJob,
  GraphSyncJobDocument,
  GraphSyncJobStatus,
} from '../graph/schemas/graph-sync-job.schema';
import { StorageService } from '../storage/storage.service';
import {
  StorageContextType,
  StorageFile,
  StorageFileDocument,
  StorageLinkedEntityType,
} from '../storage/schemas/storage-file.schema';
import {
  DEMO_EVENT_CATALOG,
  DEMO_NEIGHBORHOODS,
  DEMO_SERVICE_CATALOG,
  DEMO_VOTE_CATALOG,
} from './demo-business.manifest';
import { DEMO_IDENTITIES, DEMO_SEED_SOURCE } from './demo-seed.manifest';
import {
  DemoSeedRecord,
  DemoSeedRecordDocument,
} from './schemas/demo-seed-record.schema';

type DemoExecutionReference = {
  serviceId: string;
  contractId: string;
  previousServiceStatus: ServiceStatus;
  reservedPoints: number;
};
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
    @InjectModel(Dispute.name)
    private readonly disputeModel: Model<DisputeDocument>,
    @InjectModel(DisputeEvidence.name)
    private readonly disputeEvidenceModel: Model<DisputeEvidenceDocument>,
    @InjectModel(ServiceProof.name)
    private readonly proofModel: Model<ServiceProofDocument>,
    @InjectModel(NeighborhoodEvent.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(EventResponse.name)
    private readonly eventResponseModel: Model<EventResponseDocument>,
    @InjectModel(Vote.name)
    private readonly voteModel: Model<VoteDocument>,
    @InjectModel(VoteAnswer.name)
    private readonly voteAnswerModel: Model<VoteAnswerDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
    @InjectModel(PointTransaction.name)
    private readonly pointTransactionModel: Model<PointTransactionDocument>,
    @InjectModel(ManagedDocument.name)
    private readonly documentModel: Model<ManagedDocumentDocument>,
    @InjectModel(StorageFile.name)
    private readonly storageFileModel: Model<StorageFileDocument>,
    @InjectModel(SecurityAuditEvent.name)
    private readonly securityAuditModel: Model<SecurityAuditEventDocument>,
    @InjectModel(GraphSyncJob.name)
    private readonly graphJobModel: Model<GraphSyncJobDocument>,
    @InjectModel(DemoSeedRecord.name)
    private readonly seedRecordModel: Model<DemoSeedRecordDocument>,
    private readonly usersService: UsersService,
    private readonly pointsService: PointsService,
    private readonly documentsService: DocumentsService,
    private readonly storageService: StorageService,
    @Optional() private readonly graphSyncService?: GraphSyncService,
  ) {}

  async onModuleInit() {
    if (
      process.env.DEV_AUTH_SEED !== 'true' ||
      process.env.NODE_ENV === 'test'
    ) {
      return;
    }

    await this.seedBusinessData();
  }

  async seedBusinessData() {
    const residentPassword =
      process.env.SEED_DEMO_RESIDENT_PASSWORD ?? 'local-development-only';
    const moderatorPassword =
      process.env.SEED_DEMO_MODERATOR_PASSWORD ?? residentPassword;
    const adminPassword =
      process.env.SEED_DEMO_ADMIN_PASSWORD ?? residentPassword;
    const [alice, bob, claire, moderator, admin] = await Promise.all([
      this.usersService.ensureDevUser({
        email: 'alice@connected-neighbours.local',
        displayName: 'Alice Martin',
        role: Role.RESIDENT,
        neighborhoodId: 'quartier-centre',
        password: residentPassword,
      }),
      this.usersService.ensureDevUser({
        email: 'bob@connected-neighbours.local',
        displayName: 'Bob Dupont',
        role: Role.RESIDENT,
        neighborhoodId: 'quartier-centre',
        password: residentPassword,
      }),
      this.usersService.ensureDevUser({
        email: 'claire@connected-neighbours.local',
        displayName: 'Claire Bernard',
        role: Role.RESIDENT,
        neighborhoodId: 'quartier-centre',
        password: residentPassword,
      }),
      this.usersService.ensureDevUser({
        email: 'moderator@connected-neighbours.local',
        displayName: 'Moderation Demo',
        role: Role.MODERATOR,
        neighborhoodId: 'quartier-centre',
        password: moderatorPassword,
      }),
      this.usersService.ensureDevUser({
        email: 'admin@connected-neighbours.local',
        displayName: 'Admin Demo',
        role: Role.ADMIN,
        neighborhoodId: 'quartier-centre',
        password: adminPassword,
      }),
    ]);

    await this.userModel
      .updateOne(
        { _id: bob.id, pointsBalance: 100, reservedPoints: 0 },
        { $set: { pointsBalance: 125 } },
      )
      .exec();

    await this.ensureNeighborhoods(admin.id);
    await this.ensureProfileDemos(alice, bob, claire);

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
    const furnitureContract = await this.contractModel
      .findOne({ serviceId: furniture.id })
      .exec();
    if (furnitureContract)
      await this.ensureDocumentState(
        furnitureContract.id,
        alice,
        bob,
        admin,
        'archived',
      );
    const disputeDemos = await this.ensureExecutionDemos(alice, bob);
    await this.ensureDocumentState(
      disputeDemos.open.contractId,
      alice,
      bob,
      admin,
      'prepared',
    );
    await this.ensureDocumentState(
      disputeDemos.review.contractId,
      alice,
      bob,
      admin,
      'sent',
    );
    await this.ensureDocumentState(
      disputeDemos.resolved.contractId,
      alice,
      bob,
      admin,
      'partial',
    );
    await this.ensureDisputeDemos(disputeDemos, alice, bob, moderator);
    await this.ensureReviewDemos(disputeDemos.resolved, alice, bob, claire);
    await this.ensureApplication(
      computerHelp,
      claire.id,
      bob.id,
      ServiceApplicationStatus.SUBMITTED,
      "Bonjour Bob, j'aurais besoin d'aide pour securiser mon ordinateur.",
    );
    await this.ensureLocalLife(alice, bob, claire, admin);
    const users = await this.userModel
      .find({
        email: { $in: DEMO_IDENTITIES.map((identity) => identity.email) },
      })
      .exec();
    const usersByEmail = new Map(users.map((user) => [user.email, user]));
    await this.ensureServiceCatalog(usersByEmail);
    await this.ensureAdditionalExecutionStates(usersByEmail, admin);
    await this.ensureLocalLifeCatalog(usersByEmail, admin);
    await this.ensureSecurityAuditDemos(usersByEmail);
    await this.reconcileDemoPointBalances(usersByEmail);
    await this.registerOwnedBusinessData();
  }

  async seedStorageFixtures() {
    const users = await this.userModel
      .find({
        email: { $in: DEMO_IDENTITIES.map((identity) => identity.email) },
      })
      .exec();
    const usersByEmail = new Map(users.map((user) => [user.email, user]));
    const alice = usersByEmail.get('alice@connected-neighbours.local');
    const bob = usersByEmail.get('bob@connected-neighbours.local');
    const admin = usersByEmail.get('admin@connected-neighbours.local');
    if (!alice || !bob || !admin) {
      throw new Error(
        'Les identités MongoDB doivent être créées avant les fixtures MinIO.',
      );
    }
    const contract = await this.contractModel.findOne().sort({ _id: 1 }).exec();
    if (contract) {
      await this.ensureDocumentState(
        contract.id,
        alice,
        bob,
        admin,
        'prepared',
      );
    }

    const avatarBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZcXcAAAAASUVORK5CYII=',
      'base64',
    );
    for (const identity of DEMO_IDENTITIES.filter(
      (item) => item.role === Role.RESIDENT && item.isActive,
    ).slice(0, 10)) {
      const user = usersByEmail.get(identity.email);
      if (!user) continue;
      const file = await this.storageService.putVerifiedSeedBuffer({
        seedKey: `avatar-${identity.seedKey}`,
        buffer: avatarBuffer,
        filename: `${identity.seedKey}.png`,
        mimeType: 'image/png',
        ownerId: user.id,
        contextType: StorageContextType.USER_AVATAR,
        contextId: user.id,
      });
      if (!file) continue;
      await this.userModel
        .updateOne({ _id: user.id }, { $set: { avatarFileId: file.id } })
        .exec();
      await this.markSeedRecord('storage-file', file.id);
    }

    const proofService = await this.serviceModel
      .findOne({ title: 'Installation d une imprimante' })
      .exec();
    if (proofService) {
      let proof = await this.proofModel
        .findOne({
          serviceId: proofService.id,
          message: 'Compte-rendu PDF de la page de test.',
        })
        .exec();
      if (!proof) {
        proof = await this.proofModel.create({
          serviceId: proofService.id,
          authorId: bob.id,
          type: ServiceProofType.DOCUMENT,
          message: 'Compte-rendu PDF de la page de test.',
          fileReference: null,
        });
      }
      const file = await this.storageService.putVerifiedSeedBuffer({
        seedKey: 'proof-printer-report',
        buffer: Buffer.from(
          '%PDF-1.4\n% Connected Neighbours demo proof\n%%EOF\n',
          'utf8',
        ),
        filename: 'preuve-imprimante.pdf',
        mimeType: 'application/pdf',
        ownerId: bob.id,
        contextType: StorageContextType.SERVICE_PROOF,
        contextId: proofService.id,
        linkedEntityType: StorageLinkedEntityType.SERVICE_PROOF,
        linkedEntityId: proof.id,
      });
      if (file) {
        await this.proofModel
          .updateOne({ _id: proof.id }, { $set: { fileReference: file.id } })
          .exec();
        await this.markSeedRecord('service-proof', proof.id);
        await this.markSeedRecord('storage-file', file.id);
      }
    }

    const dispute = await this.disputeModel
      .findOne()
      .sort({ openedAt: 1 })
      .exec();
    if (dispute) {
      let evidence = await this.disputeEvidenceModel
        .findOne({
          disputeId: dispute.id,
          message: 'Document récapitulatif ajouté pour la démonstration.',
        })
        .exec();
      if (!evidence) {
        evidence = await this.disputeEvidenceModel.create({
          disputeId: dispute.id,
          authorId: alice.id,
          type: DisputeEvidenceType.DOCUMENT,
          message: 'Document récapitulatif ajouté pour la démonstration.',
          fileReference: null,
        });
      }
      const file = await this.storageService.putVerifiedSeedBuffer({
        seedKey: 'dispute-summary-document',
        buffer: Buffer.from(
          '%PDF-1.4\n% Connected Neighbours demo dispute evidence\n%%EOF\n',
          'utf8',
        ),
        filename: 'recapitulatif-litige.pdf',
        mimeType: 'application/pdf',
        ownerId: alice.id,
        contextType: StorageContextType.DISPUTE_EVIDENCE,
        contextId: dispute.id,
        linkedEntityType: StorageLinkedEntityType.DISPUTE_EVIDENCE,
        linkedEntityId: evidence.id,
      });
      if (file) {
        await this.disputeEvidenceModel
          .updateOne({ _id: evidence.id }, { $set: { fileReference: file.id } })
          .exec();
        await this.markSeedRecord('dispute-evidence', evidence.id);
        await this.markSeedRecord('storage-file', file.id);
      }
    }
    await this.registerOwnedBusinessData();
  }

  async reconcileGraph() {
    await this.enqueueGraphSeed();
  }

  async status() {
    const [
      neighborhoods,
      users,
      services,
      applications,
      contracts,
      proofs,
      documents,
      storageFiles,
      disputes,
      disputeEvidence,
      events,
      eventResponses,
      votes,
      voteAnswers,
      reviews,
      pointTransactions,
      securityEvents,
      graphJobs,
    ] = await Promise.all([
      this.neighborhoodModel.countDocuments().exec(),
      this.userModel.countDocuments().exec(),
      this.serviceModel.countDocuments().exec(),
      this.applicationModel.countDocuments().exec(),
      this.contractModel.countDocuments().exec(),
      this.proofModel.countDocuments().exec(),
      this.documentModel.countDocuments().exec(),
      this.storageFileModel.countDocuments().exec(),
      this.disputeModel.countDocuments().exec(),
      this.disputeEvidenceModel.countDocuments().exec(),
      this.eventModel.countDocuments().exec(),
      this.eventResponseModel.countDocuments().exec(),
      this.voteModel.countDocuments().exec(),
      this.voteAnswerModel.countDocuments().exec(),
      this.reviewModel.countDocuments().exec(),
      this.pointTransactionModel.countDocuments().exec(),
      this.securityAuditModel.countDocuments().exec(),
      this.graphJobModel
        .aggregate<{
          _id: GraphSyncJobStatus;
          count: number;
        }>([{ $group: { _id: '$status', count: { $sum: 1 } } }])
        .exec(),
    ]);
    const graphJobsByStatus = Object.fromEntries(
      graphJobs.map((row) => [row._id, row.count]),
    );
    const graphEnabled = process.env.NEO4J_ENABLED === 'true';
    return {
      counts: {
        neighborhoods,
        users,
        services,
        applications,
        contracts,
        proofs,
        documents,
        storageFiles,
        disputes,
        disputeEvidence,
        events,
        eventResponses,
        votes,
        voteAnswers,
        reviews,
        pointTransactions,
        securityEvents,
      },
      storage: this.storageService.health(),
      graph: {
        enabled: graphEnabled,
        status: graphEnabled
          ? (graphJobsByStatus[GraphSyncJobStatus.FAILED] ?? 0) > 0
            ? ('degraded' as const)
            : ('available' as const)
          : ('disabled' as const),
        jobs: graphJobsByStatus,
      },
    };
  }

  async resetOwnedData(
    records: Array<{ entityType: string; entityId: string }>,
  ) {
    const idsFor = (entityType: string) =>
      records
        .filter((record) => record.entityType === entityType)
        .map((record) => record.entityId);
    for (const fileId of idsFor('storage-file')) {
      await this.storageService.removeSeedFile(fileId);
    }
    await Promise.all([
      this.disputeEvidenceModel
        .deleteMany({ _id: { $in: idsFor('dispute-evidence') } })
        .exec(),
      this.proofModel
        .deleteMany({ _id: { $in: idsFor('service-proof') } })
        .exec(),
      this.eventResponseModel
        .deleteMany({ _id: { $in: idsFor('event-response') } })
        .exec(),
      this.voteAnswerModel
        .deleteMany({ _id: { $in: idsFor('vote-answer') } })
        .exec(),
      this.reviewModel.deleteMany({ _id: { $in: idsFor('review') } }).exec(),
      this.documentModel
        .deleteMany({ _id: { $in: idsFor('document') } })
        .exec(),
      this.pointTransactionModel
        .deleteMany({ _id: { $in: idsFor('point-transaction') } })
        .exec(),
      this.applicationModel
        .deleteMany({ _id: { $in: idsFor('application') } })
        .exec(),
      this.disputeModel.deleteMany({ _id: { $in: idsFor('dispute') } }).exec(),
      this.contractModel
        .deleteMany({ _id: { $in: idsFor('contract') } })
        .exec(),
      this.eventModel.deleteMany({ _id: { $in: idsFor('event') } }).exec(),
      this.voteModel.deleteMany({ _id: { $in: idsFor('vote') } }).exec(),
      this.securityAuditModel
        .deleteMany({ _id: { $in: idsFor('security-audit') } })
        .exec(),
    ]);
    const serviceIds = idsFor('service');
    await this.graphJobModel
      .deleteMany({ entityId: { $in: serviceIds } })
      .exec();
    await this.serviceModel.deleteMany({ _id: { $in: serviceIds } }).exec();
    await this.neighborhoodModel
      .deleteMany({ _id: { $in: idsFor('neighborhood') } })
      .exec();
  }

  private async ensureNeighborhoods(adminId: string) {
    for (const neighborhood of DEMO_NEIGHBORHOODS) {
      await this.neighborhoodModel
        .findOneAndUpdate(
          { slug: neighborhood.slug },
          {
            $set: {
              name: neighborhood.name,
              description: neighborhood.description,
              city: neighborhood.city,
              postalCode: neighborhood.postalCode,
              postalCodes: neighborhood.postalCodes,
              boundary: null,
              geometry: neighborhood.geometry,
              center: neighborhood.center,
              status: neighborhood.status,
              isActive: true,
              archivedAt: null,
            },
            $setOnInsert: {
              slug: neighborhood.slug,
              createdById: adminId,
              history: [
                {
                  type: NeighborhoodAuditType.CREATED,
                  actorId: adminId,
                  occurredAt: new Date('2026-07-01T08:00:00.000Z'),
                  metadata: { seedSource: DEMO_SEED_SOURCE },
                },
              ],
            },
          },
          { upsert: true, returnDocument: 'after', runValidators: true },
        )
        .exec();
    }
  }

  private async ensureServiceCatalog(
    usersByEmail: ReadonlyMap<string, UserDocument>,
  ) {
    const servicesByTitle = new Map<string, ServiceDocument>();
    for (const input of DEMO_SERVICE_CATALOG) {
      const owner = usersByEmail.get(input.ownerEmail);
      if (!owner || !owner.isActive) continue;
      const service = await this.ensureService(owner.id, input);
      servicesByTitle.set(service.title, service);
    }
    const applications = [
      {
        title: 'Partenaire pour courir le dimanche',
        applicantEmail: 'emma@connected-neighbours.local',
        message: 'Je suis disponible dimanche et je cours à allure modérée.',
      },
      {
        title: 'Cherche covoiturage vers la bibliothèque',
        applicantEmail: 'lucas@connected-neighbours.local',
        message: 'Je peux aider avec une voiture adaptée aux cartons.',
      },
      {
        title: 'Garde de chien en soirée',
        applicantEmail: 'lina.keycloak@connected-neighbours.local',
        message:
          'Je connais bien les chiens et je serai présente dans le quartier.',
      },
      {
        title: 'Fixer une tringle à rideaux',
        applicantEmail: 'marc.legacy@connected-neighbours.local',
        message: 'Je dispose des outils et des chevilles nécessaires.',
      },
      {
        title: 'Réparer une poignée de porte',
        applicantEmail: 'bob@connected-neighbours.local',
        message: 'Je peux intervenir jeudi soir avec les pièces courantes.',
      },
      {
        title: 'Révisions de français au collège',
        applicantEmail: 'lina.keycloak@connected-neighbours.local',
        message:
          'Je peux aider à préparer les exercices et relire les réponses.',
      },
    ];
    for (const application of applications) {
      const service = servicesByTitle.get(application.title);
      const applicant = usersByEmail.get(application.applicantEmail);
      if (!service || !applicant) continue;
      await this.ensureApplication(
        service,
        applicant.id,
        service.ownerId,
        ServiceApplicationStatus.SUBMITTED,
        application.message,
      );
      await this.serviceModel
        .updateOne(
          { _id: service.id, status: ServiceStatus.PUBLISHED },
          { $set: { status: ServiceStatus.APPLICATION_RECEIVED } },
        )
        .exec();
    }
  }

  private async ensureLocalLifeCatalog(
    usersByEmail: ReadonlyMap<string, UserDocument>,
    admin: UserDocument,
  ) {
    for (const input of DEMO_EVENT_CATALOG) {
      const organizer = usersByEmail.get(input.organizerEmail);
      if (!organizer || !organizer.isActive) continue;
      await this.ensureEvent(organizer.id, input);
    }
    for (const input of DEMO_VOTE_CATALOG) {
      const vote = await this.ensureVote(admin.id, input);
      const voter = [...usersByEmail.values()].find(
        (user) =>
          user.isActive &&
          user.role === Role.RESIDENT &&
          user.neighborhoodId === input.neighborhoodSlug,
      );
      if (voter && vote.status !== VoteStatus.SCHEDULED) {
        await this.ensureVoteAnswer(vote, voter.id, [vote.options[0].id]);
      }
    }
  }

  private async ensureAdditionalExecutionStates(
    usersByEmail: ReadonlyMap<string, UserDocument>,
    admin: UserDocument,
  ) {
    const fixtures = [
      {
        requesterEmail: 'nadia@connected-neighbours.local',
        providerEmail: 'emma@connected-neighbours.local',
        input: {
          title: 'Classer des documents administratifs',
          description: 'Emma aide Nadia à organiser ses documents importants.',
          type: ServiceType.REQUEST,
          category: 'Administration',
          availability: 'Mercredi soir',
          isPaid: true,
          pricePoints: 10,
          status: ServiceStatus.IN_PROGRESS,
        },
        status: ServiceStatus.IN_PROGRESS,
        proofMessage: null,
      },
      {
        requesterEmail: 'hugo@connected-neighbours.local',
        providerEmail: 'lucas@connected-neighbours.local',
        input: {
          title: 'Accorder une guitare avant un concert',
          description:
            'Lucas a réglé l’instrument et vérifié sa tenue d’accord.',
          type: ServiceType.REQUEST,
          category: 'Musique',
          availability: 'Terminé ce matin',
          isPaid: true,
          pricePoints: 12,
          status: ServiceStatus.AWAITING_VALIDATION,
        },
        status: ServiceStatus.AWAITING_VALIDATION,
        proofMessage: 'Accordage terminé et vérifié sur plusieurs accords.',
      },
      {
        requesterEmail: 'sarah@connected-neighbours.local',
        providerEmail: 'lina.keycloak@connected-neighbours.local',
        input: {
          title: 'Préparer des fiches de révision',
          description:
            'Création de fiches synthétiques pour une évaluation scolaire.',
          type: ServiceType.REQUEST,
          category: 'Cours',
          availability: 'Correction demandée',
          isPaid: true,
          pricePoints: 8,
          status: ServiceStatus.CORRECTION_REQUESTED,
        },
        status: ServiceStatus.CORRECTION_REQUESTED,
        proofMessage: 'Première version des fiches déposée pour relecture.',
      },
    ] as const;
    for (const fixture of fixtures) {
      const requester = usersByEmail.get(fixture.requesterEmail);
      const provider = usersByEmail.get(fixture.providerEmail);
      if (!requester || !provider) continue;
      const reference = await this.ensureExecutionDemo(
        requester,
        provider,
        fixture.input,
        fixture.status,
        fixture.proofMessage,
      );
      await this.ensureDocumentState(
        reference.contractId,
        requester,
        provider,
        admin,
        'archived',
      );
    }
  }

  private async reconcileDemoPointBalances(
    usersByEmail: ReadonlyMap<string, UserDocument>,
  ) {
    const balances = new Map<string, { available: number; reserved: number }>();
    for (const identity of DEMO_IDENTITIES) {
      const user = usersByEmail.get(identity.email);
      if (!user) continue;
      balances.set(user.id, {
        available: identity.pointsBalance,
        reserved: 0,
      });
    }
    const userIds = [...balances.keys()];
    const transactions = await this.pointTransactionModel
      .find({
        $or: [{ fromUserId: { $in: userIds } }, { toUserId: { $in: userIds } }],
      })
      .sort({ createdAt: 1, _id: 1 })
      .lean<
        Array<{
          type: PointTransactionType;
          amount: number;
          fromUserId: string;
          toUserId: string | null;
        }>
      >()
      .exec();
    for (const transaction of transactions) {
      const from = balances.get(transaction.fromUserId);
      const to = transaction.toUserId
        ? balances.get(transaction.toUserId)
        : undefined;
      if (transaction.type === PointTransactionType.RESERVATION && from) {
        from.available -= transaction.amount;
        from.reserved += transaction.amount;
      }
      if (transaction.type === PointTransactionType.RELEASE && from) {
        from.available += transaction.amount;
        from.reserved -= transaction.amount;
      }
      if (transaction.type === PointTransactionType.TRANSFER) {
        if (from) from.reserved -= transaction.amount;
        if (to) to.available += transaction.amount;
      }
    }
    for (const [userId, balance] of balances) {
      if (balance.available < 0 || balance.reserved < 0) {
        throw new Error(
          `Le registre de points du seed est incohérent pour ${userId}.`,
        );
      }
    }
    if (balances.size === 0) return;
    await this.userModel.bulkWrite(
      [...balances.entries()].map(([userId, balance]) => ({
        updateOne: {
          filter: { _id: userId },
          update: {
            $set: {
              pointsBalance: balance.available,
              reservedPoints: balance.reserved,
            },
          },
        },
      })),
      { ordered: false },
    );
  }

  private async ensureSecurityAuditDemos(
    usersByEmail: ReadonlyMap<string, UserDocument>,
  ) {
    const fixtures = [
      {
        seedKey: 'audit-alice-local-success',
        email: 'alice@connected-neighbours.local',
        provider: 'local',
        eventType: SecurityEventType.LOGIN_LOCAL_SUCCESS,
        result: SecurityEventResult.SUCCESS,
      },
      {
        seedKey: 'audit-bob-keycloak-success',
        email: 'bob@connected-neighbours.local',
        provider: 'keycloak',
        eventType: SecurityEventType.LOGIN_KEYCLOAK_SUCCESS,
        result: SecurityEventResult.SUCCESS,
      },
      {
        seedKey: 'audit-sophie-link-requested',
        email: 'sophie.link@connected-neighbours.local',
        provider: 'keycloak',
        eventType: SecurityEventType.IDENTITY_LINK_REQUESTED,
        result: SecurityEventResult.SUCCESS,
      },
      {
        seedKey: 'audit-thomas-disabled',
        email: 'thomas.disabled@connected-neighbours.local',
        provider: 'system',
        eventType: SecurityEventType.ACCOUNT_DISABLED_REJECTION,
        result: SecurityEventResult.DENIED,
      },
    ] as const;
    for (const fixture of fixtures) {
      const user = usersByEmail.get(fixture.email);
      if (!user) continue;
      await this.securityAuditModel
        .findOneAndUpdate(
          {
            userId: user.id,
            eventType: fixture.eventType,
            'context.seedKey': fixture.seedKey,
          },
          {
            $set: {
              provider: fixture.provider,
              result: fixture.result,
              occurredAt: new Date('2026-07-22T08:00:00.000Z'),
              context: {
                seedSource: DEMO_SEED_SOURCE,
                seedKey: fixture.seedKey,
              },
            },
            $setOnInsert: { userId: user.id, eventType: fixture.eventType },
          },
          { upsert: true, returnDocument: 'after', runValidators: true },
        )
        .exec();
    }
  }

  private async registerOwnedBusinessData() {
    const demoUsers = await this.userModel
      .find({
        email: { $in: DEMO_IDENTITIES.map((identity) => identity.email) },
      })
      .select('_id')
      .lean<Array<{ _id: unknown }>>()
      .exec();
    const userIds = demoUsers.map((user) => String(user._id));
    const services = await this.serviceModel
      .find({ ownerId: { $in: userIds } })
      .select('_id')
      .lean<Array<{ _id: unknown }>>()
      .exec();
    const serviceIds = services.map((service) => String(service._id));
    const [
      neighborhoods,
      applications,
      contracts,
      proofs,
      disputes,
      events,
      votes,
      reviews,
      pointTransactions,
      securityEvents,
    ] = await Promise.all([
      this.neighborhoodModel
        .find({ slug: { $in: DEMO_NEIGHBORHOODS.map((item) => item.slug) } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.applicationModel
        .find({ serviceId: { $in: serviceIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.contractModel
        .find({ serviceId: { $in: serviceIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.proofModel
        .find({ serviceId: { $in: serviceIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.disputeModel
        .find({ serviceId: { $in: serviceIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.eventModel
        .find({ organizerId: { $in: userIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.voteModel
        .find({ createdById: { $in: userIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.reviewModel
        .find({ authorId: { $in: userIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.pointTransactionModel
        .find({ serviceId: { $in: serviceIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.securityAuditModel
        .find({ 'context.seedSource': DEMO_SEED_SOURCE })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
    ]);
    const contractIds = contracts.map((item) => String(item._id));
    const disputeIds = disputes.map((item) => String(item._id));
    const eventIds = events.map((item) => String(item._id));
    const voteIds = votes.map((item) => String(item._id));
    const [
      documents,
      disputeEvidence,
      eventResponses,
      voteAnswers,
      storageFiles,
    ] = await Promise.all([
      this.documentModel
        .find({ contractId: { $in: contractIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.disputeEvidenceModel
        .find({ disputeId: { $in: disputeIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.eventResponseModel
        .find({ eventId: { $in: eventIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.voteAnswerModel
        .find({ voteId: { $in: voteIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.storageFileModel
        .find({ ownerId: { $in: userIds } })
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
    ]);

    const entries: Array<readonly [string, unknown]> = [
      ...neighborhoods.map((item) => ['neighborhood', item._id] as const),
      ...services.map((item) => ['service', item._id] as const),
      ...applications.map((item) => ['application', item._id] as const),
      ...contracts.map((item) => ['contract', item._id] as const),
      ...proofs.map((item) => ['service-proof', item._id] as const),
      ...disputes.map((item) => ['dispute', item._id] as const),
      ...disputeEvidence.map((item) => ['dispute-evidence', item._id] as const),
      ...events.map((item) => ['event', item._id] as const),
      ...eventResponses.map((item) => ['event-response', item._id] as const),
      ...votes.map((item) => ['vote', item._id] as const),
      ...voteAnswers.map((item) => ['vote-answer', item._id] as const),
      ...reviews.map((item) => ['review', item._id] as const),
      ...documents.map((item) => ['document', item._id] as const),
      ...storageFiles.map((item) => ['storage-file', item._id] as const),
      ...pointTransactions.map(
        (item) => ['point-transaction', item._id] as const,
      ),
      ...securityEvents.map((item) => ['security-audit', item._id] as const),
    ];
    if (entries.length === 0) return;
    await this.seedRecordModel.bulkWrite(
      entries.map(([entityType, entityId]) => ({
        updateOne: {
          filter: {
            seedSource: DEMO_SEED_SOURCE,
            entityType,
            entityId: String(entityId),
          },
          update: {
            $set: {
              seedKey: `${entityType}:${String(entityId)}`,
              entityType,
              entityId: String(entityId),
              metadata: {},
            },
            $setOnInsert: {
              seedSource: DEMO_SEED_SOURCE,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  private markSeedRecord(entityType: string, entityId: string) {
    const seedKey = `${entityType}:${entityId}`;
    return this.seedRecordModel
      .findOneAndUpdate(
        {
          seedSource: DEMO_SEED_SOURCE,
          $or: [{ seedKey }, { entityType, entityId }],
        },
        {
          $set: { seedKey, entityType, entityId, metadata: {} },
          $setOnInsert: { seedSource: DEMO_SEED_SOURCE },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
  }

  private async enqueueGraphSeed() {
    if (!this.graphSyncService) return;
    const [users, services, events, reviews] = await Promise.all([
      this.userModel
        .find()
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.serviceModel
        .find()
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.eventModel
        .find()
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
      this.reviewModel
        .find()
        .select('_id')
        .lean<Array<{ _id: unknown }>>()
        .exec(),
    ]);
    const groups: Array<[GraphEntityType, Array<{ _id: unknown }>]> = [
      [GraphEntityType.USER, users],
      [GraphEntityType.SERVICE, services],
      [GraphEntityType.EVENT, events],
      [GraphEntityType.REVIEW, reviews],
    ];
    for (const [entityType, rows] of groups) {
      for (const row of rows) {
        await this.graphSyncService.enqueue(entityType, String(row._id));
      }
    }
  }

  private async ensureLocalLife(
    alice: UserDocument,
    bob: UserDocument,
    claire: UserDocument,
    admin: UserDocument,
  ) {
    const workshop = await this.ensureEvent(alice.id, {
      title: 'Atelier réparation vélo',
      description:
        'Apportez votre vélo et apprenez les réparations essentielles avec les voisins.',
      category: EventCategory.WORKSHOP,
      startsAt: new Date('2026-09-20T12:00:00.000Z'),
      endsAt: new Date('2026-09-20T16:00:00.000Z'),
      locationLabel: 'Maison de quartier',
      capacity: 20,
      status: EventStatus.OPEN_REGISTRATION,
    });
    await this.ensureEventResponse(
      workshop.id,
      bob.id,
      EventResponseStatus.INTERESTED,
    );

    const sport = await this.ensureEvent(alice.id, {
      title: 'Tournoi de pétanque du quartier',
      description: 'Une rencontre amicale ouverte à tous les niveaux.',
      category: EventCategory.SPORT,
      startsAt: new Date('2026-09-25T12:00:00.000Z'),
      endsAt: new Date('2026-09-25T17:00:00.000Z'),
      locationLabel: 'Terrain municipal du quartier',
      capacity: 1,
      status: EventStatus.FULL,
    });
    await this.ensureEventResponse(sport.id, bob.id, EventResponseStatus.GOING);
    await this.ensureEventResponse(
      sport.id,
      claire.id,
      EventResponseStatus.WAITLISTED,
      1,
    );
    await this.eventModel
      .updateOne(
        {
          _id: sport.id,
          $or: [
            { countersInitialized: false },
            { countersInitialized: { $exists: false } },
          ],
        },
        {
          $set: {
            participantCount: 1,
            waitlistCount: 1,
            waitlistSequence: 1,
            countersInitialized: true,
          },
        },
      )
      .exec();

    const cleanup = await this.ensureEvent(bob.id, {
      title: 'Nettoyage du parc samedi',
      description:
        'Deux heures ensemble pour prendre soin des espaces verts du quartier.',
      category: EventCategory.HELP,
      startsAt: new Date('2026-09-28T08:00:00.000Z'),
      endsAt: new Date('2026-09-28T10:30:00.000Z'),
      locationLabel: 'Entrée principale du parc',
      capacity: 30,
      status: EventStatus.OPEN_REGISTRATION,
    });
    await this.ensureEventResponse(
      cleanup.id,
      alice.id,
      EventResponseStatus.GOING,
    );

    await this.ensureEvent(alice.id, {
      title: 'Rencontre des voisins de juillet',
      description: 'Retour sur les initiatives locales et moment convivial.',
      category: EventCategory.COMMUNITY_MEETING,
      startsAt: new Date('2026-07-05T16:00:00.000Z'),
      endsAt: new Date('2026-07-05T18:00:00.000Z'),
      locationLabel: 'Salle associative',
      capacity: null,
      status: EventStatus.COMPLETED,
    });
    await this.ensureEvent(admin.id, {
      title: 'Collecte solidaire reportée',
      description: 'La collecte sera reprogrammée à une date ultérieure.',
      category: EventCategory.FUNDRAISING,
      startsAt: new Date('2026-09-05T09:00:00.000Z'),
      endsAt: new Date('2026-09-05T12:00:00.000Z'),
      locationLabel: 'Maison de quartier',
      capacity: 50,
      status: EventStatus.CANCELLED,
    });

    const compost = await this.ensureVote(admin.id, {
      title: 'Installer un composteur partagé ?',
      ballotType: VoteBallotType.YES_NO,
      privacy: VotePrivacy.PUBLIC,
      resultsVisibility: VoteResultsVisibility.AFTER_SUBMISSION,
      status: VoteStatus.OPEN,
      opensAt: new Date('2026-07-01T08:00:00.000Z'),
      closesAt: new Date('2026-08-31T18:00:00.000Z'),
      options: ['Oui', 'Non'],
      allowAnswerChange: true,
    });
    await this.ensureVoteAnswer(compost, alice.id, [compost.options[0].id]);
    await this.ensureVoteAnswer(compost, bob.id, [compost.options[0].id]);

    const square = await this.ensureVote(admin.id, {
      title: 'Quel aménagement prioritaire pour la place ?',
      ballotType: VoteBallotType.SINGLE_CHOICE,
      privacy: VotePrivacy.PUBLIC,
      resultsVisibility: VoteResultsVisibility.ALWAYS,
      status: VoteStatus.OPEN,
      opensAt: new Date('2026-07-15T08:00:00.000Z'),
      closesAt: new Date('2026-09-10T18:00:00.000Z'),
      options: ['Bancs ombragés', 'Arceaux vélo', 'Jeux pour enfants'],
      allowAnswerChange: false,
    });
    await this.ensureVoteAnswer(square, claire.id, [square.options[1].id]);

    await this.ensureVote(admin.id, {
      title: 'Animations souhaitées pour l’automne',
      ballotType: VoteBallotType.MULTIPLE_CHOICE,
      privacy: VotePrivacy.PUBLIC,
      resultsVisibility: VoteResultsVisibility.AFTER_CLOSE,
      status: VoteStatus.SCHEDULED,
      opensAt: new Date('2026-09-01T08:00:00.000Z'),
      closesAt: new Date('2026-09-20T18:00:00.000Z'),
      options: [
        'Atelier cuisine',
        'Projection en plein air',
        'Bourse aux livres',
      ],
      allowAnswerChange: true,
      minSelections: 1,
      maxSelections: 2,
    });

    const ranking = await this.ensureVote(admin.id, {
      title: 'Priorités du budget participatif',
      ballotType: VoteBallotType.RANKING,
      privacy: VotePrivacy.PUBLIC,
      resultsVisibility: VoteResultsVisibility.AFTER_CLOSE,
      status: VoteStatus.CLOSED,
      opensAt: new Date('2026-06-01T08:00:00.000Z'),
      closesAt: new Date('2026-06-30T18:00:00.000Z'),
      options: ['Végétalisation', 'Éclairage', 'Mobilier urbain'],
      allowAnswerChange: false,
    });
    await this.ensureVoteAnswer(
      ranking,
      alice.id,
      ranking.options.map((option) => option.id),
      ranking.options.map((option, index) => ({
        optionId: option.id,
        rank: index + 1,
      })),
    );

    const anonymous = await this.ensureVote(admin.id, {
      title: 'Adapter les horaires de la maison de quartier ?',
      ballotType: VoteBallotType.YES_NO,
      privacy: VotePrivacy.ANONYMOUS,
      resultsVisibility: VoteResultsVisibility.AFTER_CLOSE,
      status: VoteStatus.OPEN,
      opensAt: new Date('2026-07-10T08:00:00.000Z'),
      closesAt: new Date('2026-09-15T18:00:00.000Z'),
      options: ['Oui', 'Non'],
      allowAnswerChange: false,
    });
    await this.ensureVoteAnswer(anonymous, bob.id, [anonymous.options[0].id]);
  }

  private async ensureEvent(
    organizerId: string,
    input: {
      neighborhoodSlug?: string;
      title: string;
      description: string;
      category: EventCategory;
      startsAt: Date;
      endsAt: Date;
      locationLabel: string;
      capacity: number | null;
      status: EventStatus;
    },
  ) {
    const neighborhoodId = input.neighborhoodSlug ?? 'quartier-centre';
    const existing = await this.eventModel
      .findOne({ title: input.title, neighborhoodId })
      .exec();
    if (existing) return existing;
    const published = input.status !== EventStatus.DRAFT;
    return this.eventModel.create({
      title: input.title,
      description: input.description,
      category: input.category,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      locationLabel: input.locationLabel,
      capacity: input.capacity,
      status: input.status,
      neighborhoodId,
      organizerId,
      registrationDeadline: new Date(input.startsAt.getTime() - 60 * 60 * 1000),
      participantCount: 0,
      waitlistCount: 0,
      waitlistSequence: 0,
      countersInitialized: false,
      publishedAt: published ? new Date('2026-07-01T08:00:00.000Z') : null,
      completedAt: input.status === EventStatus.COMPLETED ? input.endsAt : null,
      cancelledAt:
        input.status === EventStatus.CANCELLED
          ? new Date('2026-07-20T10:00:00.000Z')
          : null,
      cancellationReason:
        input.status === EventStatus.CANCELLED
          ? 'Conditions logistiques insuffisantes.'
          : null,
      history: [],
    });
  }

  private async ensureEventResponse(
    eventId: string,
    userId: string,
    response: EventResponseStatus,
    waitlistPosition: number | null = null,
  ) {
    const existing = await this.eventResponseModel
      .findOne({ eventId, userId })
      .exec();
    if (existing) return existing;
    return this.eventResponseModel.create({
      eventId,
      userId,
      response,
      waitlistPosition,
      respondedAt: new Date('2026-07-22T10:00:00.000Z'),
      revision: 1,
    });
  }

  private async ensureVote(
    createdById: string,
    input: {
      neighborhoodSlug?: string;
      title: string;
      ballotType: VoteBallotType;
      privacy: VotePrivacy;
      resultsVisibility: VoteResultsVisibility;
      status: VoteStatus;
      opensAt: Date;
      closesAt: Date;
      options: string[];
      allowAnswerChange: boolean;
      minSelections?: number;
      maxSelections?: number;
    },
  ) {
    const neighborhoodId = input.neighborhoodSlug ?? 'quartier-centre';
    const existing = await this.voteModel
      .findOne({ title: input.title, neighborhoodId })
      .exec();
    if (existing) return existing;
    const key = input.title
      .toLocaleLowerCase('fr')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return this.voteModel.create({
      title: input.title,
      ballotType: input.ballotType,
      privacy: input.privacy,
      resultsVisibility: input.resultsVisibility,
      status: input.status,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      allowAnswerChange: input.allowAnswerChange,
      description: `Consultation des habitants de ${neighborhoodId}.`,
      neighborhoodId,
      createdById,
      options: input.options.map((label, index) => ({
        id: `${key}-${index + 1}`,
        label,
        description: null,
        order: index,
      })),
      minSelections: input.minSelections ?? null,
      maxSelections: input.maxSelections ?? null,
      publishedAt:
        input.status === VoteStatus.DRAFT
          ? null
          : new Date('2026-07-01T08:00:00.000Z'),
      closedAt: input.status === VoteStatus.CLOSED ? input.closesAt : null,
      history: [],
    });
  }

  private async ensureVoteAnswer(
    vote: VoteDocument,
    userId: string,
    selectedOptionIds: string[],
    ranking: Array<{ optionId: string; rank: number }> = [],
  ) {
    const existing = await this.voteAnswerModel
      .findOne({ voteId: vote.id, userId })
      .exec();
    if (existing) return existing;
    return this.voteAnswerModel.create({
      voteId: vote.id,
      userId,
      selectedOptionIds,
      ranking,
      submittedAt: new Date('2026-07-22T10:30:00.000Z'),
      revision: 1,
    });
  }

  private async ensureDocumentState(
    contractId: string,
    alice: UserDocument,
    bob: UserDocument,
    admin: UserDocument,
    target: 'prepared' | 'sent' | 'partial' | 'archived',
  ) {
    const aliceActor = this.seedActor(alice, Role.RESIDENT);
    const bobActor = this.seedActor(bob, Role.RESIDENT);
    const adminActor = this.seedActor(admin, Role.ADMIN);
    let document = await this.documentsService.findForContract(
      contractId,
      aliceActor,
    );
    if (!document)
      document = await this.documentsService.generateContractDocument(
        contractId,
        aliceActor,
      );
    if (target === 'prepared') return;
    if (document.status === ManagedDocumentStatus.PREPARED) {
      document = await this.documentsService.sendForSignature(
        document.id,
        aliceActor,
      );
    }
    if (target === 'sent') return;
    if (document.status === ManagedDocumentStatus.SENT_FOR_SIGNATURE) {
      await this.documentsService.legacySignContract(contractId, aliceActor, {
        consent: true,
        signatureText: alice.displayName,
      });
      document = await this.documentsService.findForContract(
        contractId,
        aliceActor,
      );
    }
    if (!document || target === 'partial') return;
    if (document.status === ManagedDocumentStatus.PARTIALLY_SIGNED) {
      await this.documentsService.legacySignContract(contractId, bobActor, {
        consent: true,
        signatureText: bob.displayName,
      });
      document = await this.documentsService.findForContract(
        contractId,
        aliceActor,
      );
    }
    if (document?.status === ManagedDocumentStatus.FINALIZED) {
      await this.documentsService.archive(document.id, adminActor);
    }
  }

  private async ensureProfileDemos(
    alice: UserDocument,
    bob: UserDocument,
    claire: UserDocument,
  ) {
    await Promise.all([
      this.userModel
        .updateOne(
          { _id: alice.id },
          {
            $set: {
              bio: 'Habitante du Quartier Centre, passionnée de bricolage et de vie locale.',
              interests: ['Bricolage', 'Jardinage', 'Vie locale'],
              profileVisibility: ProfileVisibility.NEIGHBORHOOD,
              showNeighborhood: true,
              showReviews: true,
              showCompletedServices: true,
              showReputation: true,
            },
          },
        )
        .exec(),
      this.userModel
        .updateOne(
          { _id: bob.id },
          {
            $set: {
              bio: 'Voisin disponible pour le bricolage et l’aide informatique.',
              interests: ['Bricolage', 'Informatique', 'Animaux'],
              profileVisibility: ProfileVisibility.NEIGHBORHOOD,
              showNeighborhood: true,
              showReviews: true,
              showCompletedServices: true,
              showReputation: true,
            },
          },
        )
        .exec(),
      this.userModel
        .updateOne(
          { _id: claire.id },
          {
            $set: {
              bio: 'Profil privé.',
              interests: ['Cours'],
              profileVisibility: ProfileVisibility.PRIVATE,
              showNeighborhood: false,
              showReviews: false,
              showCompletedServices: false,
              showReputation: false,
            },
          },
        )
        .exec(),
    ]);
  }

  private async ensureReviewDemos(
    resolved: DemoExecutionReference,
    alice: UserDocument,
    bob: UserDocument,
    claire: UserDocument,
  ) {
    await this.ensureReview({
      contractId: resolved.contractId,
      serviceId: resolved.serviceId,
      authorId: alice.id,
      targetUserId: bob.id,
      rating: 5,
      comment:
        'Bob a été ponctuel, soigneux et très clair dans ses explications.',
      response: {
        authorId: bob.id,
        message: 'Merci Alice, ce fut un plaisir de vous aider.',
        respondedAt: new Date('2026-07-21T18:00:00.000Z'),
      },
      status: ReviewStatus.PUBLISHED,
    });
    await this.ensureReview({
      contractId: resolved.contractId,
      serviceId: resolved.serviceId,
      authorId: bob.id,
      targetUserId: alice.id,
      rating: 4,
      comment: 'Organisation simple et accueil chaleureux.',
      response: null,
      status: ReviewStatus.HIDDEN,
      moderationReason: 'Avis masqué pour la démonstration de modération.',
    });

    const service = await this.ensureService(claire.id, {
      title: 'Initiation aux outils numériques',
      description:
        'Accompagnement terminé pour découvrir les démarches en ligne.',
      type: ServiceType.REQUEST,
      category: 'Informatique',
      availability: 'Terminé',
      isPaid: false,
      pricePoints: null,
      status: ServiceStatus.COMPLETED,
    });
    let contract = await this.contractModel
      .findOne({ serviceId: service.id })
      .exec();
    if (!contract) {
      contract = await this.contractModel.create({
        serviceId: service.id,
        applicationId: null,
        requesterId: claire.id,
        providerId: bob.id,
        payerId: claire.id,
        receiverId: bob.id,
        pricePoints: 0,
        status: ContractStatus.COMPLETED,
        signedByIds: [claire.id, bob.id],
        signedAt: new Date('2026-07-18T09:00:00.000Z'),
        completedAt: new Date('2026-07-18T11:00:00.000Z'),
      });
      await this.serviceModel
        .updateOne(
          { _id: service.id },
          {
            $set: {
              contractId: contract.id,
              completedAt: new Date('2026-07-18T11:00:00.000Z'),
              validatedAt: new Date('2026-07-18T11:00:00.000Z'),
            },
          },
        )
        .exec();
    }
    await this.ensureReview({
      contractId: contract.id,
      serviceId: service.id,
      authorId: claire.id,
      targetUserId: bob.id,
      rating: 4,
      comment: 'Une aide patiente et adaptée à mon niveau.',
      response: null,
      status: ReviewStatus.PUBLISHED,
    });
  }

  private async ensureReview(input: {
    contractId: string;
    serviceId: string;
    authorId: string;
    targetUserId: string;
    rating: number;
    comment: string;
    response: {
      authorId: string;
      message: string;
      respondedAt: Date;
    } | null;
    status: ReviewStatus;
    moderationReason?: string;
  }) {
    const existing = await this.reviewModel
      .findOne({ contractId: input.contractId, authorId: input.authorId })
      .exec();
    if (existing) return existing;
    const moderatedAt =
      input.status === ReviewStatus.HIDDEN
        ? new Date('2026-07-22T09:00:00.000Z')
        : null;
    const moderationHistory =
      input.status === ReviewStatus.HIDDEN
        ? [
            {
              action: 'hidden' as const,
              moderatorId: 'seed-moderator',
              reason:
                input.moderationReason ??
                'Avis masqué pour la démonstration de modération.',
              createdAt: moderatedAt as Date,
            },
          ]
        : [];
    return this.reviewModel.create({
      ...input,
      moderationHistory,
      moderatedById:
        input.status === ReviewStatus.HIDDEN ? 'seed-moderator' : null,
      moderatedAt,
      moderationReason: input.moderationReason ?? null,
    });
  }

  private seedActor(user: UserDocument, role: Role): AuthenticatedUser {
    return {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      neighborhoodId: user.neighborhoodId,
      role,
    };
  }
  private async ensureService(ownerId: string, input: DemoServiceInput) {
    const existing = await this.serviceModel
      .findOne({ ownerId, title: input.title })
      .exec();
    if (existing) return existing;
    const owner = await this.userModel
      .findById(ownerId)
      .select('neighborhoodId')
      .lean<{ neighborhoodId: string } | null>()
      .exec();
    return this.serviceModel.create({
      title: input.title,
      description: input.description,
      type: input.type,
      category: input.category,
      availability: input.availability,
      isPaid: input.isPaid,
      pricePoints: input.pricePoints,
      status: input.status,
      ownerId,
      neighborhoodId: owner?.neighborhoodId ?? 'quartier-centre',
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
    const open = await this.ensureExecutionDemo(
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
    const review = await this.ensureExecutionDemo(
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
    const resolved = await this.ensureExecutionDemo(
      alice,
      bob,
      {
        title: 'Réparation contestée puis validée',
        description:
          'Une petite réparation dont les preuves permettent une décision de modération.',
        type: ServiceType.REQUEST,
        category: 'Bricolage',
        availability: 'Vendredi matin',
        isPaid: true,
        pricePoints: 5,
        status: ServiceStatus.AWAITING_VALIDATION,
      },
      ServiceStatus.AWAITING_VALIDATION,
      'Réparation terminée et fonctionnement vérifié.',
    );

    return { open, review, resolved };
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
              status === ServiceStatus.AWAITING_VALIDATION ||
              status === ServiceStatus.CORRECTION_REQUESTED
                ? (service.startedAt ?? now)
                : null,
            markedDoneAt:
              status === ServiceStatus.AWAITING_VALIDATION ||
              status === ServiceStatus.CORRECTION_REQUESTED
                ? (service.markedDoneAt ?? now)
                : null,
            correctionRequestedAt:
              status === ServiceStatus.CORRECTION_REQUESTED
                ? (service.correctionRequestedAt ?? now)
                : null,
            correctionReason:
              status === ServiceStatus.CORRECTION_REQUESTED
                ? 'Ajouter un exemple concret avant la validation finale.'
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
    return {
      serviceId: service.id,
      contractId: contract.id,
      previousServiceStatus: status,
      reservedPoints: input.pricePoints ?? 0,
    };
  }

  private async ensureDisputeDemos(
    demos: {
      open: DemoExecutionReference;
      review: DemoExecutionReference;
      resolved: DemoExecutionReference;
    },
    alice: UserDocument,
    bob: UserDocument,
    moderator: UserDocument,
  ) {
    await this.ensureDisputeDemo(
      demos.open,
      alice,
      bob,
      moderator,
      DisputeStatus.OPEN,
    );
    await this.ensureDisputeDemo(
      demos.review,
      alice,
      bob,
      moderator,
      DisputeStatus.UNDER_REVIEW,
    );
    await this.ensureDisputeDemo(
      demos.resolved,
      alice,
      bob,
      moderator,
      DisputeStatus.RESOLVED,
    );
  }

  private async ensureDisputeDemo(
    reference: DemoExecutionReference,
    alice: UserDocument,
    bob: UserDocument,
    moderator: UserDocument,
    targetStatus: DisputeStatus,
  ) {
    let dispute = await this.disputeModel
      .findOne({ contractId: reference.contractId })
      .exec();
    const now = new Date();
    const isReview = targetStatus === DisputeStatus.UNDER_REVIEW;
    const isResolved = targetStatus === DisputeStatus.RESOLVED;

    if (!dispute) {
      const assignedModeratorId = isReview || isResolved ? moderator.id : null;
      const history: DisputeAuditEvent[] = [
        {
          type: DisputeAuditEventType.OPENED,
          actorId: alice.id,
          occurredAt: now,
          metadata: { previousServiceStatus: reference.previousServiceStatus },
        },
      ];
      if (assignedModeratorId) {
        history.push(
          {
            type: DisputeAuditEventType.MODERATOR_ASSIGNED,
            actorId: moderator.id,
            occurredAt: now,
            metadata: { moderatorId: moderator.id },
          },
          {
            type: DisputeAuditEventType.REVIEW_STARTED,
            actorId: moderator.id,
            occurredAt: now,
            metadata: {},
          },
        );
      }
      dispute = await this.disputeModel.create({
        serviceId: reference.serviceId,
        contractId: reference.contractId,
        openedById: alice.id,
        reason: isResolved
          ? DisputeReason.PAYMENT_DISAGREEMENT
          : isReview
            ? DisputeReason.SERVICE_QUALITY
            : DisputeReason.SERVICE_NOT_COMPLETED,
        description: isResolved
          ? 'Les preuves ont permis une décision favorable au prestataire.'
          : 'Les parties demandent une vérification de la réalisation du service.',
        requestedOutcome: isResolved
          ? DisputeOutcome.PROVIDER_PAYMENT
          : isReview
            ? DisputeOutcome.SPLIT
            : DisputeOutcome.REQUESTER_REFUND,
        status: isResolved ? DisputeStatus.OPEN : targetStatus,
        assignedModeratorId,
        previousServiceStatus: reference.previousServiceStatus,
        reservedPoints: reference.reservedPoints,
        openedAt: now,
        assignedAt: assignedModeratorId ? now : null,
        reviewStartedAt: assignedModeratorId ? now : null,
        resolvedAt: null,
        closedAt: null,
        resolution: null,
        resolutionClaimedAt: null,
        history,
      });
    }

    await Promise.all([
      this.ensureDisputeEvidence(
        dispute.id,
        alice.id,
        'Le résultat ne correspond pas entièrement à ce qui était attendu.',
      ),
      this.ensureDisputeEvidence(
        dispute.id,
        bob.id,
        'Voici les explications et les éléments constatés pendant l intervention.',
      ),
    ]);

    if (isResolved) {
      await this.pointsService.transferReservedPoints(
        alice.id,
        bob.id,
        reference.reservedPoints,
        reference.contractId,
        reference.serviceId,
        {
          disputeId: dispute.id,
          disputeResolutionType: DisputeResolutionType.PROVIDER_PAYMENT,
        },
      );

      if (dispute.status !== DisputeStatus.RESOLVED) {
        await this.disputeModel
          .updateOne(
            { _id: dispute.id, resolvedAt: null },
            {
              $set: {
                status: DisputeStatus.RESOLVED,
                resolvedAt: now,
                resolutionClaimedAt: now,
                resolution: {
                  type: DisputeResolutionType.PROVIDER_PAYMENT,
                  justification:
                    'Les preuves confirment la réalisation du service de démonstration.',
                  providerPoints: reference.reservedPoints,
                  requesterPoints: 0,
                  resolvedById: moderator.id,
                  resolvedAt: now,
                },
              },
              $push: {
                history: {
                  $each: [
                    {
                      type: DisputeAuditEventType.RESOLVED,
                      actorId: moderator.id,
                      occurredAt: now,
                      metadata: {
                        resolutionType: DisputeResolutionType.PROVIDER_PAYMENT,
                      },
                    },
                    {
                      type: DisputeAuditEventType.FINANCIAL_OPERATION_COMPLETED,
                      actorId: moderator.id,
                      occurredAt: now,
                      metadata: {
                        providerPoints: reference.reservedPoints,
                        requesterPoints: 0,
                      },
                    },
                  ],
                },
              },
            },
          )
          .exec();
      }

      await Promise.all([
        this.serviceModel
          .updateOne(
            { _id: reference.serviceId },
            {
              $set: {
                status: ServiceStatus.COMPLETED,
                activeDisputeId: null,
                validatedAt: now,
                completedAt: now,
              },
            },
          )
          .exec(),
        this.contractModel
          .updateOne(
            { _id: reference.contractId },
            {
              $set: {
                status: ContractStatus.COMPLETED,
                activeDisputeId: null,
                completedAt: now,
              },
            },
          )
          .exec(),
      ]);
      return;
    }

    await Promise.all([
      this.disputeModel
        .updateOne(
          { _id: dispute.id, resolvedAt: null },
          {
            $set: {
              status: targetStatus,
              assignedModeratorId: isReview ? moderator.id : null,
              assignedAt: isReview ? (dispute.assignedAt ?? now) : null,
              reviewStartedAt: isReview
                ? (dispute.reviewStartedAt ?? now)
                : null,
            },
          },
        )
        .exec(),
      this.serviceModel
        .updateOne(
          { _id: reference.serviceId },
          {
            $set: {
              status: ServiceStatus.DISPUTED,
              activeDisputeId: dispute.id,
            },
          },
        )
        .exec(),
      this.contractModel
        .updateOne(
          { _id: reference.contractId },
          {
            $set: {
              status: ContractStatus.DISPUTED,
              activeDisputeId: dispute.id,
            },
          },
        )
        .exec(),
    ]);
  }

  private async ensureDisputeEvidence(
    disputeId: string,
    authorId: string,
    message: string,
  ) {
    const existing = await this.disputeEvidenceModel
      .findOne({ disputeId, authorId, message })
      .exec();
    if (existing) return existing;
    return this.disputeEvidenceModel.create({
      disputeId,
      authorId,
      type: DisputeEvidenceType.NOTE,
      message,
      fileReference: null,
    });
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
}
