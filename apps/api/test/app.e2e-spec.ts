import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Connection } from 'mongoose';
import request from 'supertest';

import { AppModule } from './../src/app.module';
import { Role } from './../src/auth/role.enum';
import { UsersService } from './../src/auth/users.service';

const DEMO_USERS = [
  {
    email: 'admin@connected-neighbours.local',
    displayName: 'Admin Demo',
    role: Role.ADMIN,
    neighborhoodId: 'quartier-centre',
    password: 'admin123',
  },
  {
    email: 'alice@connected-neighbours.local',
    displayName: 'Alice Martin',
    role: Role.RESIDENT,
    neighborhoodId: 'quartier-centre',
    password: 'alice123',
  },
  {
    email: 'bob@connected-neighbours.local',
    displayName: 'Bob Dupont',
    role: Role.RESIDENT,
    neighborhoodId: 'quartier-centre',
    password: 'bob123',
  },
] as const;

describe('Connected Neighbours API P0 (e2e)', () => {
  let app: NestFastifyApplication;
  let connection: Connection;

  let adminToken: string;
  let aliceToken: string;
  let bobToken: string;

  let aliceId: string;
  let bobId: string;
  let serviceId: string;
  let applicationId: string;
  let contractId: string;
  let incidentId: string;
  let alertId: string;

  beforeAll(async () => {
    configureTestEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    connection = app.get<Connection>(getConnectionToken());

    await cleanE2eData(true);
    await seedDemoUsers(app.get(UsersService));
  });

  afterAll(async () => {
    await cleanE2eData(false);
    await app.close();
  });

  it('checks health', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          status: 'ok',
          service: 'connected-neighbours-api',
        });
      });
  });

  it('logs in demo users and gets JWT tokens', async () => {
    const admin = await login(DEMO_USERS[0].email, DEMO_USERS[0].password);
    const alice = await login(DEMO_USERS[1].email, DEMO_USERS[1].password);
    const bob = await login(DEMO_USERS[2].email, DEMO_USERS[2].password);

    adminToken = admin.accessToken;
    aliceToken = alice.accessToken;
    bobToken = bob.accessToken;
    aliceId = alice.user.id;
    bobId = bob.user.id;

    expect(admin.user.role).toBe(Role.ADMIN);
    expect(alice.user.pointsBalance).toBeGreaterThanOrEqual(100);
    expect(bob.user.pointsBalance).toBeGreaterThanOrEqual(100);
  });

  it('covers services, applications, contracts and points', async () => {
    const serviceResponse = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Aide bricolage',
        description: 'Alice cherche une aide pour monter une etagere.',
        type: 'request',
        category: 'bricolage',
        availability: 'Samedi matin',
        neighborhoodId: 'quartier-centre',
        isPaid: true,
        pricePoints: 30,
        status: 'published',
      })
      .expect(201);

    serviceId = getId(serviceResponse.body);
    expect(serviceResponse.body.status).toBe('published');

    const applicationResponse = await request(app.getHttpServer())
      .post(`/api/services/${serviceId}/applications`)
      .set('Authorization', bearer(bobToken))
      .send({
        message: 'E2E candidature Bob',
        proposedPricePoints: 25,
      })
      .expect(201);

    applicationId = getId(applicationResponse.body);
    expect(applicationResponse.body.status).toBe('submitted');

    const acceptedApplicationResponse = await request(app.getHttpServer())
      .post(`/api/applications/${applicationId}/accept`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    expect(acceptedApplicationResponse.body.status).toBe('accepted');

    const contractResponse = await request(app.getHttpServer())
      .post(`/api/contracts/from-application/${applicationId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    contractId = getId(contractResponse.body.contract);
    expect(contractResponse.body.contract).toEqual(
      expect.objectContaining({
        applicationId,
        serviceId,
        requesterId: aliceId,
        providerId: bobId,
        payerId: aliceId,
        receiverId: bobId,
        pricePoints: 25,
        status: 'sent',
      }),
    );
    expect(contractResponse.body.service.status).toBe('awaiting_signatures');

    const aliceAfterReservation = await getMe(aliceToken);
    expect(aliceAfterReservation.pointsBalance).toBe(75);
    expect(aliceAfterReservation.reservedPoints).toBe(25);

    const aliceSignedContract = await request(app.getHttpServer())
      .post(`/api/contracts/${contractId}/sign`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    expect(aliceSignedContract.body.signedByIds).toContain(aliceId);
    expect(aliceSignedContract.body.status).toBe('sent');

    const activeContract = await request(app.getHttpServer())
      .post(`/api/contracts/${contractId}/sign`)
      .set('Authorization', bearer(bobToken))
      .expect(201);

    expect(activeContract.body.status).toBe('active');
    expect(activeContract.body.signedByIds).toEqual(
      expect.arrayContaining([aliceId, bobId]),
    );

    const completedContract = await request(app.getHttpServer())
      .post(`/api/contracts/${contractId}/complete`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    expect(completedContract.body.status).toBe('completed');

    const completedService = await request(app.getHttpServer())
      .get(`/api/services/${serviceId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(200);

    expect(completedService.body.status).toBe('completed');

    const aliceAfterTransfer = await getMe(aliceToken);
    const bobAfterTransfer = await getMe(bobToken);
    expect(aliceAfterTransfer.pointsBalance).toBe(75);
    expect(aliceAfterTransfer.reservedPoints).toBe(0);
    expect(bobAfterTransfer.pointsBalance).toBe(125);
  });

  it('covers incidents and alerts', async () => {
    const incidentResponse = await request(app.getHttpServer())
      .post('/api/incidents')
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Local velo force',
        description: 'La porte du local velo semble avoir ete forcee.',
        type: 'security',
        severity: 'high',
        neighborhoodId: 'quartier-centre',
      })
      .expect(201);

    incidentId = getId(incidentResponse.body);
    expect(incidentResponse.body.status).toBe('reported');

    const resolvedIncident = await request(app.getHttpServer())
      .post(`/api/incidents/${incidentId}/resolve`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    expect(resolvedIncident.body.status).toBe('resolved');

    const alertResponse = await request(app.getHttpServer())
      .post(`/api/incidents/${incidentId}/alerts`)
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Alerte securite',
        details: 'Surveiller le local velo.',
        severity: 'high',
      })
      .expect(201);

    alertId = getId(alertResponse.body);
    expect(alertResponse.body.status).toBe('created');

    const resolvedAlert = await request(app.getHttpServer())
      .post(`/api/alerts/${alertId}/resolve`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    expect(resolvedAlert.body.status).toBe('resolved');
    expect(resolvedAlert.body.resolvedAt).toBeTruthy();
  });

  it('covers JavaFX sync push idempotence and pull', async () => {
    const payload = {
      clientId: 'e2e-javafx-client',
      operations: [
        {
          operationId: 'e2e-sync-op-incident-1',
          entityType: 'incident',
          operationType: 'create',
          payload: {
            title: 'E2E Incident JavaFX',
            description: 'Incident cree hors ligne depuis JavaFX.',
            type: 'maintenance',
            severity: 'medium',
            neighborhoodId: 'quartier-centre',
            externalId: 'e2e-javafx-incident-1',
          },
        },
      ],
    };

    const firstPush = await request(app.getHttpServer())
      .post('/api/sync/push')
      .set('Authorization', bearer(bobToken))
      .send(payload)
      .expect(201);

    expect(firstPush.body.acceptedOperations).toHaveLength(1);
    expect(firstPush.body.rejectedOperations).toHaveLength(0);

    const secondPush = await request(app.getHttpServer())
      .post('/api/sync/push')
      .set('Authorization', bearer(bobToken))
      .send(payload)
      .expect(201);

    expect(secondPush.body.acceptedOperations).toHaveLength(1);
    expect(secondPush.body.acceptedOperations[0].operationId).toBe(
      'e2e-sync-op-incident-1',
    );

    const pull = await request(app.getHttpServer())
      .get('/api/sync/pull')
      .query({ clientId: 'e2e-javafx-client' })
      .set('Authorization', bearer(bobToken))
      .expect(200);

    expect(pull.body.serverTime).toBeTruthy();
    expect(pull.body.incidents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'E2E Incident JavaFX',
          source: 'javafx',
          externalId: 'e2e-javafx-incident-1',
        }),
      ]),
    );
  });

  it('covers the Jison DSL read-only endpoints', async () => {
    const parsed = await request(app.getHttpServer())
      .post('/api/dsl/parse')
      .set('Authorization', bearer(adminToken))
      .send({
        query: 'FIND services WHERE category = "bricolage"',
      })
      .expect(201);

    expect(parsed.body).toEqual(
      expect.objectContaining({
        type: 'find',
        collection: 'services',
        limit: 20,
      }),
    );

    const executed = await request(app.getHttpServer())
      .post('/api/dsl/execute')
      .set('Authorization', bearer(adminToken))
      .send({
        query: 'FIND services WHERE category = "bricolage"',
      })
      .expect(201);

    expect(executed.body.collection).toBe('services');
    expect(executed.body.filter).toEqual({ category: 'bricolage' });
    expect(executed.body.results.length).toBeGreaterThanOrEqual(1);

    await request(app.getHttpServer())
      .post('/api/dsl/parse')
      .set('Authorization', bearer(adminToken))
      .send({ query: 'DELETE services' })
      .expect(400);
  });

  it('covers admin dashboard endpoints without exposing password hashes', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.totalServices).toBeGreaterThanOrEqual(1);
        expect(body.totalContracts).toBeGreaterThanOrEqual(1);
        expect(body.serverTime).toBeTruthy();
      });

    await request(app.getHttpServer())
      .get('/api/admin/services')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: 'E2E Aide bricolage' }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/admin/contracts')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: contractId,
              status: 'completed',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/admin/incidents')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: 'E2E Local velo force' }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/admin/sync/status')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ clientId: 'e2e-javafx-client' }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.length).toBeGreaterThanOrEqual(3);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              email: 'admin@connected-neighbours.local',
              role: Role.ADMIN,
            }),
            expect.objectContaining({
              email: 'alice@connected-neighbours.local',
              role: Role.RESIDENT,
            }),
            expect.objectContaining({
              email: 'bob@connected-neighbours.local',
              role: Role.RESIDENT,
            }),
          ]),
        );
        for (const user of body as Array<Record<string, unknown>>) {
          expect(user).not.toHaveProperty('passwordHash');
        }
      });
  });

  async function login(email: string, password: string) {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe(email);

    return response.body as {
      accessToken: string;
      user: {
        id: string;
        email: string;
        role: Role;
        pointsBalance: number;
        reservedPoints: number;
      };
    };
  }

  async function getMe(token: string) {
    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', bearer(token))
      .expect(200);

    return response.body as {
      pointsBalance: number;
      reservedPoints: number;
    };
  }

  async function cleanE2eData(includeUsers: boolean) {
    const operations = [
      connection
        .collection('services')
        .deleteMany({ title: { $in: ['E2E Aide bricolage'] } }),
      connection
        .collection('serviceapplications')
        .deleteMany({ message: 'E2E candidature Bob' }),
      connection
        .collection('contracts')
        .deleteMany({ serviceId: serviceId ?? '__missing__' }),
      connection
        .collection('incidents')
        .deleteMany({
          title: { $in: ['E2E Local velo force', 'E2E Incident JavaFX'] },
        }),
      connection
        .collection('alerts')
        .deleteMany({ title: 'E2E Alerte securite' }),
      connection
        .collection('syncoperations')
        .deleteMany({ operationId: 'e2e-sync-op-incident-1' }),
      connection
        .collection('syncstates')
        .deleteMany({ clientId: 'e2e-javafx-client' }),
      connection
        .collection('pointtransactions')
        .deleteMany({ serviceId: serviceId ?? '__missing__' }),
    ];

    if (includeUsers) {
      operations.push(
        connection.collection('users').deleteMany({
          email: { $in: DEMO_USERS.map((user) => user.email) },
        }),
      );
    }

    await Promise.all(operations);
  }
});

