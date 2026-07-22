import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { isValidObjectId, Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import {
  Neighborhood,
  NeighborhoodDocument,
  NeighborhoodStatus,
} from '../neighborhoods/schemas/neighborhood.schema';
import { PublicUsersService } from '../users/public-users.service';
import { AnswerVoteDto } from './dto/answer-vote.dto';
import { CancelVoteDto } from './dto/cancel-vote.dto';
import { CreateVoteDto, VoteOptionInput } from './dto/create-vote.dto';
import { ListVotesQueryDto } from './dto/list-votes-query.dto';
import { UpdateVoteDto } from './dto/update-vote.dto';
import { VoteAnswer, VoteAnswerDocument } from './schemas/vote-answer.schema';
import {
  Vote,
  VoteAuditType,
  VoteBallotType,
  VoteDocument,
  VoteOption,
  VotePrivacy,
  VoteResultsVisibility,
  VoteStatus,
} from './schemas/vote.schema';
import { normalizeVoteRecord } from './vote-normalization';

type VoteActor = Pick<AuthenticatedUser, 'sub' | 'role' | 'neighborhoodId'>;
type VoteRow = {
  _id: unknown;
  title?: string;
  question?: string;
  description?: string;
  neighborhoodId: string;
  createdById: string;
  ballotType?: VoteBallotType;
  privacy?: VotePrivacy;
  resultsVisibility?: VoteResultsVisibility;
  options: VoteOption[];
  minSelections?: number | null;
  maxSelections?: number | null;
  allowAnswerChange?: boolean;
  allowMultipleChoices?: boolean;
  opensAt?: Date;
  closesAt: Date;
  status: VoteStatus;
  history?: unknown[];
  createdAt?: Date;
};
type OwnAnswerLike = {
  _id?: unknown;
  selectedOptionIds?: string[];
  ranking?: Array<{ optionId: string; rank: number }>;
  submittedAt?: Date;
  revision?: number;
};
type VoteFilter = Record<string, unknown>;

@Injectable()
export class VotesService implements OnModuleInit {
  private readonly logger = new Logger(VotesService.name);

  constructor(
    @InjectModel(Vote.name) private readonly voteModel: Model<VoteDocument>,
    @InjectModel(VoteAnswer.name)
    private readonly answerModel: Model<VoteAnswerDocument>,
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
    private readonly publicUsersService: PublicUsersService,
  ) {}

  async onModuleInit() {
    const duplicates = await this.answerModel
      .aggregate([
        {
          $group: {
            _id: { voteId: '$voteId', userId: '$userId' },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $limit: 5 },
      ])
      .exec();
    if (duplicates.length > 0) {
      this.logger.error(
        `Doublons VoteAnswer détectés; aucune suppression automatique: ${JSON.stringify(duplicates)}`,
      );
      return;
    }
    await this.ensureAnswerUniqueIndex();
  }

  async create(dto: CreateVoteDto, actor: VoteActor) {
    this.assertModerator(actor);
    const title = dto.title?.trim() || dto.question?.trim();
    if (!title) throw new BadRequestException('Un titre est requis.');
    const neighborhoodId = await this.resolveNeighborhoodId(dto.neighborhoodId);
    const now = new Date();
    const opensAt = dto.opensAt ?? now;
    if (dto.closesAt.getTime() <= opensAt.getTime()) {
      throw new BadRequestException(
        'La clôture doit être postérieure à l’ouverture.',
      );
    }
    const ballotType =
      dto.ballotType ??
      (dto.allowMultipleChoices
        ? VoteBallotType.MULTIPLE_CHOICE
        : VoteBallotType.SINGLE_CHOICE);
    const options = this.normalizeOptions(dto.options, ballotType);
    this.validateConfiguration(
      ballotType,
      options,
      dto.minSelections,
      dto.maxSelections,
    );
    const requestedStatus = dto.status ?? VoteStatus.DRAFT;
    if (![VoteStatus.DRAFT, VoteStatus.SCHEDULED].includes(requestedStatus)) {
      throw new BadRequestException(
        'Un vote est créé comme brouillon ou planifié.',
      );
    }
    const status =
      requestedStatus === VoteStatus.SCHEDULED
        ? VoteStatus.SCHEDULED
        : VoteStatus.DRAFT;
    const vote = await this.voteModel.create({
      title,
      description: dto.description ?? '',
      neighborhoodId,
      createdById: actor.sub,
      ballotType,
      privacy: dto.privacy ?? VotePrivacy.PUBLIC,
      resultsVisibility:
        dto.resultsVisibility ?? VoteResultsVisibility.AFTER_CLOSE,
      options,
      minSelections: dto.minSelections ?? null,
      maxSelections: dto.maxSelections ?? null,
      allowAnswerChange: dto.allowAnswerChange ?? false,
      opensAt,
      closesAt: dto.closesAt,
      status,
      publishedAt: status === VoteStatus.SCHEDULED ? now : null,
      history: [
        {
          type:
            status === VoteStatus.SCHEDULED
              ? VoteAuditType.SCHEDULED
              : VoteAuditType.CREATED,
          actorId: actor.sub,
          occurredAt: now,
          metadata: {},
        },
      ],
    });
    return this.presentOne(vote.toObject() as unknown as VoteRow, actor, true);
  }

  async findAll(query: ListVotesQueryDto, actor: VoteActor, admin = false) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = await this.buildFilter(query, actor, admin);
    const sort: Record<string, 1 | -1> =
      query.sort === 'newest'
        ? { createdAt: -1 }
        : query.sort === 'opening_soon'
          ? { opensAt: 1 }
          : { closesAt: 1 };
    const [rows, total] = await Promise.all([
      this.voteModel
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<VoteRow[]>()
        .exec(),
      this.voteModel.countDocuments(filter).exec(),
    ]);
    return {
      items: await this.presentMany(rows, actor, admin),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findLegacy(neighborhoodId: string | undefined, actor: VoteActor) {
    const page = await this.findAll({ neighborhoodId, limit: 100 }, actor);
    return page.items;
  }

  async findOne(id: string, actor: VoteActor, admin = false) {
    const vote = await this.findDocument(id);
    this.assertCanView(vote, actor, admin);
    return this.presentOne(
      vote.toObject() as unknown as VoteRow,
      actor,
      admin,
      true,
    );
  }

  async answer(id: string, actor: VoteActor, dto: AnswerVoteDto) {
    const vote = await this.findDocument(id);
    this.assertCanView(vote, actor, false);
    await this.assertActiveResidentNeighborhood(actor);
    const normalized = normalizeVoteRecord(vote.toObject());
    const now = Date.now();
    if (
      normalized.status !== VoteStatus.OPEN ||
      normalized.opensAt.getTime() > now ||
      normalized.closesAt.getTime() <= now
    ) {
      throw new ConflictException('Ce vote n’est pas ouvert.');
    }
    if (vote.neighborhoodId !== actor.neighborhoodId) {
      throw new ForbiddenException(
        'Vous pouvez répondre uniquement aux votes de votre quartier.',
      );
    }
    const payload = this.validateAnswer(normalized, dto);
    const existing = await this.answerModel
      .findOne({ voteId: id, userId: actor.sub })
      .exec();
    if (existing) {
      if (this.sameAnswer(existing, payload)) {
        return {
          answer: this.presentOwnAnswer(existing.toObject()),
          unchanged: true,
        };
      }
      if (!normalized.allowAnswerChange) {
        throw new ConflictException(
          'Votre réponse a déjà été enregistrée et ne peut pas être modifiée.',
        );
      }
      const updated = await this.answerModel
        .findOneAndUpdate(
          {
            _id: existing._id,
            revision: existing.revision,
            voteId: id,
            userId: actor.sub,
          },
          {
            $set: { ...payload, submittedAt: new Date() },
            $inc: { revision: 1 },
          },
          { returnDocument: 'after' },
        )
        .exec();
      if (!updated)
        throw new ConflictException(
          'Votre réponse a changé. Rechargez la page.',
        );
      return {
        answer: this.presentOwnAnswer(updated.toObject()),
        unchanged: false,
      };
    }
    try {
      const created = await this.answerModel.create({
        voteId: id,
        userId: actor.sub,
        ...payload,
        submittedAt: new Date(),
        revision: 1,
      });
      return {
        answer: this.presentOwnAnswer(created.toObject()),
        unchanged: false,
      };
    } catch (error) {
      if (this.isDuplicateKey(error))
        throw new ConflictException('Une réponse a déjà été enregistrée.');
      throw error;
    }
  }

  async results(id: string, actor: VoteActor, admin = false) {
    const vote = await this.findDocument(id);
    this.assertCanView(vote, actor, admin);
    const normalized = normalizeVoteRecord(vote.toObject());
    const ownAnswer = await this.answerModel
      .findOne({ voteId: id, userId: actor.sub })
      .lean()
      .exec();
    if (!this.canViewResults(normalized, Boolean(ownAnswer), admin)) {
      throw new ForbiddenException(
        'Les résultats ne sont pas encore disponibles.',
      );
    }
    return this.aggregateResults(normalized);
  }

  async update(id: string, dto: UpdateVoteDto, actor: VoteActor) {
    this.assertModerator(actor);
    const vote = await this.findDocument(id);
    if (![VoteStatus.DRAFT, VoteStatus.SCHEDULED].includes(vote.status)) {
      throw new ConflictException('Ce vote ne peut plus être modifié.');
    }
    const answerCount = await this.answerModel
      .countDocuments({ voteId: id })
      .exec();
    if (answerCount > 0 && (dto.options || dto.ballotType)) {
      throw new ConflictException(
        'Les options ne peuvent plus être modifiées après une première réponse.',
      );
    }
    const normalizedCurrent = normalizeVoteRecord(vote.toObject());
    const title =
      dto.title?.trim() || dto.question?.trim() || normalizedCurrent.title;
    const ballotType = dto.ballotType ?? normalizedCurrent.ballotType;
    const options = dto.options
      ? this.normalizeOptions(dto.options, ballotType)
      : normalizedCurrent.options;
    const opensAt = dto.opensAt ?? normalizedCurrent.opensAt;
    const closesAt = dto.closesAt ?? normalizedCurrent.closesAt;
    if (closesAt.getTime() <= opensAt.getTime())
      throw new BadRequestException('La clôture doit suivre l’ouverture.');
    this.validateConfiguration(
      ballotType,
      options,
      dto.minSelections ?? vote.minSelections ?? undefined,
      dto.maxSelections ?? vote.maxSelections ?? undefined,
    );
    const update: Record<string, unknown> = {
      title,
      description: dto.description ?? normalizedCurrent.description,
      ballotType,
      privacy: dto.privacy ?? normalizedCurrent.privacy,
      resultsVisibility:
        dto.resultsVisibility ?? normalizedCurrent.resultsVisibility,
      options,
      minSelections: dto.minSelections ?? vote.minSelections ?? null,
      maxSelections: dto.maxSelections ?? vote.maxSelections ?? null,
      allowAnswerChange:
        dto.allowAnswerChange ?? normalizedCurrent.allowAnswerChange,
      opensAt,
      closesAt,
    };
    const now = new Date();
    const updated = await this.voteModel
      .findOneAndUpdate(
        { _id: id, status: vote.status },
        {
          $set: update,
          $unset: { question: 1, allowMultipleChoices: 1 },
          $push: {
            history: {
              type: VoteAuditType.UPDATED,
              actorId: actor.sub,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<VoteRow>()
      .exec();
    if (!updated)
      throw new ConflictException('Le vote a changé. Rechargez la page.');
    return this.presentOne(updated, actor, true, true);
  }

  async remove(id: string, actor: VoteActor) {
    this.assertModerator(actor);
    const vote = await this.findDocument(id);
    if (vote.status !== VoteStatus.DRAFT)
      throw new ConflictException('Seul un brouillon peut être supprimé.');
    if (await this.answerModel.exists({ voteId: id }))
      throw new ConflictException('Ce vote possède déjà des réponses.');
    await vote.deleteOne();
    return { deleted: true };
  }

  async open(id: string, actor: VoteActor) {
    this.assertModerator(actor);
    const vote = await this.findDocument(id);
    if (![VoteStatus.DRAFT, VoteStatus.SCHEDULED].includes(vote.status)) {
      throw new ConflictException('Ce vote ne peut pas être ouvert.');
    }
    const normalized = normalizeVoteRecord(vote.toObject());
    this.validateConfiguration(
      normalized.ballotType,
      normalized.options,
      vote.minSelections ?? undefined,
      vote.maxSelections ?? undefined,
    );
    const now = new Date();
    if (normalized.closesAt.getTime() <= now.getTime())
      throw new ConflictException('La date de clôture est dépassée.');
    const status =
      normalized.opensAt.getTime() > now.getTime()
        ? VoteStatus.SCHEDULED
        : VoteStatus.OPEN;
    const type =
      status === VoteStatus.SCHEDULED
        ? VoteAuditType.SCHEDULED
        : VoteAuditType.OPENED;
    const updated = await this.voteModel
      .findOneAndUpdate(
        { _id: id, status: vote.status, closesAt: { $gt: now } },
        {
          $set: { status, publishedAt: vote.publishedAt ?? now },
          $push: {
            history: {
              type,
              actorId: actor.sub,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<VoteRow>()
      .exec();
    if (!updated)
      throw new ConflictException('Le vote a changé. Rechargez la page.');
    return this.presentOne(updated, actor, true, true);
  }

  async close(id: string, actor: VoteActor) {
    this.assertModerator(actor);
    const vote = await this.findDocument(id);
    if (![VoteStatus.OPEN, VoteStatus.SCHEDULED].includes(vote.status)) {
      throw new ConflictException('Ce vote n’est pas ouvert.');
    }
    const now = new Date();
    const updated = await this.voteModel
      .findOneAndUpdate(
        { _id: id, status: vote.status },
        {
          $set: { status: VoteStatus.CLOSED, closedAt: now },
          $push: {
            history: {
              type: VoteAuditType.CLOSED,
              actorId: actor.sub,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<VoteRow>()
      .exec();
    if (!updated) throw new ConflictException('Ce vote est déjà clôturé.');
    return this.presentOne(updated, actor, true, true);
  }

  async cancel(id: string, dto: CancelVoteDto, actor: VoteActor) {
    this.assertModerator(actor);
    const vote = await this.findDocument(id);
    if (
      [VoteStatus.CANCELLED, VoteStatus.CLOSED, VoteStatus.ARCHIVED].includes(
        vote.status,
      )
    ) {
      throw new ConflictException('Ce vote ne peut plus être annulé.');
    }
    const now = new Date();
    const updated = await this.voteModel
      .findOneAndUpdate(
        { _id: id, status: vote.status },
        {
          $set: { status: VoteStatus.CANCELLED, cancelledAt: now },
          $push: {
            history: {
              type: VoteAuditType.CANCELLED,
              actorId: actor.sub,
              occurredAt: now,
              metadata: { reason: dto.reason },
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<VoteRow>()
      .exec();
    if (!updated)
      throw new ConflictException('Le vote a changé. Rechargez la page.');
    return this.presentOne(updated, actor, true, true);
  }

  async archive(id: string, actor: VoteActor) {
    this.assertModerator(actor);
    const vote = await this.findDocument(id);
    if (![VoteStatus.CLOSED, VoteStatus.CANCELLED].includes(vote.status)) {
      throw new ConflictException(
        'Seul un vote clos ou annulé peut être archivé.',
      );
    }
    const now = new Date();
    const updated = await this.voteModel
      .findOneAndUpdate(
        { _id: id, status: vote.status },
        {
          $set: { status: VoteStatus.ARCHIVED, archivedAt: now },
          $push: {
            history: {
              type: VoteAuditType.ARCHIVED,
              actorId: actor.sub,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<VoteRow>()
      .exec();
    if (!updated)
      throw new ConflictException('Le vote a changé. Rechargez la page.');
    return this.presentOne(updated, actor, true, true);
  }

  async homeSummary(actor: VoteActor) {
    const now = new Date();
    const rows = await this.voteModel
      .find({
        neighborhoodId: actor.neighborhoodId,
        status: { $in: [VoteStatus.OPEN, VoteStatus.SCHEDULED] },
        closesAt: { $gt: now },
        opensAt: { $lte: now },
      })
      .sort({ closesAt: 1 })
      .limit(4)
      .lean<VoteRow[]>()
      .exec();
    const answeredIds = await this.answerModel.distinct('voteId', {
      userId: actor.sub,
      voteId: { $in: rows.map((row) => String(row._id)) },
    });
    return {
      openVotes: await this.presentMany(rows, actor),
      myPendingVotesCount: rows.filter(
        (row) => !answeredIds.includes(String(row._id)),
      ).length,
    };
  }

  private async buildFilter(
    query: ListVotesQueryDto,
    actor: VoteActor,
    admin: boolean,
  ) {
    const filter: VoteFilter = {
      neighborhoodId: admin
        ? (query.neighborhoodId ?? { $exists: true })
        : actor.neighborhoodId,
    };
    if (query.search) {
      const regex = this.regex(query.search);
      filter.$or = [
        { title: regex },
        { question: regex },
        { description: regex },
      ];
    }
    if (query.status) filter.status = query.status;
    else if (!admin)
      filter.status = {
        $nin: [VoteStatus.DRAFT, VoteStatus.CANCELLED, VoteStatus.ARCHIVED],
      };
    if (query.ballotType) {
      if (query.ballotType === VoteBallotType.MULTIPLE_CHOICE) {
        filter.$and = [
          ...((filter.$and as VoteFilter[]) ?? []),
          {
            $or: [
              { ballotType: VoteBallotType.MULTIPLE_CHOICE },
              { ballotType: { $exists: false }, allowMultipleChoices: true },
            ],
          },
        ];
      } else if (query.ballotType === VoteBallotType.SINGLE_CHOICE) {
        filter.$and = [
          ...((filter.$and as VoteFilter[]) ?? []),
          {
            $or: [
              { ballotType: VoteBallotType.SINGLE_CHOICE },
              {
                ballotType: { $exists: false },
                $or: [
                  { allowMultipleChoices: false },
                  { allowMultipleChoices: { $exists: false } },
                ],
              },
            ],
          },
        ];
      } else {
        filter.ballotType = query.ballotType;
      }
    }
    if (query.privacy) filter.privacy = query.privacy;
    if (query.createdBy === 'me') filter.createdById = actor.sub;
    if (admin && query.createdById) filter.createdById = query.createdById;
    if (query.answered !== undefined) {
      const ids = await this.answerModel.distinct('voteId', {
        userId: actor.sub,
      });
      filter._id = query.answered ? { $in: ids } : { $nin: ids };
    }
    return filter;
  }

  private async presentMany(
    rows: VoteRow[],
    actor: VoteActor,
    admin = false,
    includeResults = false,
  ) {
    if (rows.length === 0) return [];
    const voteIds = rows.map((row) => String(row._id));
    const neighborhoodIds = [...new Set(rows.map((row) => row.neighborhoodId))];
    const neighborhoodObjectIds = neighborhoodIds.filter((id) =>
      isValidObjectId(id),
    );
    const neighborhoodFilters: VoteFilter[] = [
      { slug: { $in: neighborhoodIds } },
    ];
    if (neighborhoodObjectIds.length > 0) {
      neighborhoodFilters.push({ _id: { $in: neighborhoodObjectIds } });
    }
    const [profiles, neighborhoods, answerCounts, ownAnswers] =
      await Promise.all([
        this.publicUsersService.findByIds(rows.map((row) => row.createdById)),
        this.neighborhoodModel
          .find({ $or: neighborhoodFilters })
          .select('_id slug name city')
          .lean()
          .exec(),
        this.answerModel
          .aggregate<{
            _id: string;
            count: number;
          }>([
            { $match: { voteId: { $in: voteIds } } },
            { $group: { _id: '$voteId', count: { $sum: 1 } } },
          ])
          .exec(),
        this.answerModel
          .find({ voteId: { $in: voteIds }, userId: actor.sub })
          .lean()
          .exec(),
      ]);
    const neighborhoodMap = new Map<
      string,
      { id: string; name: string; city?: string }
    >();
    for (const item of neighborhoods) {
      const projection = {
        id: String(item._id),
        name: item.name,
        city: item.city,
      };
      neighborhoodMap.set(String(item._id), projection);
      if (item.slug) neighborhoodMap.set(item.slug, projection);
    }
    const countMap = new Map(
      answerCounts.map((item) => [item._id, item.count]),
    );
    const ownAnswerMap = new Map(
      ownAnswers.map((answer) => [answer.voteId, answer]),
    );
    return Promise.all(
      rows.map(async (row) => {
        const normalized = normalizeVoteRecord(row);
        const ownAnswer = ownAnswerMap.get(String(row._id));
        const canViewResults = this.canViewResults(
          normalized,
          Boolean(ownAnswer),
          admin,
        );
        return {
          ...normalized,
          creator: profiles.get(row.createdById) ?? null,
          neighborhood: neighborhoodMap.get(row.neighborhoodId) ?? null,
          answersCount: countMap.get(String(row._id)) ?? 0,
          viewerAnswer: ownAnswer ? this.presentOwnAnswer(ownAnswer) : null,
          results:
            includeResults && canViewResults
              ? await this.aggregateResults(normalized)
              : null,
          resultsAvailable: canViewResults,
          resultsLockedReason: canViewResults
            ? null
            : this.resultsLockedReason(normalized, Boolean(ownAnswer)),
          nextAction: this.voteNextAction(normalized, Boolean(ownAnswer)),
          permissions: this.permissions(
            normalized,
            actor,
            Boolean(ownAnswer),
            admin,
          ),
          ...(admin ? { history: row.history ?? [] } : {}),
        };
      }),
    );
  }

  private async presentOne(
    row: VoteRow,
    actor: VoteActor,
    admin = false,
    includeResults = false,
  ) {
    return (await this.presentMany([row], actor, admin, includeResults))[0];
  }

  private permissions(
    vote: ReturnType<typeof normalizeVoteRecord>,
    actor: VoteActor,
    hasAnswered: boolean,
    admin: boolean,
  ) {
    const moderator = [Role.ADMIN, Role.MODERATOR].includes(actor.role);
    const now = Date.now();
    const open =
      vote.status === VoteStatus.OPEN &&
      vote.opensAt.getTime() <= now &&
      vote.closesAt.getTime() > now;
    return {
      canEdit:
        moderator &&
        [VoteStatus.DRAFT, VoteStatus.SCHEDULED].includes(vote.storedStatus),
      canOpen:
        moderator &&
        [VoteStatus.DRAFT, VoteStatus.SCHEDULED].includes(vote.storedStatus) &&
        vote.closesAt.getTime() > now,
      canAnswer:
        !admin &&
        actor.neighborhoodId === vote.neighborhoodId &&
        open &&
        (!hasAnswered || vote.allowAnswerChange),
      canChangeAnswer: !admin && hasAnswered && vote.allowAnswerChange && open,
      canViewResults: this.canViewResults(vote, hasAnswered, admin),
      canClose:
        moderator &&
        [VoteStatus.OPEN, VoteStatus.SCHEDULED].includes(vote.storedStatus),
      canCancel:
        moderator &&
        ![
          VoteStatus.CLOSED,
          VoteStatus.CANCELLED,
          VoteStatus.ARCHIVED,
        ].includes(vote.storedStatus),
      canArchive:
        moderator &&
        [VoteStatus.CLOSED, VoteStatus.CANCELLED].includes(vote.storedStatus),
      canViewVoters: moderator && vote.privacy === VotePrivacy.PUBLIC,
    };
  }

  private voteNextAction(
    vote: ReturnType<typeof normalizeVoteRecord>,
    hasAnswered: boolean,
  ) {
    if (vote.status === VoteStatus.SCHEDULED) return 'wait_for_opening';
    if (vote.status === VoteStatus.OPEN && !hasAnswered) return 'answer';
    if (
      vote.status === VoteStatus.OPEN &&
      hasAnswered &&
      vote.allowAnswerChange
    )
      return 'change_answer';
    if (vote.status === VoteStatus.CLOSED) return 'view_results';
    return null;
  }

  private resultsLockedReason(
    vote: ReturnType<typeof normalizeVoteRecord>,
    hasAnswered: boolean,
  ) {
    if (vote.resultsVisibility === VoteResultsVisibility.AFTER_CLOSE)
      return 'available_after_close';
    if (
      vote.resultsVisibility === VoteResultsVisibility.AFTER_SUBMISSION &&
      !hasAnswered
    )
      return 'available_after_submission';
    return 'not_available';
  }

  private validateAnswer(
    vote: ReturnType<typeof normalizeVoteRecord>,
    dto: AnswerVoteDto,
  ) {
    const selectedOptionIds: string[] = [
      ...new Set<string>(dto.selectedOptionIds),
    ];
    if (selectedOptionIds.length !== dto.selectedOptionIds.length) {
      throw new BadRequestException(
        'Une option ne peut pas être sélectionnée plusieurs fois.',
      );
    }
    const validIds = new Set(vote.options.map((option) => option.id));
    if (selectedOptionIds.some((id) => !validIds.has(id))) {
      throw new BadRequestException(
        'Une option sélectionnée n’appartient pas à ce vote.',
      );
    }
    if (
      [VoteBallotType.YES_NO, VoteBallotType.SINGLE_CHOICE].includes(
        vote.ballotType,
      ) &&
      selectedOptionIds.length !== 1
    ) {
      throw new BadRequestException('Ce vote exige exactement une réponse.');
    }
    if (vote.ballotType === VoteBallotType.MULTIPLE_CHOICE) {
      const min = vote.minSelections ?? 1;
      const max = vote.maxSelections ?? vote.options.length;
      if (selectedOptionIds.length < min || selectedOptionIds.length > max) {
        throw new BadRequestException(
          `Sélectionnez entre ${min} et ${max} options.`,
        );
      }
    }
    if (vote.ballotType !== VoteBallotType.RANKING) {
      return { selectedOptionIds, ranking: [] };
    }
    const ranking = dto.ranking ?? [];
    if (
      ranking.length !== vote.options.length ||
      selectedOptionIds.length !== vote.options.length
    ) {
      throw new BadRequestException(
        'Le classement doit contenir toutes les options.',
      );
    }
    const optionIds = new Set(ranking.map((entry) => entry.optionId));
    const ranks = new Set(ranking.map((entry) => entry.rank));
    if (
      optionIds.size !== vote.options.length ||
      ranks.size !== vote.options.length
    ) {
      throw new BadRequestException(
        'Chaque option et chaque rang doivent être uniques.',
      );
    }
    const expectedRanks = vote.options.map((_, index) => index + 1);
    if (
      expectedRanks.some((rank) => !ranks.has(rank)) ||
      [...optionIds].some((id) => !validIds.has(id))
    ) {
      throw new BadRequestException(
        'Le classement doit utiliser tous les rangs de 1 au nombre d’options.',
      );
    }
    return {
      selectedOptionIds: vote.options.map((option) => option.id),
      ranking: [...ranking].sort((left, right) => left.rank - right.rank),
    };
  }

  private async aggregateResults(vote: ReturnType<typeof normalizeVoteRecord>) {
    const answers = await this.answerModel
      .find({ voteId: vote.id })
      .select('selectedOptionIds ranking')
      .lean()
      .exec();
    const totalAnswers = answers.length;
    const counts = new Map(vote.options.map((option) => [option.id, 0]));
    const borda = new Map(vote.options.map((option) => [option.id, 0]));
    for (const answer of answers) {
      for (const optionId of answer.selectedOptionIds) {
        if (counts.has(optionId))
          counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
      }
      if (vote.ballotType === VoteBallotType.RANKING) {
        for (const entry of answer.ranking ?? []) {
          if (borda.has(entry.optionId)) {
            borda.set(
              entry.optionId,
              (borda.get(entry.optionId) ?? 0) +
                vote.options.length -
                entry.rank,
            );
          }
        }
      }
    }
    const resultRows = vote.options.map((option) => ({
      option,
      count: counts.get(option.id) ?? 0,
      percentage:
        totalAnswers === 0
          ? 0
          : Math.round(((counts.get(option.id) ?? 0) / totalAnswers) * 10000) /
            100,
      percentageDenominator: 'respondents',
      bordaScore:
        vote.ballotType === VoteBallotType.RANKING
          ? (borda.get(option.id) ?? 0)
          : null,
    }));
    if (vote.ballotType === VoteBallotType.RANKING) {
      resultRows.sort((left, right) => {
        const scoreDifference =
          (right.bordaScore ?? 0) - (left.bordaScore ?? 0);
        return scoreDifference || left.option.order - right.option.order;
      });
    }
    return {
      totalAnswers,
      results: resultRows,
      rankingPolicy:
        vote.ballotType === VoteBallotType.RANKING
          ? {
              method: 'borda',
              completeRankingRequired: true,
              pointsPerRank: 'N - rank',
              unrankedOptions: 'not_allowed',
              tieBreak: 'option_order',
            }
          : null,
      privacy: vote.privacy,
      anonymity:
        vote.privacy === VotePrivacy.ANONYMOUS
          ? 'application_level'
          : 'public_ballot',
    };
  }

  private canViewResults(
    vote: ReturnType<typeof normalizeVoteRecord>,
    hasAnswered: boolean,
    admin: boolean,
  ) {
    if (admin) return true;
    if (vote.resultsVisibility === VoteResultsVisibility.ALWAYS) return true;
    if (vote.resultsVisibility === VoteResultsVisibility.AFTER_SUBMISSION)
      return hasAnswered;
    return (
      vote.status === VoteStatus.CLOSED || vote.status === VoteStatus.ARCHIVED
    );
  }

  private presentOwnAnswer(answer: OwnAnswerLike) {
    return {
      id:
        typeof answer._id === 'string'
          ? answer._id
          : answer._id instanceof Types.ObjectId
            ? answer._id.toHexString()
            : null,
      selectedOptionIds: answer.selectedOptionIds ?? [],
      ranking: answer.ranking ?? [],
      submittedAt: answer.submittedAt ?? null,
      revision: answer.revision ?? 1,
    };
  }

  private sameAnswer(
    existing: VoteAnswerDocument,
    payload: {
      selectedOptionIds: string[];
      ranking: { optionId: string; rank: number }[];
    },
  ) {
    const selected = [...existing.selectedOptionIds].sort();
    const nextSelected = [...payload.selectedOptionIds].sort();
    const ranking = [...(existing.ranking ?? [])].sort(
      (left, right) => left.rank - right.rank,
    );
    return (
      JSON.stringify(selected) === JSON.stringify(nextSelected) &&
      JSON.stringify(
        ranking.map(({ optionId, rank }) => ({ optionId, rank })),
      ) === JSON.stringify(payload.ranking)
    );
  }

  private normalizeOptions(
    inputs: VoteOptionInput[],
    ballotType: VoteBallotType,
  ): VoteOption[] {
    const source: VoteOptionInput[] =
      ballotType === VoteBallotType.YES_NO
        ? [{ label: 'Oui' }, { label: 'Non' }]
        : inputs;
    const labels = new Set<string>();
    return source.map((input, index) => {
      const label = (typeof input === 'string' ? input : input.label).trim();
      if (!label || label.length > 240)
        throw new BadRequestException(
          'Chaque option doit avoir un libellé valide.',
        );
      const key = label.toLocaleLowerCase('fr');
      if (labels.has(key))
        throw new BadRequestException(
          'Les options doivent avoir des libellés distincts.',
        );
      labels.add(key);
      return {
        id: randomUUID(),
        label,
        description:
          typeof input === 'string' ? null : input.description?.trim() || null,
        order: index,
      };
    });
  }

  private validateConfiguration(
    ballotType: VoteBallotType,
    options: VoteOption[],
    minSelections?: number | null,
    maxSelections?: number | null,
  ) {
    if (options.length < 2)
      throw new BadRequestException(
        'Un vote doit proposer au moins deux options.',
      );
    if (ballotType === VoteBallotType.YES_NO && options.length !== 2) {
      throw new BadRequestException(
        'Un vote oui/non contient exactement deux options.',
      );
    }
    if (ballotType === VoteBallotType.MULTIPLE_CHOICE) {
      const min = minSelections ?? 1;
      const max = maxSelections ?? options.length;
      if (min > max || max > options.length) {
        throw new BadRequestException(
          'Les limites de sélection sont incohérentes.',
        );
      }
    }
  }

  private async findDocument(id: string) {
    const vote = await this.voteModel.findById(id).exec();
    if (!vote) throw new NotFoundException('Vote introuvable.');
    return vote;
  }

  private async resolveNeighborhoodId(identifier: string) {
    const filters: VoteFilter[] = [{ slug: identifier }];
    if (isValidObjectId(identifier)) filters.push({ _id: identifier });
    const neighborhood = await this.neighborhoodModel
      .findOne({
        $and: [
          { $or: filters },
          {
            status: { $ne: NeighborhoodStatus.ARCHIVED },
            isActive: { $ne: false },
          },
        ],
      })
      .select('_id slug')
      .lean()
      .exec();
    if (!neighborhood) {
      throw new BadRequestException('Le quartier sélectionné est introuvable.');
    }
    return neighborhood.slug || String(neighborhood._id);
  }

  private async assertActiveResidentNeighborhood(actor: VoteActor) {
    if (actor.role !== Role.RESIDENT) return;
    if (!actor.neighborhoodId) {
      throw new ConflictException(
        'Vous devez être rattaché à un quartier pour voter.',
      );
    }
    await this.resolveNeighborhoodId(actor.neighborhoodId);
  }

  private assertCanView(vote: VoteDocument, actor: VoteActor, admin: boolean) {
    if (admin || [Role.ADMIN, Role.MODERATOR].includes(actor.role)) return;
    if (
      vote.neighborhoodId !== actor.neighborhoodId ||
      vote.status === VoteStatus.DRAFT
    ) {
      throw new NotFoundException('Vote introuvable.');
    }
  }

  private assertModerator(actor: VoteActor) {
    if ([Role.ADMIN, Role.MODERATOR].includes(actor.role)) return;
    throw new ForbiddenException(
      'Cette action est réservée aux administrateurs et modérateurs.',
    );
  }

  private regex(value: string) {
    return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  private isDuplicateKey(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }

  private async ensureAnswerUniqueIndex() {
    try {
      const indexes = await this.answerModel.collection.indexes();
      const existing = indexes.find(
        (index) => index.key?.voteId === 1 && index.key?.userId === 1,
      );
      if (existing?.unique) return;
      if (existing) {
        this.logger.error(
          'Index VoteAnswer voteId+userId présent sans unicité; aucune modification automatique.',
        );
        return;
      }
      await this.answerModel.collection.createIndex(
        { voteId: 1, userId: 1 },
        {
          unique: true,
          partialFilterExpression: {
            voteId: { $type: 'string' },
            userId: { $type: 'string' },
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Impossible de vérifier ou créer l’index unique VoteAnswer: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
