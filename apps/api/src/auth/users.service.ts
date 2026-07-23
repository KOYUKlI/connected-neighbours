import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { GraphSyncService } from '../graph/graph-sync.service';
import { GraphEntityType } from '../graph/graph.types';

import { PasswordService } from './password.service';
import { Role } from './role.enum';
import {
  IdentityMigrationStatus,
  IdentityProvider,
  NeighborhoodAssignmentSource,
  User,
  UserDocument,
} from './schemas/user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly passwordService: PasswordService,
    @Optional() private readonly graphSyncService?: GraphSyncService,
  ) {}

  async onModuleInit() {
    if (process.env.DEV_AUTH_SEED !== 'true') {
      return;
    }

    await this.ensureDevUser({
      email: 'alice@connected-neighbours.local',
      displayName: 'Alice Martin',
      role: Role.RESIDENT,
      neighborhoodId: 'quartier-centre',
      password: 'alice123',
    });

    await this.ensureDevUser({
      email: 'bob@connected-neighbours.local',
      displayName: 'Bob Dupont',
      role: Role.RESIDENT,
      neighborhoodId: 'quartier-centre',
      password: 'bob123',
    });

    await this.ensureDevUser({
      email: 'admin@connected-neighbours.local',
      displayName: 'Admin Demo',
      role: Role.ADMIN,
      neighborhoodId: 'quartier-centre',
      password: 'admin123',
    });
  }

  async ensureDevUser(input: {
    email: string;
    displayName: string;
    role: Role;
    neighborhoodId: string;
    password: string;
  }) {
    const existing = await this.userModel
      .findOne({ email: input.email })
      .exec();

    if (existing) {
      const patch: Partial<
        Pick<
          User,
          | 'displayName'
          | 'role'
          | 'neighborhoodId'
          | 'isActive'
          | 'pointsBalance'
          | 'reservedPoints'
          | 'neighborhoodAssignedAt'
          | 'neighborhoodAssignmentSource'
          | 'neighborhoodAssignmentActorId'
          | 'neighborhoodAssignmentHistory'
        >
      > = {};

      if (existing.displayName !== input.displayName) {
        patch.displayName = input.displayName;
      }

      if (existing.role !== input.role) {
        patch.role = input.role;
      }

      if (existing.neighborhoodId !== input.neighborhoodId) {
        patch.neighborhoodId = input.neighborhoodId;
      }

      if (existing.isActive !== true) {
        patch.isActive = true;
      }

      if (existing.pointsBalance === undefined) {
        patch.pointsBalance = 100;
      }

      if (existing.reservedPoints === undefined) {
        patch.reservedPoints = 0;
      }

      if (!existing.neighborhoodAssignedAt) {
        const occurredAt = new Date();
        patch.neighborhoodAssignedAt = occurredAt;
        patch.neighborhoodAssignmentSource = NeighborhoodAssignmentSource.SEED;
        patch.neighborhoodAssignmentActorId = 'seed';
        if (!existing.neighborhoodAssignmentHistory?.length) {
          patch.neighborhoodAssignmentHistory = [
            {
              previousNeighborhoodId: null,
              neighborhoodId: input.neighborhoodId,
              source: NeighborhoodAssignmentSource.SEED,
              actorId: 'seed',
              reason: 'Initialisation du compte de démonstration.',
              occurredAt,
            },
          ];
        }
      }

      if (Object.keys(patch).length > 0) {
        Object.assign(existing, patch);
        await existing.save();
      }

      this.queueUserProjection(existing.id);

      return existing;
    }

    const passwordHash = await this.passwordService.hash(input.password);

    const occurredAt = new Date();
    const created = await this.userModel.create({
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      neighborhoodId: input.neighborhoodId,
      neighborhoodAssignedAt: occurredAt,
      neighborhoodAssignmentSource: NeighborhoodAssignmentSource.SEED,
      neighborhoodAssignmentActorId: 'seed',
      neighborhoodAssignmentHistory: [
        {
          previousNeighborhoodId: null,
          neighborhoodId: input.neighborhoodId,
          source: NeighborhoodAssignmentSource.SEED,
          actorId: 'seed',
          reason: 'Initialisation du compte de démonstration.',
          occurredAt,
        },
      ],
      passwordHash,
      identityProvider: IdentityProvider.LOCAL,
      identityMigrationStatus: IdentityMigrationStatus.LOCAL_ONLY,
      emailVerified: true,
      onboardingCompleted: true,
      isActive: true,
      pointsBalance: 100,
      reservedPoints: 0,
    });
    this.queueUserProjection(created.id);
    return created;
  }

  async findByEmail(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findByIds(ids: string[]) {
    return this.userModel.find({ _id: { $in: ids } }).exec();
  }

  async findIdentityById(id: string) {
    return this.userModel.findById(id).select('+passwordHash').exec();
  }

  async findIdentityByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByKeycloakSubject(keycloakSubject: string) {
    return this.userModel.findOne({ keycloakSubject }).exec();
  }

  async createKeycloakUser(input: {
    keycloakSubject: string;
    email: string;
    displayName: string;
  }) {
    const now = new Date();
    const created = await this.userModel.create({
      keycloakSubject: input.keycloakSubject,
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      role: Role.RESIDENT,
      neighborhoodId: '',
      passwordHash: null,
      identityProvider: IdentityProvider.KEYCLOAK,
      identityMigrationStatus: IdentityMigrationStatus.KEYCLOAK_ONLY,
      emailVerified: true,
      identityLinkedAt: now,
      lastIdentitySyncAt: now,
      onboardingCompleted: false,
      isActive: true,
      pointsBalance: 100,
      reservedPoints: 0,
    });

    this.queueUserProjection(created.id);
    return created;
  }

  async markIdentityLinkRequired(userId: string) {
    await this.userModel
      .updateOne(
        {
          _id: userId,
          identityProvider: { $ne: IdentityProvider.LINKED },
        },
        {
          $set: {
            identityMigrationStatus: IdentityMigrationStatus.LINK_REQUIRED,
          },
        },
      )
      .exec();
  }

  async touchIdentitySync(userId: string, emailVerified: boolean) {
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          $set: {
            emailVerified,
            lastIdentitySyncAt: new Date(),
          },
        },
      )
      .exec();
  }

  async linkKeycloakIdentity(input: {
    userId: string;
    keycloakSubject: string;
    emailVerified: boolean;
  }) {
    const linked = await this.userModel
      .findOneAndUpdate(
        {
          _id: input.userId,
          $or: [
            { keycloakSubject: null },
            { keycloakSubject: { $exists: false } },
          ],
        },
        {
          $set: {
            keycloakSubject: input.keycloakSubject,
            identityProvider: IdentityProvider.LINKED,
            identityMigrationStatus: IdentityMigrationStatus.LINKED,
            emailVerified: input.emailVerified,
            identityLinkedAt: new Date(),
            lastIdentitySyncAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      )
      .exec();

    if (linked) this.queueUserProjection(linked.id);
    return linked;
  }

  async listIdentitySummaries(input: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const filter: Record<string, unknown> = {};
    const search = input.search?.trim();
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { email: { $regex: escaped, $options: 'i' } },
        { displayName: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (input.page - 1) * input.limit;
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(input.limit)
        .select(
          'email displayName role isActive identityProvider identityMigrationStatus emailVerified keycloakSubject identityLinkedAt lastIdentitySyncAt createdAt updatedAt',
        )
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      items: users.map((user) => this.toIdentitySummary(user)),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        pages: Math.max(1, Math.ceil(total / input.limit)),
      },
    };
  }

  async getIdentitySummary(userId: string) {
    const user = await this.findIdentityRecord(userId);
    return this.toIdentitySummary(user);
  }

  async getKeycloakSubject(userId: string) {
    const user = await this.findIdentityRecord(userId);
    return user.keycloakSubject ?? null;
  }

  async requireKeycloakSubject(userId: string) {
    const subject = await this.getKeycloakSubject(userId);
    if (!subject) {
      throw new ConflictException('Ce compte n’est pas lié à Keycloak.');
    }
    return subject;
  }

  private async findIdentityRecord(userId: string) {
    if (!isValidObjectId(userId)) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return user;
  }

  private toIdentitySummary(user: UserDocument) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      identityProvider: user.identityProvider,
      identityMigrationStatus: user.identityMigrationStatus,
      emailVerified: user.emailVerified,
      keycloakLinked: Boolean(user.keycloakSubject),
      identityLinkedAt: user.identityLinkedAt ?? null,
      lastIdentitySyncAt: user.lastIdentitySyncAt ?? null,
      createdAt: this.safeDate(user.get('createdAt')),
      updatedAt: this.safeDate(user.get('updatedAt')),
    };
  }

  private safeDate(value: unknown) {
    return value instanceof Date ? value : null;
  }

  async findByNeighborhood(neighborhoodId: string, excludeUserId: string) {
    return this.userModel
      .find({
        neighborhoodId,
        isActive: true,
        _id: { $ne: excludeUserId },
      })
      .sort({ displayName: 1 })
      .exec();
  }

  toPublicUser(user: UserDocument) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      neighborhoodId: user.neighborhoodId,
      isActive: user.isActive,
      pointsBalance: user.pointsBalance,
      reservedPoints: user.reservedPoints,
      identityProvider: user.identityProvider,
      emailVerified: user.emailVerified,
      identityLinkedAt: user.identityLinkedAt,
      onboardingCompleted: user.onboardingCompleted,
    };
  }

  private queueUserProjection(userId: string) {
    void this.graphSyncService?.enqueue(GraphEntityType.USER, userId);
  }
}