function configureTestEnvironment() {
  process.env.NODE_ENV = 'test';
  process.env.HOST = process.env.HOST ?? '127.0.0.1';
  process.env.PORT = process.env.PORT ?? '0';
  process.env.CORS_ORIGIN =
    process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  process.env.COOKIE_SECRET =
    process.env.COOKIE_SECRET ?? 'test-cookie-secret';
  process.env.MONGODB_URI =
    process.env.MONGODB_URI ??
    'mongodb://127.0.0.1:27017/connected-neighbours-e2e';
  process.env.NEO4J_URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687';
  process.env.NEO4J_USERNAME = process.env.NEO4J_USERNAME ?? 'neo4j';
  process.env.NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? 'password';
  process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'localhost';
  process.env.MINIO_PORT = process.env.MINIO_PORT ?? '9000';
  process.env.MINIO_USE_SSL = process.env.MINIO_USE_SSL ?? 'false';
  process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
  process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'minioadmin';
  process.env.MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'connected-neighbours';
  process.env.KEYCLOAK_BASE_URL =
    process.env.KEYCLOAK_BASE_URL ?? 'http://localhost:8080';
  process.env.KEYCLOAK_REALM = process.env.KEYCLOAK_REALM ?? 'connected';
  process.env.KEYCLOAK_CLIENT_ID =
    process.env.KEYCLOAK_CLIENT_ID ?? 'connected-api';
  process.env.KEYCLOAK_CLIENT_SECRET =
    process.env.KEYCLOAK_CLIENT_SECRET ?? 'secret';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ?? 'test-jwt-secret-with-enough-length';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
  process.env.DEV_AUTH_SEED = 'true';
}

async function seedDemoUsers(usersService: UsersService) {
  for (const user of DEMO_USERS) {
    await usersService.ensureDevUser(user);
  }
}

function bearer(token: string) {
  return `Bearer ${token}`;
}

function getId(document: { id?: string; _id?: string }) {
  const id = document.id ?? document._id;

  if (!id) {
    throw new Error('Document id is missing');
  }

  return String(id);
}
