import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ServiceApplication,
  ServiceApplicationDocument,
  ServiceApplicationStatus,
} from '../applications/schemas/service-application.schema';
import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import { User, UserDocument } from '../auth/schemas/user.schema';
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
  Incident,
  IncidentDocument,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  IncidentType,
} from '../incidents/schemas/incident.schema';
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
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    @InjectModel(NeighborhoodEvent.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(EventResponse.name)
    private readonly eventResponseModel: Model<EventResponseDocument>,
    @InjectModel(Vote.name)
    private readonly voteModel: Model<VoteDocument>,
    @InjectModel(VoteAnswer.name)
    private readonly voteAnswerModel: Model<VoteAnswerDocument>,
    private readonly usersService: UsersService,
    private readonly pointsService: PointsService,
    private readonly documentsService: DocumentsService,
  ) {}

  async onModuleInit() {
    if (
      process.env.DEV_AUTH_SEED !== 'true' ||
      process.env.NODE_ENV === 'test'
    ) {
      return;
    }

    const [alice, bob, claire, moderator, admin] = await Promise.all([
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
      this.usersService.ensureDevUser({
        email: 'moderator@connected-neighbours.local',
        displayName: 'Moderation Demo',
        role: Role.MODERATOR,
        neighborhoodId: 'quartier-centre',
        password: 'moderator123',
      }),
      this.usersService.ensureDevUser({
        email: 'admin@connected-neighbours.local',
        displayName: 'Admin Demo',
        role: Role.ADMIN,
        neighborhoodId: 'quartier-centre',
        password: 'admin123',
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
    await this.ensureApplication(
      computerHelp,
      claire.id,
      bob.id,
      ServiceApplicationStatus.SUBMITTED,
      "Bonjour Bob, j'aurais besoin d'aide pour securiser mon ordinateur.",
    );
    await this.ensureIncident(alice.id);
    await this.ensureLocalLife(alice, bob, claire, admin);
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
    const existing = await this.eventModel
      .findOne({ title: input.title, neighborhoodId: 'quartier-centre' })
      .exec();
    if (existing) return existing;
    const published = input.status !== EventStatus.DRAFT;
    return this.eventModel.create({
      ...input,
      neighborhoodId: 'quartier-centre',
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
    const existing = await this.voteModel
      .findOne({ title: input.title, neighborhoodId: 'quartier-centre' })
      .exec();
    if (existing) return existing;
    const key = input.title
      .toLocaleLowerCase('fr')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return this.voteModel.create({
      ...input,
      description: 'Consultation des habitants du Quartier Centre.',
      neighborhoodId: 'quartier-centre',
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
