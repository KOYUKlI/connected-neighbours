import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PasswordService } from '../auth/password.service';
import {
  IdentityMigrationStatus,
  IdentityProvider,
  NeighborhoodAssignmentSource,
  ProfileVisibility,
  User,
  UserDocument,
} from '../auth/schemas/user.schema';
import {
  DemoKeycloakIdentity,
  DemoKeycloakService,
} from './demo-keycloak.service';
import {
  DemoIdentity,
  DEMO_IDENTITIES,
  DEMO_SEED_SOURCE,
  identityProviderFor,
  migrationStatusFor,
  usesKeycloak,
  usesLocalPassword,
} from './demo-seed.manifest';
import { DemoSeedService } from './demo-seed.service';
import {
  DemoSeedRecord,
  DemoSeedRecordDocument,
} from './schemas/demo-seed-record.schema';

export type DemoSeedScope = 'all' | 'mongodb' | 'keycloak' | 'minio' | 'graph';

type SeededUser = {
  identity: DemoIdentity;
  user: UserDocument;
};

@Injectable()
export class DemoSeedOrchestrator {
  private readonly logger = new Logger(DemoSeedOrchestrator.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(DemoSeedRecord.name)
    private readonly seedRecordModel: Model<DemoSeedRecordDocument>,
    private readonly passwordService: PasswordService,
    private readonly keycloakService: DemoKeycloakService,
    private readonly businessSeed: DemoSeedService,
  ) {}

  async run(scope: DemoSeedScope = 'all') {
    this.assertNonProduction();
    const startedAt = Date.now();
    const passwords = this.readPasswords();

    let mongoUsers: SeededUser[] = [];
    let keycloakIdentities: DemoKeycloakIdentity[] = [];

    if (scope === 'all' || scope === 'mongodb' || scope === 'keycloak') {
      mongoUsers = await this.synchronizeMongoIdentities(passwords);
    }
    if (scope === 'all' || scope === 'keycloak') {
      keycloakIdentities = await this.keycloakService.synchronize(passwords);
      await this.applyExplicitIdentityLinks(mongoUsers, keycloakIdentities);
    }
    if (scope === 'all') {
      await this.businessSeed.seedBusinessData();
      await this.businessSeed.seedStorageFixtures();
      await this.businessSeed.reconcileGraph();
    } else {
      if (scope === 'minio') {
        await this.businessSeed.seedStorageFixtures();
      }
      if (scope === 'graph') {
        await this.businessSeed.reconcileGraph();
      }
    }

    const status = await this.status();
    this.logger.log(
      `Seed ${scope} terminé en ${Date.now() - startedAt} ms: ` +
        `${status.mongodb.users} utilisateurs MongoDB, ` +
        `${status.keycloak.identities} identités Keycloak.`,
    );
    return status;
  }

