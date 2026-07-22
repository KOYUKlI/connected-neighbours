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
import { StorageService } from './../src/storage/storage.service';

jest.setTimeout(60000);

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
  {
    email: 'moderator@connected-neighbours.local',
    displayName: 'Moderation Demo',
    role: Role.MODERATOR,
    neighborhoodId: 'quartier-centre',
    password: 'moderator123',
  },
  {
    email: 'claire@connected-neighbours.local',
    displayName: 'Claire Bernard',
    role: Role.RESIDENT,
    neighborhoodId: 'quartier-centre',
    password: 'claire123',
  },
  {
    email: 'nadia@connected-neighbours.local',
    displayName: 'Nadia Petit',
    role: Role.RESIDENT,
    neighborhoodId: 'quartier-centre',
    password: 'nadia123',
  },
  {
    email: 'outside@connected-neighbours.local',
    displayName: 'Camille Extérieur',
    role: Role.RESIDENT,
    neighborhoodId: 'quartier-exterieur',
    password: 'outside123',
  },
] as const;

describe('Connected Neighbours API P0 (e2e)', () => {
  let app: NestFastifyApplication;
  let connection: Connection;
  let storageService: StorageService;

  let adminToken: string;
  let aliceToken: string;
  let bobToken: string;
  let moderatorToken: string;
  let claireToken: string;
  let nadiaToken: string;
  let outsideToken: string;

  let aliceId: string;
  let bobId: string;
  let claireId: string;
  let e2eNeighborhoodId: string;
  let draftServiceId: string;
  let serviceId: string;
  let applicationId: string;
  let contractId: string;
  let cancellableServiceId: string;
  let cancellableContractId: string;
  let disputeServiceId: string;
  let disputeContractId: string;
  let disputeId: string;
  let incidentId: string;
  let alertId: string;
  let localEventId: string;
  let localVoteId: string;

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
    storageService = app.get(StorageService);

    await cleanE2eData(true);
    await seedDemoUsers(app.get(UsersService));
  });

  afterAll(async () => {
    await cleanE2eData(false);
    await app?.close();
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
    const moderator = await login(DEMO_USERS[3].email, DEMO_USERS[3].password);
    const claire = await login(DEMO_USERS[4].email, DEMO_USERS[4].password);
    const nadia = await login(DEMO_USERS[5].email, DEMO_USERS[5].password);
    const outside = await login(DEMO_USERS[6].email, DEMO_USERS[6].password);

    adminToken = admin.accessToken;
    aliceToken = alice.accessToken;
    bobToken = bob.accessToken;
    moderatorToken = moderator.accessToken;
    claireToken = claire.accessToken;
    nadiaToken = nadia.accessToken;
    outsideToken = outside.accessToken;
    aliceId = alice.user.id;
    bobId = bob.user.id;
    claireId = claire.user.id;

    expect(admin.user.role).toBe(Role.ADMIN);
    expect(moderator.user.role).toBe(Role.MODERATOR);
    expect(alice.user.pointsBalance).toBeGreaterThanOrEqual(100);
    expect(bob.user.pointsBalance).toBeGreaterThanOrEqual(100);
  });

  it('keeps recommendations available through the MongoDB fallback', async () => {
    const recommendations = await request(app.getHttpServer())
      .get('/api/recommendations/neighbors?limit=5')
      .set('Authorization', bearer(aliceToken))
      .expect(200);

    expect(recommendations.body.source).toBe('fallback');
    expect(Array.isArray(recommendations.body.items)).toBe(true);
    expect(
      recommendations.body.items.every(
        (item: Record<string, unknown>) => !('score' in item),
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .get('/api/admin/graph/status')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.health.state).toBe('disabled');
        expect(body.mode).toBe('disabled');
      });
  });

  it('covers geographic neighborhoods', async () => {
    const invalidNeighborhood = neighborhoodPayload('e2e-quartier-invalide');
    invalidNeighborhood.geometry.coordinates[0][4] = [2.36, 48.861];

    await request(app.getHttpServer())
      .post('/api/admin/neighborhoods')
      .set('Authorization', bearer(adminToken))
      .send(invalidNeighborhood)
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/admin/neighborhoods')
      .set('Authorization', bearer(aliceToken))
      .send(neighborhoodPayload('e2e-quartier'))
      .expect(403);

    const createdNeighborhood = await request(app.getHttpServer())
      .post('/api/admin/neighborhoods')
      .set('Authorization', bearer(adminToken))
      .send(neighborhoodPayload('e2e-quartier'));

    if (createdNeighborhood.status !== 201) {
      throw new Error(
        `Création du quartier E2E refusée (${createdNeighborhood.status}): ${JSON.stringify(createdNeighborhood.body)}`,
      );
    }

    e2eNeighborhoodId = getId(createdNeighborhood.body);
    expect(createdNeighborhood.body.status).toBe('active');

    await request(app.getHttpServer())
      .post('/api/admin/neighborhoods')
      .set('Authorization', bearer(adminToken))
      .send(neighborhoodPayload('e2e-quartier'))
      .expect(409);

    const overlap = neighborhoodPayload('e2e-quartier-overlap');
    overlap.geometry.coordinates = overlap.geometry.coordinates.map((ring) =>
      ring.map(([longitude, latitude]) => [
        longitude + 0.0002,
        latitude + 0.0002,
      ]),
    );
    await request(app.getHttpServer())
      .post('/api/admin/neighborhoods')
      .set('Authorization', bearer(adminToken))
      .send(overlap)
      .expect(409);

    await request(app.getHttpServer())
      .get('/api/admin/neighborhoods')
      .set('Authorization', bearer(adminToken))
      .query({ status: 'active', search: 'E2E', page: 1, limit: 10 })
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ slug: 'e2e-quartier' }),
          ]),
        );
        expect(body.total).toBeGreaterThanOrEqual(1);
      });

    await request(app.getHttpServer())
      .get('/api/neighborhoods')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ slug: 'e2e-quartier' }),
          ]),
        );
      });

    const updatedNeighborhood = await request(app.getHttpServer())
      .patch(`/api/admin/neighborhoods/${e2eNeighborhoodId}`)
      .set('Authorization', bearer(adminToken))
      .send({ description: 'Quartier E2E mis a jour' })
      .expect(200);

    expect(updatedNeighborhood.body.description).toBe(
      'Quartier E2E mis a jour',
    );

    await request(app.getHttpServer())
      .post(`/api/neighborhoods/${e2eNeighborhoodId}/contains-point`)
      .set('Authorization', bearer(aliceToken))
      .send({ point: [120.0009, -19.9991] })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/neighborhoods/${e2eNeighborhoodId}/contains-point`)
      .set('Authorization', bearer(adminToken))
      .send({ point: [120.0009, -19.9991] })
      .expect(201)
      .expect(({ body }) => {
        expect(body.contains).toBe(true);
      });

    await request(app.getHttpServer())
      .post(`/api/neighborhoods/${e2eNeighborhoodId}/contains-point`)
      .set('Authorization', bearer(adminToken))
      .send({ point: [2.5, 48.8569] })
      .expect(201)
      .expect(({ body }) => {
        expect(body.contains).toBe(false);
      });

    await request(app.getHttpServer())
      .get('/api/admin/neighborhoods/quartier-centre/members')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              email: 'alice@connected-neighbours.local',
            }),
          ]),
        );
        for (const member of body.items as Array<Record<string, unknown>>) {
          expect(member).not.toHaveProperty('passwordHash');
        }
      });

    await request(app.getHttpServer())
      .get('/api/admin/neighborhoods/quartier-centre/stats')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            slug: 'quartier-centre',
            users: expect.any(Number),
            services: expect.any(Number),
            incidents: expect.any(Number),
            events: expect.any(Number),
            votes: expect.any(Number),
          }),
        );
      });

    await request(app.getHttpServer())
      .post('/api/neighborhoods/resolve')
      .set('Authorization', bearer(aliceToken))
      .send({ type: 'Point', coordinates: [120.00091, -19.99909] })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('found');
        expect(body.neighborhood.slug).toBe('e2e-quartier');
        expect(JSON.stringify(body)).not.toContain('120.00091');
      });

    await request(app.getHttpServer())
      .post(`/api/admin/neighborhoods/${e2eNeighborhoodId}/archive`)
      .set('Authorization', bearer(adminToken))
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('archived');
      });

    await request(app.getHttpServer())
      .post(`/api/admin/neighborhoods/${e2eNeighborhoodId}/assign-user`)
      .set('Authorization', bearer(adminToken))
      .send({
        userId: aliceId,
        justification: 'Test de refus sur quartier archivé.',
      })
      .expect(409);

    await request(app.getHttpServer())
      .get(`/api/neighborhoods/${e2eNeighborhoodId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/admin/neighborhoods/${e2eNeighborhoodId}/restore`)
      .set('Authorization', bearer(adminToken))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('active'));
  });

  it('covers service publishing, service cancellation and point balance', async () => {
    await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Quartier introuvable',
        description: 'Ce service doit etre refuse.',
        type: 'request',
        category: 'bricolage',
        availability: 'Dimanche',
        neighborhoodId: 'quartier-inexistant',
        isPaid: false,
        status: 'draft',
      })
      .expect(400);

    const draftService = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Service brouillon',
        description: 'Service cree en brouillon pour verifier publish/cancel.',
        type: 'request',
        category: 'bricolage',
        availability: 'Dimanche',
        neighborhoodId: 'quartier-centre',
        isPaid: false,
        status: 'draft',
      })
      .expect(201);

    draftServiceId = getId(draftService.body);
    expect(draftService.body.status).toBe('draft');

    await request(app.getHttpServer())
      .get(`/api/services/${draftServiceId}`)
      .set('Authorization', bearer(bobToken))
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/services/${draftServiceId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.viewer.isOwner).toBe(true);
        expect(body.permissions.canPublish).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/api/services')
      .set('Authorization', bearer(bobToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: draftServiceId }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .patch(`/api/services/${draftServiceId}`)
      .send({ title: 'Tentative sans session' })
      .expect(401);

    await request(app.getHttpServer())
      .patch(`/api/services/${draftServiceId}`)
      .set('Authorization', bearer(bobToken))
      .send({ title: 'Tentative Bob' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/services/${draftServiceId}`)
      .set('Authorization', bearer(adminToken))
      .send({ title: 'Tentative Admin' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/services/${draftServiceId}/publish`)
      .set('Authorization', bearer(bobToken))
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/services/${draftServiceId}/cancel`)
      .set('Authorization', bearer(bobToken))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/services/${draftServiceId}`)
      .set('Authorization', bearer(bobToken))
      .expect(403);

    const updatedService = await request(app.getHttpServer())
      .patch(`/api/services/${draftServiceId}`)
      .set('Authorization', bearer(aliceToken))
      .send({ availability: 'Dimanche apres-midi' })
      .expect(200);

    expect(updatedService.body.availability).toBe('Dimanche apres-midi');

    const publishedService = await request(app.getHttpServer())
      .post(`/api/services/${draftServiceId}/publish`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    expect(publishedService.body.status).toBe('published');

    await request(app.getHttpServer())
      .delete(`/api/services/${draftServiceId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(409);

    const cancelledService = await request(app.getHttpServer())
      .post(`/api/services/${draftServiceId}/cancel`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    expect(cancelledService.body.status).toBe('cancelled');

    const deletableDraft = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Brouillon suppression',
        description: 'Brouillon reserve au test de suppression logique.',
        type: 'request',
        category: 'bricolage',
        availability: 'A definir',
        neighborhoodId: 'quartier-centre',
        isPaid: false,
        status: 'draft',
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/services/${getId(deletableDraft.body)}`)
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => expect(body.deleted).toBe(true));

    await request(app.getHttpServer())
      .get('/api/points/balance')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          userId: aliceId,
          pointsBalance: 100,
          reservedPoints: 0,
          availablePoints: 100,
        });
        expect(body).not.toHaveProperty('passwordHash');
      });
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

    await request(app.getHttpServer())
      .get(`/api/users/${bobId}/public`)
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            id: bobId,
            displayName: 'Bob Dupont',
            neighborhoodId: 'quartier-centre',
            completedServicesCount: expect.any(Number),
          }),
        );
        expect(body).not.toHaveProperty('email');
        expect(body).not.toHaveProperty('passwordHash');
        expect(body).not.toHaveProperty('pointsBalance');
      });

    await request(app.getHttpServer())
      .get('/api/services')
      .set('Authorization', bearer(bobToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: serviceId,
              owner: expect.objectContaining({ displayName: 'Alice Martin' }),
              neighborhood: expect.objectContaining({
                name: 'Quartier Centre',
              }),
              applicationsCount: 1,
              viewer: expect.objectContaining({
                hasApplied: true,
                applicationId,
                canApply: false,
              }),
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get(`/api/services/${serviceId}/applications`)
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body[0]).toEqual(
          expect.objectContaining({
            id: applicationId,
            applicant: expect.objectContaining({
              id: bobId,
              displayName: 'Bob Dupont',
            }),
            service: expect.objectContaining({
              id: serviceId,
              title: 'E2E Aide bricolage',
            }),
          }),
        );
        expect(body[0].applicant).not.toHaveProperty('email');
      });

    await request(app.getHttpServer())
      .get('/api/applications/me')
      .set('Authorization', bearer(bobToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: applicationId,
              owner: expect.objectContaining({ displayName: 'Alice Martin' }),
              service: expect.objectContaining({ title: 'E2E Aide bricolage' }),
            }),
          ]),
        );
      });

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

    await request(app.getHttpServer())
      .delete(`/api/services/${serviceId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(409);

    await request(app.getHttpServer())
      .get(`/api/contracts/${contractId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.service).toEqual(
          expect.objectContaining({
            id: serviceId,
            title: 'E2E Aide bricolage',
          }),
        );
        expect(body.requester.displayName).toBe('Alice Martin');
        expect(body.provider.displayName).toBe('Bob Dupont');
        expect(body.requester).not.toHaveProperty('email');
      });

    await request(app.getHttpServer())
      .get(`/api/contracts/${contractId}`)
      .set('Authorization', bearer(adminToken))
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/services/me/created')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: serviceId })]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/services/me/involved')
      .set('Authorization', bearer(bobToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: serviceId,
              involvement: expect.objectContaining({ role: 'provider' }),
            }),
          ]),
        );
      });

    const aliceAfterReservation = await getMe(aliceToken);
    expect(aliceAfterReservation.pointsBalance).toBe(75);
    expect(aliceAfterReservation.reservedPoints).toBe(25);

    type DocumentFieldBody = {
      id: string;
      type: 'signature' | 'initials' | 'date' | 'text' | 'checkbox';
      pageNumber: number;
      x: number;
      y: number;
      width: number;
      height: number;
      assignedToUserId: string;
      required: boolean;
      label?: string;
    };
    type DocumentBody = {
      id: string;
      status: string;
      fields: DocumentFieldBody[];
      files: {
        original: { id: string };
        final: { id: string };
      };
      hashes: {
        original: string;
        current: string;
        final: string;
      };
      progress: { signed: number; total: number };
      version: number;
    };
    const responseBody = <T>(response: { body: unknown }) => response.body as T;

    const invalidPdf = Buffer.from('not-a-real-pdf');
    const invalidUpload = await request(app.getHttpServer())
      .post('/api/storage/presign-upload')
      .set('Authorization', bearer(aliceToken))
      .send({
        filename: 'invalid-contract.pdf',
        mimeType: 'application/pdf',
        sizeBytes: invalidPdf.length,
        contextType: 'contract_document',
        contextId: contractId,
      })
      .expect(201);
    const invalidUploadBody = responseBody<{ fileId: string }>(invalidUpload);
    await storageService.putMemoryUploadForTest(
      invalidUploadBody.fileId,
      invalidPdf,
    );
    await request(app.getHttpServer())
      .post(`/api/storage/files/${invalidUploadBody.fileId}/complete`)
      .set('Authorization', bearer(aliceToken))
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/contracts/${contractId}/document`)
      .set('Authorization', bearer(aliceToken))
      .send({ fileId: invalidUploadBody.fileId, title: 'Contrat invalide' })
      .expect(409);

    const generatedDocument = await request(app.getHttpServer())
      .post(`/api/contracts/${contractId}/document/generate`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);
    const generatedDocumentBody = responseBody<DocumentBody>(generatedDocument);
    const documentId = generatedDocumentBody.id;
    const originalFileId = generatedDocumentBody.files.original.id;
    const original = await storageService.getVerifiedBuffer(originalFileId);
    expect(original.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(generatedDocumentBody.status).toBe('prepared');
    expect(generatedDocumentBody.hashes.original).toMatch(/^[a-f0-9]{64}$/);

    await request(app.getHttpServer())
      .put(`/api/documents/${documentId}/fields`)
      .set('Authorization', bearer(aliceToken))
      .send({
        fields: [
          {
            type: 'signature',
            pageNumber: 1,
            x: 0.95,
            y: 0.8,
            width: 0.2,
            height: 0.08,
            assignedToUserId: aliceId,
            required: true,
          },
        ],
      })
      .expect(400);

    const defaultFields = generatedDocumentBody.fields.map((field) => ({
      id: field.id,
      type: field.type,
      pageNumber: field.pageNumber,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      assignedToUserId: field.assignedToUserId,
      required: field.required,
      ...(field.label ? { label: field.label } : {}),
    }));
    const incompleteFields = defaultFields.filter(
      (field) => field.assignedToUserId === aliceId,
    );
    await request(app.getHttpServer())
      .put(`/api/documents/${documentId}/fields`)
      .set('Authorization', bearer(aliceToken))
      .send({ fields: incompleteFields })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/documents/${documentId}/send-for-signature`)
      .set('Authorization', bearer(aliceToken))
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/documents/${documentId}/fields`)
      .set('Authorization', bearer(aliceToken))
      .send({ fields: defaultFields })
      .expect(200);

    const sentDocument = await request(app.getHttpServer())
      .post(`/api/documents/${documentId}/send-for-signature`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);
    const sentDocumentBody = responseBody<DocumentBody>(sentDocument);
    expect(sentDocumentBody.status).toBe('sent_for_signature');

    await request(app.getHttpServer())
      .put(`/api/documents/${documentId}/fields`)
      .set('Authorization', bearer(aliceToken))
      .send({ fields: [] })
      .expect(409);

    const aliceField = sentDocumentBody.fields.find(
      (field) => field.assignedToUserId === aliceId,
    );
    const bobField = sentDocumentBody.fields.find(
      (field) => field.assignedToUserId === bobId,
    );
    if (!aliceField || !bobField) {
      throw new Error('Les zones de signature E2E sont absentes.');
    }

    await request(app.getHttpServer())
      .post(`/api/documents/${documentId}/sign`)
      .set('Authorization', bearer(bobToken))
      .send({
        consent: true,
        signatureText: 'Bob Dupont',
        values: [
          { fieldId: aliceField.id, value: 'Alice Martin' },
          { fieldId: bobField.id, value: 'Bob Dupont' },
        ],
      })
      .expect(403);

    const aliceSignedDocument = await request(app.getHttpServer())
      .post(`/api/documents/${documentId}/sign`)
      .set('Authorization', bearer(aliceToken))
      .send({
        consent: true,
        signatureText: 'Alice Martin',
        values: [{ fieldId: aliceField.id, value: 'Alice Martin' }],
      })
      .expect(201);
    const aliceSignedDocumentBody =
      responseBody<DocumentBody>(aliceSignedDocument);
    expect(aliceSignedDocumentBody.status).toBe('partially_signed');
    expect(aliceSignedDocumentBody.hashes.current).not.toBe(
      aliceSignedDocumentBody.hashes.original,
    );
    expect(aliceSignedDocumentBody.progress).toEqual({ signed: 1, total: 2 });

    const pendingContract = await request(app.getHttpServer())
      .get(`/api/contracts/${contractId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(200);
    expect(responseBody<{ status: string }>(pendingContract).status).toBe(
      'sent',
    );

    const finalizedDocument = await request(app.getHttpServer())
      .post(`/api/documents/${documentId}/sign`)
      .set('Authorization', bearer(bobToken))
      .send({
        consent: true,
        signatureText: 'Bob Dupont',
        values: [{ fieldId: bobField.id, value: 'Bob Dupont' }],
      })
      .expect(201);
    const finalizedDocumentBody = responseBody<DocumentBody>(finalizedDocument);
    expect(finalizedDocumentBody.status).toBe('finalized');
    expect(finalizedDocumentBody.hashes.final).toMatch(/^[a-f0-9]{64}$/);
    expect(finalizedDocumentBody.files.final.id).toBeTruthy();
    expect(finalizedDocumentBody.progress).toEqual({ signed: 2, total: 2 });
    expect(finalizedDocumentBody.version).toBeGreaterThan(
      aliceSignedDocumentBody.version,
    );

    const finalFile = await storageService.getVerifiedBuffer(
      finalizedDocumentBody.files.final.id,
    );
    expect(finalFile.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(finalFile.file.sha256).toBe(finalizedDocumentBody.hashes.final);
    expect(finalizedDocumentBody.files.original.id).toBe(originalFileId);

    for (const token of [aliceToken, bobToken]) {
      const download = await request(app.getHttpServer())
        .get(`/api/documents/${documentId}/download-url`)
        .query({ variant: 'final', disposition: 'attachment' })
        .set('Authorization', bearer(token))
        .expect(200);
      const downloadBody = responseBody<{ url: string; expiresAt: string }>(
        download,
      );
      expect(downloadBody.url).toBeTruthy();
      expect(downloadBody.expiresAt).toBeTruthy();
    }

    await request(app.getHttpServer())
      .get(`/api/documents/${documentId}/download-url`)
      .query({ variant: 'final' })
      .set('Authorization', bearer(moderatorToken))
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/documents/${documentId}/sign`)
      .set('Authorization', bearer(aliceToken))
      .send({
        consent: true,
        signatureText: 'Alice Martin',
        values: [{ fieldId: aliceField.id, value: 'Alice Martin' }],
      })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/documents/${documentId}/cancel`)
      .set('Authorization', bearer(aliceToken))
      .expect(409);

    const activeContract = await request(app.getHttpServer())
      .get(`/api/contracts/${contractId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(200);
    const activeContractBody = responseBody<{
      status: string;
      signedByIds: string[];
      finalizedDocumentFileId: string;
      documentFinalSha256: string;
    }>(activeContract);
    expect(activeContractBody.status).toBe('active');
    expect(activeContractBody.signedByIds).toEqual(
      expect.arrayContaining([aliceId, bobId]),
    );
    expect(activeContractBody.finalizedDocumentFileId).toBe(
      finalizedDocumentBody.files.final.id,
    );
    expect(activeContractBody.documentFinalSha256).toBe(
      finalizedDocumentBody.hashes.final,
    );
    await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/start')
      .set('Authorization', bearer(aliceToken))
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/contracts/' + contractId + '/complete')
      .set('Authorization', bearer(aliceToken))
      .expect(409);

    const startedService = await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/start')
      .set('Authorization', bearer(bobToken))
      .expect(201);

    expect(startedService.body.executionStatus).toBe('in_progress');
    expect(startedService.body.startedAt).toBeTruthy();

    const proofPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/proofs/presign-upload')
      .set('Authorization', bearer(aliceToken))
      .send({
        filename: 'preuve.png',
        mimeType: 'image/png',
        sizeBytes: proofPng.length,
      })
      .expect(403);

    const proofPresign = await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/proofs/presign-upload')
      .set('Authorization', bearer(bobToken))
      .send({
        filename: 'preuve.png',
        mimeType: 'image/png',
        sizeBytes: proofPng.length,
      })
      .expect(201);
    const proofPresignBody = responseBody<{ fileId: string }>(proofPresign);
    await storageService.putMemoryUploadForTest(
      proofPresignBody.fileId,
      proofPng,
    );
    await request(app.getHttpServer())
      .post('/api/storage/files/' + proofPresignBody.fileId + '/complete')
      .set('Authorization', bearer(bobToken))
      .expect(201);

    const fileProof = await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/proofs')
      .set('Authorization', bearer(bobToken))
      .send({
        message: 'Photo de la fixation terminée.',
        fileId: proofPresignBody.fileId,
      })
      .expect(201);
    const fileProofBody = responseBody<{
      id: string;
      attachment: { deleted: boolean };
    }>(fileProof);
    expect(fileProofBody.attachment).toEqual(
      expect.objectContaining({
        fileKind: 'image',
        mimeType: 'image/png',
        sizeBytes: proofPng.length,
        sha256: expect.any(String),
      }),
    );
    expect(fileProofBody).not.toHaveProperty('objectKey');

    await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/proofs')
      .set('Authorization', bearer(bobToken))
      .send({ fileId: proofPresignBody.fileId })
      .expect(409);
    await request(app.getHttpServer())
      .get(
        '/api/services/' +
          serviceId +
          '/proofs/' +
          fileProofBody.id +
          '/download-url',
      )
      .set('Authorization', bearer(claireToken))
      .expect(403);
    const participantDownload = await request(app.getHttpServer())
      .get(
        '/api/services/' +
          serviceId +
          '/proofs/' +
          fileProofBody.id +
          '/download-url',
      )
      .set('Authorization', bearer(aliceToken))
      .expect(200);
    expect(responseBody<{ url: string }>(participantDownload).url).toBeTruthy();
    const deletedProof = await request(app.getHttpServer())
      .delete(
        '/api/services/' +
          serviceId +
          '/proofs/' +
          fileProofBody.id +
          '/attachment',
      )
      .set('Authorization', bearer(bobToken))
      .expect(200);
    expect(
      responseBody<{ attachment: { deleted: boolean } }>(deletedProof)
        .attachment.deleted,
    ).toBe(true);
    await request(app.getHttpServer())
      .get(
        '/api/services/' +
          serviceId +
          '/proofs/' +
          fileProofBody.id +
          '/download-url',
      )
      .set('Authorization', bearer(aliceToken))
      .expect(404);

    const firstProof = await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/proofs')
      .set('Authorization', bearer(bobToken))
      .send({
        type: 'note',
        message: 'Étagère montée, fixée et niveau vérifié.',
      })
      .expect(201);

    expect(firstProof.body).toEqual(
      expect.objectContaining({
        serviceId,
        authorId: bobId,
        type: 'note',
      }),
    );
    expect(firstProof.body.author).not.toHaveProperty('email');

    await request(app.getHttpServer())
      .get('/api/services/' + serviceId + '/proofs')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: firstProof.body.id }),
          ]),
        );
      });

    const firstDone = await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/mark-done')
      .set('Authorization', bearer(bobToken))
      .expect(201);

    expect(firstDone.body.executionStatus).toBe('awaiting_validation');
    expect(firstDone.body.pointsTransferred).toBe(false);

    const aliceBeforeValidation = await getMe(aliceToken);
    const bobBeforeValidation = await getMe(bobToken);
    expect(aliceBeforeValidation.pointsBalance).toBe(75);
    expect(aliceBeforeValidation.reservedPoints).toBe(25);
    expect(bobBeforeValidation.pointsBalance).toBe(100);

    const correction = await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/request-correction')
      .set('Authorization', bearer(aliceToken))
      .send({
        reason: 'Merci de resserrer la fixation murale avant validation.',
      })
      .expect(201);

    expect(correction.body.executionStatus).toBe('correction_requested');

    await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/mark-done')
      .set('Authorization', bearer(bobToken))
      .expect(409);

    const correctionProof = await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/proofs')
      .set('Authorization', bearer(bobToken))
      .send({
        type: 'note',
        message: 'Fixation murale resserrée et contrôlée une seconde fois.',
      })
      .expect(201);

    expect(correctionProof.body.id).toBeTruthy();

    await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/mark-done')
      .set('Authorization', bearer(bobToken))
      .expect(201)
      .expect(({ body }) => {
        expect(body.executionStatus).toBe('awaiting_validation');
      });

    await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/validate')
      .set('Authorization', bearer(bobToken))
      .expect(403);

    const validation = await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/validate')
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    expect(validation.body).toEqual(
      expect.objectContaining({
        executionStatus: 'completed',
        contractStatus: 'completed',
        pointsTransferred: true,
      }),
    );

    const completedService = await request(app.getHttpServer())
      .get('/api/services/' + serviceId)
      .set('Authorization', bearer(aliceToken))
      .expect(200);

    expect(completedService.body).toEqual(
      expect.objectContaining({
        status: 'completed',
        validatedAt: expect.any(String),
        completedAt: expect.any(String),
      }),
    );

    await request(app.getHttpServer())
      .post('/api/services/' + serviceId + '/validate')
      .set('Authorization', bearer(aliceToken))
      .expect(409);

    await request(app.getHttpServer())
      .get('/api/points/transactions')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        const transfers = body.filter(
          (item: { contractId: string; type: string }) =>
            item.contractId === contractId && item.type === 'transfer',
        );
        expect(transfers).toHaveLength(1);
      });

    const aliceAfterTransfer = await getMe(aliceToken);
    const bobAfterTransfer = await getMe(bobToken);
    expect(aliceAfterTransfer.pointsBalance).toBe(75);
    expect(aliceAfterTransfer.reservedPoints).toBe(0);
    expect(bobAfterTransfer.pointsBalance).toBe(125);
  });

  it('covers profiles, avatars, reviews, replies and moderation', async () => {
    await request(app.getHttpServer())
      .get('/api/services/' + serviceId)
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.review).toEqual(
          expect.objectContaining({
            canReview: true,
            hasReviewed: false,
            otherPartyId: bobId,
          }),
        );
        expect(body.owner).toEqual(
          expect.objectContaining({
            displayName: 'Alice Martin',
            reviewCount: expect.any(Number),
          }),
        );
        expect(body.owner).not.toHaveProperty('email');
      });

    await request(app.getHttpServer())
      .post('/api/contracts/' + contractId + '/reviews')
      .set('Authorization', bearer(aliceToken))
      .send({ rating: 6, comment: 'Note invalide.' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/contracts/' + contractId + '/reviews')
      .set('Authorization', bearer(aliceToken))
      .send({ rating: 5, comment: 'Cible injectée.', targetUserId: claireId })
      .expect(400);

    const aliceReview = await request(app.getHttpServer())
      .post('/api/contracts/' + contractId + '/reviews')
      .set('Authorization', bearer(aliceToken))
      .send({ rating: 5, comment: 'Travail soigne et communication claire.' })
      .expect(201);
    expect(aliceReview.body).toEqual(
      expect.objectContaining({
        rating: 5,
        status: 'published',
        targetUser: expect.objectContaining({ id: bobId }),
      }),
    );

    await request(app.getHttpServer())
      .post('/api/contracts/' + contractId + '/reviews')
      .set('Authorization', bearer(aliceToken))
      .send({ rating: 4, comment: 'Tentative de doublon.' })
      .expect(409);
    await request(app.getHttpServer())
      .post('/api/contracts/' + contractId + '/reviews')
      .set('Authorization', bearer(claireToken))
      .send({ rating: 5, comment: 'Avis tiers interdit.' })
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/users/' + bobId + '/reputation')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.averageRating).toBe(5);
        expect(body.reviewCount).toBe(1);
        expect(body.ratingDistribution['5']).toBe(1);
        expect(body.reputationScore).toBe(83);
      });

    const bobReview = await request(app.getHttpServer())
      .post('/api/contracts/' + contractId + '/reviews')
      .set('Authorization', bearer(bobToken))
      .send({ rating: 4, comment: 'Demande precise et validation rapide.' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/reviews/' + bobReview.body.id + '/reply')
      .set('Authorization', bearer(bobToken))
      .send({ message: 'Je tente de répondre à mon propre avis.' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/reviews/' + bobReview.body.id + '/reply')
      .set('Authorization', bearer(aliceToken))
      .send({ message: 'Merci pour votre confiance.' })
      .expect(201)
      .expect(({ body }) =>
        expect(body.response.message).toBe('Merci pour votre confiance.'),
      );
    await request(app.getHttpServer())
      .post('/api/reviews/' + bobReview.body.id + '/reply')
      .set('Authorization', bearer(aliceToken))
      .send({ message: 'Seconde réponse.' })
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/admin/reviews/' + aliceReview.body.id + '/hide')
      .set('Authorization', bearer(adminToken))
      .send({ reason: 'Masquage de contrôle E2E.' })
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('hidden'));
    await request(app.getHttpServer())
      .get('/api/users/' + bobId + '/reviews')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => expect(body.total).toBe(0));
    await request(app.getHttpServer())
      .get('/api/reviews/' + aliceReview.body.id)
      .set('Authorization', bearer(bobToken))
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('hidden'));
    await request(app.getHttpServer())
      .get('/api/users/' + bobId + '/reputation')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.averageRating).toBeNull();
        expect(body.reputationScore).toBeNull();
      });
    await request(app.getHttpServer())
      .post('/api/admin/reviews/' + aliceReview.body.id + '/restore')
      .set('Authorization', bearer(moderatorToken))
      .send({ reason: 'Contenu conforme après vérification E2E.' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('published');
        expect(body.moderationHistory).toHaveLength(2);
      });

    await request(app.getHttpServer())
      .patch('/api/users/me/profile')
      .set('Authorization', bearer(claireToken))
      .send({ role: 'admin', pointsBalance: 500 })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/users/me/profile')
      .set('Authorization', bearer(claireToken))
      .send({ bio: 'Profil prive E2E', profileVisibility: 'private' })
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/users/' + claireId + '/public')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            id: claireId,
            displayName: 'Claire Bernard',
            isRestricted: true,
          }),
        );
        expect(body).not.toHaveProperty('bio');
        expect(body).not.toHaveProperty('neighborhoodId');
        expect(body).not.toHaveProperty('reputation');
      });

    await request(app.getHttpServer())
      .post('/api/users/me/avatar/presign')
      .set('Authorization', bearer(aliceToken))
      .send({
        filename: 'avatar.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 128,
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/users/me/avatar/presign')
      .set('Authorization', bearer(aliceToken))
      .send({
        filename: 'avatar.png',
        mimeType: 'image/png',
        sizeBytes: 5 * 1024 * 1024 + 1,
      })
      .expect(400);

    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const presign = await request(app.getHttpServer())
      .post('/api/users/me/avatar/presign')
      .set('Authorization', bearer(aliceToken))
      .send({
        filename: 'alice.png',
        mimeType: 'image/png',
        sizeBytes: png.length,
      })
      .expect(201);
    await storageService.putMemoryUploadForTest(presign.body.fileId, png);
    await request(app.getHttpServer())
      .post('/api/users/me/avatar/' + presign.body.fileId + '/complete')
      .set('Authorization', bearer(bobToken))
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/users/me/avatar/' + presign.body.fileId + '/complete')
      .set('Authorization', bearer(aliceToken))
      .expect(201)
      .expect(({ body }) => {
        expect(body.avatarUrl).toContain(presign.body.fileId);
        expect(body).not.toHaveProperty('avatarFileId');
      });
    await request(app.getHttpServer())
      .get('/api/users/' + aliceId + '/public')
      .set('Authorization', bearer(bobToken))
      .expect(200)
      .expect(({ body }) =>
        expect(body.avatarUrl).toContain(presign.body.fileId),
      );
    await request(app.getHttpServer())
      .delete('/api/users/me/avatar')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => expect(body.avatarUrl).toBeNull());
  });
  +it('covers contract cancellation with reserved point release', async () => {
    const serviceResponse = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Contrat annulation',
        description: 'Alice cree un service pour tester annulation contrat.',
        type: 'request',
        category: 'bricolage',
        availability: 'Lundi soir',
        neighborhoodId: 'quartier-centre',
        isPaid: true,
        pricePoints: 20,
        status: 'published',
      })
      .expect(201);

    cancellableServiceId = getId(serviceResponse.body);

    const applicationResponse = await request(app.getHttpServer())
      .post(`/api/services/${cancellableServiceId}/applications`)
      .set('Authorization', bearer(bobToken))
      .send({
        message: 'E2E candidature annulation contrat',
        proposedPricePoints: 20,
      })
      .expect(201);

    const cancellableApplicationId = getId(applicationResponse.body);

    await request(app.getHttpServer())
      .post(`/api/applications/${cancellableApplicationId}/accept`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    const contractResponse = await request(app.getHttpServer())
      .post(`/api/contracts/from-application/${cancellableApplicationId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    cancellableContractId = getId(contractResponse.body.contract);

    await request(app.getHttpServer())
      .get('/api/points/balance')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.pointsBalance).toBe(55);
        expect(body.reservedPoints).toBe(20);
        expect(body.availablePoints).toBe(55);
      });

    const cancelledContract = await request(app.getHttpServer())
      .post(`/api/contracts/${cancellableContractId}/cancel`)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    expect(cancelledContract.body.status).toBe('cancelled');

    const cancelledService = await request(app.getHttpServer())
      .get(`/api/services/${cancellableServiceId}`)
      .set('Authorization', bearer(aliceToken))
      .expect(200);

    expect(cancelledService.body.status).toBe('cancelled');

    await request(app.getHttpServer())
      .get('/api/points/balance')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.pointsBalance).toBe(75);
        expect(body.reservedPoints).toBe(0);
        expect(body.availablePoints).toBe(75);
      });
  });

  it('returns a resident home response based only on persisted data', async () => {
    await request(app.getHttpServer())
      .get('/api/home')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.profile).toEqual(
          expect.objectContaining({
            id: aliceId,
            displayName: 'Alice Martin',
            neighborhood: expect.objectContaining({
              name: 'Quartier Centre',
              city: 'Paris',
            }),
          }),
        );
        expect(body.profile).not.toHaveProperty('email');
        expect(body.points).toEqual({
          availablePoints: 75,
          reservedPoints: 0,
        });
        expect(Array.isArray(body.todoItems)).toBe(true);
        expect(Array.isArray(body.recentServices)).toBe(true);
        expect(Array.isArray(body.recentIncidents)).toBe(true);
        expect(body.counts).toEqual(
          expect.objectContaining({
            createdServices: expect.any(Number),
            applications: expect.any(Number),
            contracts: expect.any(Number),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/contracts')
      .set('Authorization', bearer(bobToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: contractId,
              service: expect.objectContaining({
                title: 'E2E Aide bricolage',
              }),
              requester: expect.objectContaining({
                displayName: 'Alice Martin',
              }),
              provider: expect.objectContaining({
                displayName: 'Bob Dupont',
              }),
            }),
          ]),
        );
      });
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

    await request(app.getHttpServer())
      .post(`/api/incidents/${incidentId}/resolve`)
      .set('Authorization', bearer(aliceToken))
      .expect(403);

    const resolvedIncident = await request(app.getHttpServer())
      .post(`/api/incidents/${incidentId}/resolve`)
      .set('Authorization', bearer(adminToken))
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

    await request(app.getHttpServer())
      .post(`/api/alerts/${alertId}/resolve`)
      .set('Authorization', bearer(bobToken))
      .expect(403);

    const resolvedAlert = await request(app.getHttpServer())
      .post(`/api/alerts/${alertId}/resolve`)
      .set('Authorization', bearer(adminToken))
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

  it('covers local events, atomic capacity, waitlist promotion and private participants', async () => {
    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000);
    const registrationDeadline = new Date(startsAt.getTime() - 60 * 60 * 1000);
    const created = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Tournoi de pétanque',
        description:
          'Un événement E2E avec une capacité stricte et une liste d’attente.',
        category: 'sport',
        neighborhoodId: 'quartier-centre',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        registrationDeadline: registrationDeadline.toISOString(),
        locationLabel: 'Terrain municipal du quartier',
        capacity: 2,
      })
      .expect(201);

    localEventId = getId(created.body);
    expect(created.body).toEqual(
      expect.objectContaining({
        title: 'E2E Tournoi de pétanque',
        status: 'draft',
        permissions: expect.objectContaining({
          canEdit: true,
          canPublish: true,
        }),
      }),
    );

    await request(app.getHttpServer())
      .get('/api/events/' + localEventId)
      .set('Authorization', bearer(bobToken))
      .expect(404);

    await request(app.getHttpServer())
      .patch('/api/events/' + localEventId)
      .set('Authorization', bearer(bobToken))
      .send({ title: 'Tentative Bob' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/events/' + localEventId + '/publish')
      .set('Authorization', bearer(aliceToken))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('open_registration'));

    await request(app.getHttpServer())
      .post('/api/events/' + localEventId + '/respond')
      .set('Authorization', bearer(bobToken))
      .send({ interest: 'interested' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.response.response).toBe('interested');
        expect(body.event.counts.interested).toBe(1);
      });

    await request(app.getHttpServer())
      .post('/api/events/' + localEventId + '/join')
      .set('Authorization', bearer(bobToken))
      .expect(201)
      .expect(({ body }) => expect(body.response.response).toBe('going'));

    await request(app.getHttpServer())
      .post('/api/events/' + localEventId + '/join')
      .set('Authorization', bearer(claireToken))
      .expect(201)
      .expect(({ body }) => {
        expect(body.response.response).toBe('going');
        expect(body.event.counts.participants).toBe(2);
        expect(body.event.counts.remainingPlaces).toBe(0);
      });

    await request(app.getHttpServer())
      .post('/api/events/' + localEventId + '/join')
      .set('Authorization', bearer(nadiaToken))
      .expect(201)
      .expect(({ body }) => {
        expect(body.response.response).toBe('waitlisted');
        expect(body.response.waitlistPosition).toBe(1);
        expect(body.event.counts.waitlisted).toBe(1);
        expect(body.event.isFull).toBe(true);
      });

    await request(app.getHttpServer())
      .post('/api/events/' + localEventId + '/leave')
      .set('Authorization', bearer(bobToken))
      .expect(201)
      .expect(({ body }) => {
        expect(body.response.response).toBe('cancelled');
        expect(body.event.counts.participants).toBe(2);
        expect(body.event.counts.waitlisted).toBe(0);
      });

    await request(app.getHttpServer())
      .get('/api/events/' + localEventId + '/participants')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(2);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              response: 'going',
              user: expect.objectContaining({ displayName: 'Claire Bernard' }),
            }),
            expect.objectContaining({
              response: 'going',
              user: expect.objectContaining({ displayName: 'Nadia Petit' }),
            }),
          ]),
        );
        for (const participant of body as Array<Record<string, unknown>>) {
          expect(participant.user).not.toHaveProperty('email');
        }
      });

    await request(app.getHttpServer())
      .get('/api/events/' + localEventId + '/participants')
      .set('Authorization', bearer(outsideToken))
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/events/' + localEventId)
      .set('Authorization', bearer(outsideToken))
      .expect(404);

    await request(app.getHttpServer())
      .get('/api/events/recommended')
      .set('Authorization', bearer(bobToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.recommendationSource).toBe('neighborhood_fallback');
        expect(
          body.items.every(
            (item: { organizerId?: string }) => item.organizerId !== bobId,
          ),
        ).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/api/events')
      .query({ neighborhoodId: 'quartier-centre' })
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => expect(Array.isArray(body)).toBe(true));

    await request(app.getHttpServer())
      .get('/api/admin/events/' + localEventId)
      .set('Authorization', bearer(moderatorToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.history).toEqual(expect.any(Array));
        expect(body.organizer.displayName).toBe('Alice Martin');
      });
  });

  it('covers configurable anonymous votes, answer policy and aggregated results', async () => {
    const opensAt = new Date(Date.now() - 60_000);
    const closesAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const created = await request(app.getHttpServer())
      .post('/api/admin/votes')
      .set('Authorization', bearer(adminToken))
      .send({
        title: 'E2E Priorités du square',
        description: 'Choisissez jusqu’à deux améliorations pour le square.',
        neighborhoodId: 'quartier-centre',
        ballotType: 'multiple_choice',
        privacy: 'anonymous',
        resultsVisibility: 'after_close',
        options: [
          { label: 'Composteur' },
          { label: 'Arceaux vélo' },
          { label: 'Bancs' },
        ],
        minSelections: 1,
        maxSelections: 2,
        allowAnswerChange: false,
        opensAt: opensAt.toISOString(),
        closesAt: closesAt.toISOString(),
        status: 'draft',
      })
      .expect(201);

    localVoteId = getId(created.body);
    const optionIds = (created.body.options as Array<{ id: string }>).map(
      (option) => option.id,
    );
    expect(optionIds).toHaveLength(3);
    expect(created.body).not.toHaveProperty('question');

    await request(app.getHttpServer())
      .post('/api/votes')
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Vote résident interdit',
        neighborhoodId: 'quartier-centre',
        options: ['Oui', 'Non'],
        closesAt: closesAt.toISOString(),
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/admin/votes/' + localVoteId + '/open')
      .set('Authorization', bearer(moderatorToken))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('open'));

    const alicePayload = { selectedOptionIds: [optionIds[0], optionIds[1]] };
    await request(app.getHttpServer())
      .post('/api/votes/' + localVoteId + '/answers')
      .set('Authorization', bearer(aliceToken))
      .send(alicePayload)
      .expect(201)
      .expect(({ body }) => expect(body.unchanged).toBe(false));

    await request(app.getHttpServer())
      .post('/api/votes/' + localVoteId + '/answers')
      .set('Authorization', bearer(aliceToken))
      .send(alicePayload)
      .expect(201)
      .expect(({ body }) => expect(body.unchanged).toBe(true));

    await request(app.getHttpServer())
      .post('/api/votes/' + localVoteId + '/answers')
      .set('Authorization', bearer(aliceToken))
      .send({ selectedOptionIds: [optionIds[2]] })
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/votes/' + localVoteId + '/answers')
      .set('Authorization', bearer(bobToken))
      .send({ selectedOptionIds: [optionIds[0]] })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/votes/' + localVoteId + '/results')
      .set('Authorization', bearer(aliceToken))
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/votes/' + localVoteId)
      .set('Authorization', bearer(outsideToken))
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/votes/' + localVoteId + '/answers')
      .set('Authorization', bearer(outsideToken))
      .send({ selectedOptionIds: [optionIds[0]] })
      .expect(404);

    await request(app.getHttpServer())
      .get('/api/home')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.upcomingEvents).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: localEventId }),
          ]),
        );
        expect(body.openVotes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: localVoteId }),
          ]),
        );
        expect(body.myUpcomingEventsCount).toEqual(expect.any(Number));
        expect(body.myPendingVotesCount).toEqual(expect.any(Number));
      });

    await request(app.getHttpServer())
      .patch('/api/votes/' + localVoteId + '/close')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('closed'));

    await request(app.getHttpServer())
      .post('/api/votes/' + localVoteId + '/answers')
      .set('Authorization', bearer(claireToken))
      .send({ selectedOptionIds: [optionIds[2]] })
      .expect(409);

    await request(app.getHttpServer())
      .get('/api/votes/' + localVoteId + '/results')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.totalAnswers).toBe(2);
        expect(body.privacy).toBe('anonymous');
        expect(body.anonymity).toBe('application_level');
        expect(body.results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              option: expect.objectContaining({ id: optionIds[0] }),
              count: 2,
              percentage: 100,
              percentageDenominator: 'respondents',
            }),
            expect.objectContaining({
              option: expect.objectContaining({ id: optionIds[1] }),
              count: 1,
              percentage: 50,
            }),
          ]),
        );
        expect(JSON.stringify(body)).not.toContain(aliceId);
        expect(JSON.stringify(body)).not.toContain(bobId);
        expect(JSON.stringify(body)).not.toContain('userId');
      });

    await request(app.getHttpServer())
      .get('/api/admin/votes/' + localVoteId)
      .set('Authorization', bearer(moderatorToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.results.totalAnswers).toBe(2);
        expect(JSON.stringify(body.results)).not.toContain('userId');
      });

    await request(app.getHttpServer())
      .get('/api/votes')
      .query({ neighborhoodId: 'quartier-centre' })
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => expect(Array.isArray(body)).toBe(true));

    await request(app.getHttpServer())
      .post('/api/events/' + localEventId + '/cancel')
      .set('Authorization', bearer(aliceToken))
      .send({ reason: 'Fin du scénario E2E Vie locale.' })
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('cancelled'));
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

    const localEvents = await request(app.getHttpServer())
      .post('/api/dsl/execute')
      .set('Authorization', bearer(adminToken))
      .send({
        query: 'FIND events WHERE title = "E2E Tournoi de pétanque"',
      })
      .expect(201);
    expect(localEvents.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'E2E Tournoi de pétanque',
          endsAt: expect.any(String),
        }),
      ]),
    );
    expect(JSON.stringify(localEvents.body)).not.toContain('userId');

    const localVotes = await request(app.getHttpServer())
      .post('/api/dsl/execute')
      .set('Authorization', bearer(adminToken))
      .send({
        query: 'FIND votes WHERE title = "E2E Priorités du square"',
      })
      .expect(201);
    expect(localVotes.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'E2E Priorités du square',
          ballotType: 'multiple_choice',
        }),
      ]),
    );
    expect(JSON.stringify(localVotes.body)).not.toContain('selectedOptionIds');
    expect(JSON.stringify(localVotes.body)).not.toContain('userId');

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

  it('covers enriched RGPD export sections', async () => {
    await request(app.getHttpServer())
      .get('/api/rgpd/export')
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.services).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: 'E2E Aide bricolage' }),
          ]),
        );
        expect(body.applicationsAsOwner).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: applicationId }),
          ]),
        );
        expect(body.applicationsAsApplicant).toEqual(expect.any(Array));
        expect(body.incidents).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: incidentId })]),
        );
        expect(body.alerts).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: alertId })]),
        );
        expect(body.syncOperations).toEqual(expect.any(Array));
        expect(body.eventsCreated).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: localEventId }),
          ]),
        );
        expect(body.eventResponses).toEqual(expect.any(Array));
        expect(body.voteAnswers).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              voteId: localVoteId,
              selectedOptionIds: expect.any(Array),
            }),
          ]),
        );
        expect(body.reviewsWritten).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ contractId, rating: 5 }),
          ]),
        );
        expect(body.reviewsReceived).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ contractId, rating: 4 }),
          ]),
        );
        expect(body.reputation).toEqual(
          expect.objectContaining({ reviewCount: expect.any(Number) }),
        );
      });
  });

  it('covers dispute opening, evidence, moderation and an idempotent split', async () => {
    const createdService = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Litige partage',
        description:
          'Service payant utilisé pour valider le workflow de litige.',
        type: 'request',
        category: 'bricolage',
        availability: 'Mardi soir',
        neighborhoodId: 'quartier-centre',
        isPaid: true,
        pricePoints: 20,
        status: 'published',
      })
      .expect(201);

    disputeServiceId = getId(createdService.body);

    const application = await request(app.getHttpServer())
      .post('/api/services/' + disputeServiceId + '/applications')
      .set('Authorization', bearer(bobToken))
      .send({
        message: 'E2E candidature litige partage',
        proposedPricePoints: 20,
      })
      .expect(201);

    const disputeApplicationId = getId(application.body);

    await request(app.getHttpServer())
      .post('/api/applications/' + disputeApplicationId + '/accept')
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    const generated = await request(app.getHttpServer())
      .post('/api/contracts/from-application/' + disputeApplicationId)
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    disputeContractId = getId(generated.body.contract);

    await request(app.getHttpServer())
      .post('/api/contracts/' + disputeContractId + '/sign')
      .set('Authorization', bearer(aliceToken))
      .send({ consent: true, signatureText: 'Alice Martin' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/contracts/' + disputeContractId + '/sign')
      .set('Authorization', bearer(bobToken))
      .send({ consent: true, signatureText: 'Bob Dupont' })
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('active'));

    await request(app.getHttpServer())
      .post('/api/services/' + disputeServiceId + '/start')
      .set('Authorization', bearer(bobToken))
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/services/' + disputeServiceId + '/proofs')
      .set('Authorization', bearer(bobToken))
      .send({
        type: 'note',
        message: 'Preuve de réalisation avant contestation.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/services/' + disputeServiceId + '/mark-done')
      .set('Authorization', bearer(bobToken))
      .expect(201);

    const aliceBeforeResolution = await getMe(aliceToken);
    const bobBeforeResolution = await getMe(bobToken);
    expect(aliceBeforeResolution.reservedPoints).toBe(20);

    const opened = await request(app.getHttpServer())
      .post('/api/services/' + disputeServiceId + '/disputes')
      .set('Authorization', bearer(aliceToken))
      .send({
        reason: 'service_quality',
        description:
          'La prestation est partiellement réalisée et nécessite une décision de modération.',
        requestedOutcome: 'split',
      })
      .expect(201);

    disputeId = getId(opened.body);
    expect(opened.body).toEqual(
      expect.objectContaining({
        status: 'open',
        reservedPoints: 20,
        previousServiceStatus: 'awaiting_validation',
      }),
    );

    await request(app.getHttpServer())
      .get('/api/services/' + disputeServiceId)
      .set('Authorization', bearer(aliceToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('disputed');
        expect(body.activeDispute).toEqual(
          expect.objectContaining({ id: disputeId, reservedPoints: 20 }),
        );
        expect(body.permissions.canOpenDispute).toBe(false);
        expect(body.permissions.canViewDispute).toBe(true);
      });

    await request(app.getHttpServer())
      .post('/api/services/' + disputeServiceId + '/validate')
      .set('Authorization', bearer(aliceToken))
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/contracts/' + disputeContractId + '/complete')
      .set('Authorization', bearer(aliceToken))
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/contracts/' + disputeContractId + '/cancel')
      .set('Authorization', bearer(aliceToken))
      .expect(409);

    const disputePdf = Buffer.from('%PDF-dispute-proof', 'ascii');
    const disputeEvidencePresign = await request(app.getHttpServer())
      .post('/api/disputes/' + disputeId + '/evidence/presign-upload')
      .set('Authorization', bearer(bobToken))
      .send({
        filename: 'constat.pdf',
        mimeType: 'application/pdf',
        sizeBytes: disputePdf.length,
      })
      .expect(201);
    const disputeEvidencePresignBody = typedResponseBody<{ fileId: string }>(
      disputeEvidencePresign,
    );
    await storageService.putMemoryUploadForTest(
      disputeEvidencePresignBody.fileId,
      disputePdf,
    );
    await request(app.getHttpServer())
      .post(
        '/api/storage/files/' + disputeEvidencePresignBody.fileId + '/complete',
      )
      .set('Authorization', bearer(bobToken))
      .expect(201);

    const disputeEvidence = await request(app.getHttpServer())
      .post('/api/disputes/' + disputeId + '/evidence')
      .set('Authorization', bearer(bobToken))
      .send({
        message: 'Une partie du travail a été réalisée et vérifiée.',
        fileId: disputeEvidencePresignBody.fileId,
      })
      .expect(201);
    const disputeEvidenceBody = typedResponseBody<{
      id: string;
      author: { displayName: string };
      attachment: { fileKind: string; sha256: string };
    }>(disputeEvidence);
    expect(disputeEvidenceBody.author.displayName).toBe('Bob Dupont');
    expect(disputeEvidenceBody.author).not.toHaveProperty('email');
    expect(disputeEvidenceBody.attachment).toEqual(
      expect.objectContaining({
        fileKind: 'document',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matcher is typed as any.
        sha256: expect.any(String),
      }),
    );

    await request(app.getHttpServer())
      .get(
        '/api/disputes/' +
          disputeId +
          '/evidence/' +
          disputeEvidenceBody.id +
          '/download-url',
      )
      .set('Authorization', bearer(claireToken))
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/disputes/me')
      .set('Authorization', bearer(bobToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: disputeId, status: 'open' }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/admin/disputes')
      .set('Authorization', bearer(aliceToken))
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/admin/disputes/' + disputeId + '/assign')
      .set('Authorization', bearer(moderatorToken))
      .send({})
      .expect(201)
      .expect(({ body }) => {
        expect(body.assignedModerator.displayName).toBe('Moderation Demo');
      });

    await request(app.getHttpServer())
      .post('/api/admin/disputes/' + disputeId + '/start-review')
      .set('Authorization', bearer(moderatorToken))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('under_review'));

    await request(app.getHttpServer())
      .delete(
        '/api/disputes/' +
          disputeId +
          '/evidence/' +
          disputeEvidenceBody.id +
          '/attachment',
      )
      .set('Authorization', bearer(bobToken))
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/admin/disputes/' + disputeId + '/resolve')
      .set('Authorization', bearer(moderatorToken))
      .send({
        type: 'split',
        justification: 'Réalisation partielle confirmée par les preuves.',
        providerPoints: 15,
        requesterPoints: 10,
      })
      .expect(400);

    const resolved = await request(app.getHttpServer())
      .post('/api/admin/disputes/' + disputeId + '/resolve')
      .set('Authorization', bearer(moderatorToken))
      .send({
        type: 'split',
        justification: 'Réalisation partielle confirmée par les preuves.',
        providerPoints: 12,
        requesterPoints: 8,
      })
      .expect(201);

    expect(resolved.body).toEqual(
      expect.objectContaining({
        status: 'resolved',
        resolution: expect.objectContaining({
          type: 'split',
          providerPoints: 12,
          requesterPoints: 8,
        }),
      }),
    );
    expect(resolved.body.service.status).toBe('completed');
    expect(resolved.body.contract.status).toBe('completed');

    const aliceAfterResolution = await getMe(aliceToken);
    const bobAfterResolution = await getMe(bobToken);
    expect(aliceAfterResolution.pointsBalance).toBe(
      aliceBeforeResolution.pointsBalance + 8,
    );
    expect(aliceAfterResolution.reservedPoints).toBe(0);
    expect(bobAfterResolution.pointsBalance).toBe(
      bobBeforeResolution.pointsBalance + 12,
    );

    const transactionsBeforeRetry = await connection
      .collection('pointtransactions')
      .find({ disputeId })
      .toArray();
    expect(transactionsBeforeRetry).toHaveLength(2);
    expect(transactionsBeforeRetry).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'transfer', amount: 12 }),
        expect.objectContaining({ type: 'release', amount: 8 }),
      ]),
    );

    await request(app.getHttpServer())
      .post('/api/admin/disputes/' + disputeId + '/resolve')
      .set('Authorization', bearer(moderatorToken))
      .send({
        type: 'split',
        justification: 'Réalisation partielle confirmée par les preuves.',
        providerPoints: 12,
        requesterPoints: 8,
      })
      .expect(409);

    const transactionsAfterRetry = await connection
      .collection('pointtransactions')
      .countDocuments({ disputeId });
    expect(transactionsAfterRetry).toBe(2);

    await request(app.getHttpServer())
      .post('/api/admin/disputes/' + disputeId + '/close')
      .set('Authorization', bearer(moderatorToken))
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('closed'));
  });

  it('covers full provider payment and full requester refund resolutions', async () => {
    const providerPayment = await createDisputedResolutionScenario(
      'paiement',
      14,
    );

    await request(app.getHttpServer())
      .post('/api/admin/disputes/' + providerPayment.disputeId + '/assign')
      .set('Authorization', bearer(moderatorToken))
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(
        '/api/admin/disputes/' + providerPayment.disputeId + '/start-review',
      )
      .set('Authorization', bearer(moderatorToken))
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/admin/disputes/' + providerPayment.disputeId + '/resolve')
      .set('Authorization', bearer(moderatorToken))
      .send({
        type: 'provider_payment',
        justification:
          'Les preuves confirment la réalisation complète du service.',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('resolved');
        expect(body.service.status).toBe('completed');
        expect(body.contract.status).toBe('completed');
      });

    const providerTransactions = await connection
      .collection('pointtransactions')
      .find({ disputeId: providerPayment.disputeId })
      .toArray();
    expect(providerTransactions).toEqual([
      expect.objectContaining({ type: 'transfer', amount: 14 }),
    ]);

    const requesterRefund = await createDisputedResolutionScenario(
      'remboursement',
      11,
    );

    await request(app.getHttpServer())
      .post('/api/admin/disputes/' + requesterRefund.disputeId + '/assign')
      .set('Authorization', bearer(moderatorToken))
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(
        '/api/admin/disputes/' + requesterRefund.disputeId + '/start-review',
      )
      .set('Authorization', bearer(moderatorToken))
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/admin/disputes/' + requesterRefund.disputeId + '/resolve')
      .set('Authorization', bearer(moderatorToken))
      .send({
        type: 'requester_refund',
        justification:
          'Les preuves justifient le remboursement intégral du demandeur.',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('resolved');
        expect(body.service.status).toBe('cancelled');
        expect(body.contract.status).toBe('cancelled');
      });

    const refundTransactions = await connection
      .collection('pointtransactions')
      .find({ disputeId: requesterRefund.disputeId })
      .toArray();
    expect(refundTransactions).toEqual([
      expect.objectContaining({ type: 'release', amount: 11 }),
    ]);
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

  async function createDisputedResolutionScenario(
    label: string,
    pricePoints: number,
  ) {
    const serviceResponse = await request(app.getHttpServer())
      .post('/api/services')
      .set('Authorization', bearer(aliceToken))
      .send({
        title: 'E2E Litige ' + label,
        description: 'Service payant E2E pour une décision de ' + label + '.',
        type: 'request',
        category: 'bricolage',
        availability: 'Vendredi après-midi',
        neighborhoodId: 'quartier-centre',
        isPaid: true,
        pricePoints,
        status: 'published',
      })
      .expect(201);
    const scenarioServiceId = getId(serviceResponse.body);

    const applicationResponse = await request(app.getHttpServer())
      .post('/api/services/' + scenarioServiceId + '/applications')
      .set('Authorization', bearer(bobToken))
      .send({
        message: 'E2E candidature litige ' + label,
        proposedPricePoints: pricePoints,
      })
      .expect(201);
    const applicationId = getId(applicationResponse.body);

    await request(app.getHttpServer())
      .post('/api/applications/' + applicationId + '/accept')
      .set('Authorization', bearer(aliceToken))
      .expect(201);

    const contractResponse = await request(app.getHttpServer())
      .post('/api/contracts/from-application/' + applicationId)
      .set('Authorization', bearer(aliceToken))
      .expect(201);
    const scenarioContractId = getId(contractResponse.body.contract);

    await request(app.getHttpServer())
      .post('/api/contracts/' + scenarioContractId + '/sign')
      .set('Authorization', bearer(aliceToken))
      .send({ consent: true, signatureText: 'Alice Martin' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/contracts/' + scenarioContractId + '/sign')
      .set('Authorization', bearer(bobToken))
      .send({ consent: true, signatureText: 'Bob Dupont' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/services/' + scenarioServiceId + '/start')
      .set('Authorization', bearer(bobToken))
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/services/' + scenarioServiceId + '/proofs')
      .set('Authorization', bearer(bobToken))
      .send({ type: 'note', message: 'E2E preuve litige ' + label })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/services/' + scenarioServiceId + '/mark-done')
      .set('Authorization', bearer(bobToken))
      .expect(201);

    const opened = await request(app.getHttpServer())
      .post('/api/services/' + scenarioServiceId + '/disputes')
      .set('Authorization', bearer(aliceToken))
      .send({
        reason:
          label === 'paiement'
            ? 'payment_disagreement'
            : 'service_not_completed',
        description:
          'E2E litige destiné à tester la décision de ' + label + '.',
        requestedOutcome:
          label === 'paiement' ? 'provider_payment' : 'requester_refund',
      })
      .expect(201);

    return {
      serviceId: scenarioServiceId,
      contractId: scenarioContractId,
      disputeId: getId(opened.body),
    };
  }
  async function cleanE2eData(includeUsers: boolean) {
    if (!connection) {
      return;
    }

    const staleServices = await connection
      .collection('services')
      .find({ title: /^E2E/ }, { projection: { _id: 1 } })
      .toArray();
    const serviceIds = staleServices.map((service) => String(service._id));
    const staleContracts = await connection
      .collection('contracts')
      .find({ serviceId: { $in: serviceIds } }, { projection: { _id: 1 } })
      .toArray();
    const contractIds = staleContracts.map((contract) => String(contract._id));
    const staleUsers = await connection
      .collection('users')
      .find(
        { email: { $in: DEMO_USERS.map((user) => user.email) } },
        { projection: { _id: 1 } },
      )
      .toArray();
    const userIds = staleUsers.map((user) => String(user._id));

    const staleDisputes = await connection
      .collection('disputes')
      .find(
        {
          $or: [{ serviceId: { $in: serviceIds } }, { description: /^E2E/ }],
        },
        { projection: { _id: 1 } },
      )
      .toArray();
    const disputeIds = staleDisputes.map((dispute) => String(dispute._id));
    const staleEvents = await connection
      .collection('neighborhoodevents')
      .find({ title: /^E2E/ }, { projection: { _id: 1 } })
      .toArray();
    const eventIds = staleEvents.map((event) => String(event._id));
    const staleVotes = await connection
      .collection('votes')
      .find(
        { $or: [{ title: /^E2E/ }, { question: /^E2E/ }] },
        { projection: { _id: 1 } },
      )
      .toArray();
    const voteIds = staleVotes.map((vote) => String(vote._id));

    const operations = [
      connection.collection('eventresponses').deleteMany({
        eventId: { $in: eventIds },
      }),
      connection.collection('neighborhoodevents').deleteMany({
        _id: { $in: staleEvents.map((event) => event._id) },
      }),
      connection.collection('voteanswers').deleteMany({
        voteId: { $in: voteIds },
      }),
      connection.collection('votes').deleteMany({
        _id: { $in: staleVotes.map((vote) => vote._id) },
      }),
      connection.collection('disputeevidences').deleteMany({
        $or: [{ disputeId: { $in: disputeIds } }, { message: /^E2E/ }],
      }),
      connection.collection('disputes').deleteMany({
        $or: [{ serviceId: { $in: serviceIds } }, { description: /^E2E/ }],
      }),
      connection.collection('serviceapplications').deleteMany({
        $or: [{ serviceId: { $in: serviceIds } }, { message: /^E2E/ }],
      }),
      connection.collection('serviceproofs').deleteMany({
        serviceId: { $in: serviceIds },
      }),
      connection.collection('reviews').deleteMany({
        $or: [
          { serviceId: { $in: serviceIds } },
          { contractId: { $in: contractIds } },
        ],
      }),
      connection.collection('manageddocuments').deleteMany({
        serviceId: { $in: serviceIds },
      }),
      connection.collection('storagefiles').deleteMany({
        $or: [
          { contextId: { $in: contractIds } },
          { contextType: 'service_proof', contextId: { $in: serviceIds } },
          {
            contextType: 'dispute_evidence',
            contextId: { $in: disputeIds },
          },
          { contextType: 'user_avatar', contextId: { $in: userIds } },
        ],
      }),
      connection.collection('contracts').deleteMany({
        serviceId: { $in: serviceIds },
      }),
      connection.collection('pointtransactions').deleteMany({
        $or: [
          { serviceId: { $in: serviceIds } },
          { disputeId: { $in: disputeIds } },
        ],
      }),
      connection.collection('services').deleteMany({ title: /^E2E/ }),
      connection.collection('neighborhoods').deleteMany({
        slug: /^e2e-quartier/,
      }),
      connection.collection('incidents').deleteMany({
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
      connection.collection('graphsyncjobs').deleteMany({}),
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
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  process.env.COOKIE_SECRET = process.env.COOKIE_SECRET ?? 'test-cookie-secret';
  process.env.MONGODB_URI =
    process.env.MONGODB_URI ??
    'mongodb://127.0.0.1:27017/connected-neighbours-e2e?serverSelectionTimeoutMS=5000';
  process.env.NEO4J_URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687';
  process.env.NEO4J_ENABLED = 'false';
  process.env.GRAPH_SYNC_WORKER_ENABLED = 'false';
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

function typedResponseBody<T>(response: { body: unknown }) {
  return response.body as T;
}

function neighborhoodPayload(slug: string) {
  const geometry = {
    type: 'Polygon',
    coordinates: [
      [
        [120.0008, -19.9992],
        [120.0018, -19.9992],
        [120.0018, -19.9982],
        [120.0008, -19.9982],
        [120.0008, -19.9992],
      ],
    ],
  };
  return {
    name: 'Quartier E2E',
    slug,
    description: 'Quartier geographique utilise par les tests E2E.',
    city: 'Paris',
    postalCode: '75001',
    geometry,
    boundary: structuredClone(geometry),
  };
}