  async status() {
    const [users, records, keycloak] = await Promise.all([
      this.userModel
        .find({ email: { $in: DEMO_IDENTITIES.map((item) => item.email) } })
        .select(
          'email displayName role identityProvider identityMigrationStatus emailVerified keycloakSubject isActive',
        )
        .lean<
          Array<{
            _id: unknown;
            email: string;
            displayName: string;
            role: string;
            identityProvider: string;
            identityMigrationStatus: string;
            emailVerified: boolean;
            keycloakSubject: string | null;
            isActive: boolean;
          }>
        >()
        .exec(),
      this.seedRecordModel
        .aggregate<{
          _id: string;
          count: number;
        }>([
          { $match: { seedSource: DEMO_SEED_SOURCE } },
          { $group: { _id: '$entityType', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ])
        .exec(),
      this.safeKeycloakStatus(),
    ]);
    const userByEmail = new Map(users.map((user) => [user.email, user]));
    const keycloakByKey = new Map(
      keycloak.map((identity) => [identity.seedKey, identity]),
    );

    const business = await this.businessSeed.status();
    return {
      services: {
        mongodb: 'available' as const,
        keycloak: this.keycloakService.isEnabled
          ? ('available' as const)
          : ('disabled' as const),
        minio: business.storage.status,
        graph: business.graph.status,
      },
      mongodb: {
        users: users.length,
        records: Object.fromEntries(
          records.map((record) => [record._id, record.count]),
        ),
      },
      keycloak: {
        enabled: this.keycloakService.isEnabled,
        identities: keycloak.length,
      },
      business,
      accounts: DEMO_IDENTITIES.map((identity) => {
        const user = userByEmail.get(identity.email);
        const keycloakIdentity = keycloakByKey.get(identity.seedKey);
        return {
          seedKey: identity.seedKey,
          displayName: identity.displayName,
          email: identity.email,
          role: identity.role,
          identityMode: identity.mode,
          localLogin: usesLocalPassword(identity),
          keycloakLogin: usesKeycloak(identity),
          emailVerified:
            keycloakIdentity?.emailVerified ??
            user?.emailVerified ??
            identity.emailVerified,
          linked: Boolean(user?.keycloakSubject),
          active: user?.isActive ?? identity.isActive,
          mfaInitialAction:
            keycloakIdentity?.requiredActions.includes('CONFIGURE_TOTP') ??
            identity.requiredActions.includes('CONFIGURE_TOTP'),
          passwordVariable:
            identity.passwordVariable ??
            identity.keycloakPasswordVariable ??
            null,
        };
      }),
    };
  }

  async reset(confirm: string | undefined) {
    this.assertNonProduction();
    if (confirm !== 'CONNECTED_NEIGHBOURS_DEMO') {
      throw new ConflictException(
        'SEED_CONFIRM_RESET=CONNECTED_NEIGHBOURS_DEMO est requis.',
      );
    }

    const records = await this.seedRecordModel
      .find({ seedSource: DEMO_SEED_SOURCE })
      .select('entityType entityId')
      .lean<Array<{ entityType: string; entityId: string }>>()
      .exec();
    const userRecords = records.filter(
      (record) => record.entityType === 'user',
    );
    const userIds = userRecords.map((record) => record.entityId);
    await this.businessSeed.resetOwnedData(
      records.filter((record) => record.entityType !== 'user'),
    );
    const keycloak = await this.keycloakService.removeManifestIdentities();
    const users =
      userIds.length > 0
        ? await this.userModel.deleteMany({ _id: { $in: userIds } }).exec()
        : { deletedCount: 0 };
    await this.seedRecordModel
      .deleteMany({ seedSource: DEMO_SEED_SOURCE })
      .exec();

    this.logger.warn(
      `Reset démo borné: ${users.deletedCount} utilisateurs MongoDB, ` +
        `${keycloak.removed} identités Keycloak.`,
    );
    return this.run('all');
  }

  private async synchronizeMongoIdentities(
    passwords: ReadonlyMap<string, string>,
  ) {
    const result: SeededUser[] = [];
    for (const identity of DEMO_IDENTITIES) {
      const user = await this.upsertMongoIdentity(identity, passwords);
      await this.mark('user', user.id, identity.seedKey, {
        email: identity.email,
      });
      result.push({ identity, user });
    }
    return result;
  }

  private async upsertMongoIdentity(
    identity: DemoIdentity,
    passwords: ReadonlyMap<string, string>,
  ) {
    const existing = await this.userModel
      .findOne({ email: identity.email })
      .select('+passwordHash')
      .exec();
    const passwordHash = identity.passwordVariable
      ? await this.passwordService.hash(
          this.requirePassword(passwords, identity.passwordVariable),
        )
      : null;
    const now = new Date();
    const identityProvider =
      identity.mode === 'linked'
        ? existing?.keycloakSubject
          ? IdentityProvider.LINKED
          : IdentityProvider.LOCAL
        : identityProviderFor(identity);
    const migrationStatus =
      identity.mode === 'linked' && !existing?.keycloakSubject
        ? IdentityMigrationStatus.LOCAL_ONLY
        : migrationStatusFor(identity);
    const isPublic = identity.profileVisibility !== ProfileVisibility.PRIVATE;
    const patch = {
      displayName: identity.displayName,
      role: identity.role,
      neighborhoodId: identity.neighborhoodSlug,
      passwordHash,
      identityProvider,
      identityMigrationStatus: migrationStatus,
      emailVerified: identity.emailVerified,
      onboardingCompleted: identity.onboardingCompleted,
      isActive: identity.isActive,
      bio: identity.bio,
      interests: identity.interests,
      profileVisibility: identity.profileVisibility,
      showNeighborhood: isPublic,
      showReviews: isPublic,
      showCompletedServices: isPublic,
      showReputation: isPublic,
      neighborhoodAssignedAt: existing?.neighborhoodAssignedAt ?? now,
      neighborhoodAssignmentSource: NeighborhoodAssignmentSource.SEED,
      neighborhoodAssignmentActorId: DEMO_SEED_SOURCE,
    };

    if (existing) {
      existing.set(patch);
      if (!existing.neighborhoodAssignmentHistory?.length) {
        existing.neighborhoodAssignmentHistory = [
          {
            previousNeighborhoodId: null,
            neighborhoodId: identity.neighborhoodSlug,
            source: NeighborhoodAssignmentSource.SEED,
            actorId: DEMO_SEED_SOURCE,
            reason: 'Rattachement déterministe du seed de démonstration.',
            occurredAt: now,
          },
        ];
      }
      return existing.save();
    }

    return this.userModel.create({
      email: identity.email,
      ...patch,
      pointsBalance: identity.pointsBalance,
      reservedPoints: 0,
      keycloakSubject: null,
      identityLinkedAt: null,
      lastIdentitySyncAt: null,
      neighborhoodAssignmentHistory: [
        {
          previousNeighborhoodId: null,
          neighborhoodId: identity.neighborhoodSlug,
          source: NeighborhoodAssignmentSource.SEED,
          actorId: DEMO_SEED_SOURCE,
          reason: 'Rattachement déterministe du seed de démonstration.',
          occurredAt: now,
        },
      ],
    });
  }

  private async applyExplicitIdentityLinks(
    mongoUsers: SeededUser[],
    keycloakIdentities: DemoKeycloakIdentity[],
  ) {
    const keycloakByKey = new Map(
      keycloakIdentities.map((identity) => [identity.seedKey, identity]),
    );
    for (const { identity, user } of mongoUsers) {
      const keycloak = keycloakByKey.get(identity.seedKey);
      if (!keycloak) continue;
      if (identity.mode === 'link_required') {
        await this.userModel
          .updateOne(
            { _id: user.id },
            {
              $set: {
                keycloakSubject: null,
                identityProvider: IdentityProvider.LOCAL,
                identityMigrationStatus: IdentityMigrationStatus.LINK_REQUIRED,
                emailVerified: identity.emailVerified,
              },
            },
          )
          .exec();
        continue;
      }
      if (identity.mode === 'local_only') continue;

      const subjectOwner = await this.userModel
        .findOne({
          keycloakSubject: keycloak.subject,
          _id: { $ne: user.id },
        })
        .select('_id email')
        .lean<{ _id: unknown; email: string } | null>()
        .exec();
      if (subjectOwner) {
        throw new ConflictException(
          `Le subject Keycloak de ${identity.seedKey} appartient déjà à un autre compte.`,
        );
      }

      await this.userModel
        .updateOne(
          { _id: user.id, email: identity.email },
          {
            $set: {
              keycloakSubject: keycloak.subject,
              identityProvider:
                identity.mode === 'keycloak_only'
                  ? IdentityProvider.KEYCLOAK
                  : IdentityProvider.LINKED,
              identityMigrationStatus:
                identity.mode === 'keycloak_only'
                  ? IdentityMigrationStatus.KEYCLOAK_ONLY
                  : IdentityMigrationStatus.LINKED,
              emailVerified: keycloak.emailVerified,
              identityLinkedAt: new Date(),
              lastIdentitySyncAt: new Date(),
            },
          },
        )
        .exec();
    }
  }

  private readPasswords() {
    const variables = [
      'SEED_DEMO_RESIDENT_PASSWORD',
      'SEED_DEMO_ADMIN_PASSWORD',
      'SEED_DEMO_MODERATOR_PASSWORD',
      'SEED_DEMO_LEGACY_PASSWORD',
    ] as const;
    const values = new Map<string, string>();
    for (const variable of variables) {
      const value = process.env[variable]?.trim();
      if (!value) {
        throw new ConflictException(`Variable ${variable} manquante.`);
      }
      values.set(variable, value);
    }
    return values;
  }

  private requirePassword(
    passwords: ReadonlyMap<string, string>,
    variable: string,
  ) {
    const password = passwords.get(variable);
    if (!password) {
      throw new ConflictException(`Variable ${variable} manquante.`);
    }
    return password;
  }

  private mark(
    entityType: string,
    entityId: string,
    seedKey: string,
    metadata: Record<string, string | number | boolean | null> = {},
  ) {
    return this.seedRecordModel
      .findOneAndUpdate(
        { seedSource: DEMO_SEED_SOURCE, seedKey },
        {
          $set: {
            entityType,
            entityId,
            metadata,
          },
          $setOnInsert: { seedSource: DEMO_SEED_SOURCE, seedKey },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
  }

  private async safeKeycloakStatus() {
    if (!this.keycloakService.isEnabled) return [];
    try {
      return await this.keycloakService.status();
    } catch {
      this.logger.warn(
        'Keycloak est indisponible; le statut MongoDB reste consultable.',
      );
      return [];
    }
  }
  private assertNonProduction() {
    if (process.env.NODE_ENV === 'production') {
      throw new ConflictException(
        'Le seed de démonstration est interdit en production.',
      );
    }
  }
}
