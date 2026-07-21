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
] as const;

describe('Connected Neighbours API P0 (e2e)', () => {
  let app: NestFastifyApplication;
  let connection: Connection;
  let storageService: StorageService;

  let adminToken: string;
  let aliceToken: string;
  let bobToken: string;
  let moderatorToken: string;

  let aliceId: string;
  let bobId: string;
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

    adminToken = admin.accessToken;
    aliceToken = alice.accessToken;
    bobToken = bob.accessToken;
    moderatorToken = moderator.accessToken;
    aliceId = alice.user.id;
    bobId = bob.user.id;

    expect(admin.user.role).toBe(Role.ADMIN);
    expect(moderator.user.role).toBe(Role.MODERATOR);
    expect(alice.user.pointsBalance).toBeGreaterThanOrEqual(100);
    expect(bob.user.pointsBalance).toBeGreaterThanOrEqual(100);
  });

  it('covers geographic neighborhoods', async () => {
    const invalidNeighborhood = neighborhoodPayload('e2e-quartier-invalide');
    invalidNeighborhood.boundary.coordinates[0][4] = [2.36, 48.861];

    await request(app.getHttpServer())
      .post('/api/neighborhoods')
      .set('Authorization', bearer(adminToken))
      .send(invalidNeighborhood)
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/neighborhoods')
      .set('Authorization', bearer(aliceToken))
      .send(neighborhoodPayload('e2e-quartier'))
      .expect(403);

    const createdNeighborhood = await request(app.getHttpServer())
      .post('/api/neighborhoods')
      .set('Authorization', bearer(adminToken))
      .send(neighborhoodPayload('e2e-quartier'))
      .expect(201);

    e2eNeighborhoodId = getId(createdNeighborhood.body);
    expect(createdNeighborhood.body.status).toBe('active');

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
      .patch(`/api/neighborhoods/${e2eNeighborhoodId}`)
      .set('Authorization', bearer(adminToken))
      .send({ description: 'Quartier E2E mis a jour' })
      .expect(200);

    expect(updatedNeighborhood.body.description).toBe(
      'Quartier E2E mis a jour',
    );

    await request(app.getHttpServer())
      .post(`/api/neighborhoods/${e2eNeighborhoodId}/contains-point`)
      .set('Authorization', bearer(aliceToken))
      .send({ point: [2.3509, 48.8569] })
      .expect(201)
      .expect(({ body }) => {
        expect(body.contains).toBe(true);
      });

    await request(app.getHttpServer())
      .post(`/api/neighborhoods/${e2eNeighborhoodId}/contains-point`)
      .set('Authorization', bearer(aliceToken))
      .send({ point: [2.5, 48.8569] })
      .expect(201)
      .expect(({ body }) => {
        expect(body.contains).toBe(false);
      });

    await request(app.getHttpServer())
      .get('/api/neighborhoods/quartier-centre/members')
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              email: 'alice@connected-neighbours.local',
            }),
          ]),
        );
        for (const member of body as Array<Record<string, unknown>>) {
          expect(member).not.toHaveProperty('passwordHash');
        }
      });

    await request(app.getHttpServer())
      .get('/api/neighborhoods/quartier-centre/stats')
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
      .delete(`/api/neighborhoods/${e2eNeighborhoodId}`)
      .set('Authorization', bearer(adminToken))
      .expect(200)
      .expect(({ body }) => {
        expect(body.archived).toBe(true);
        expect(body.neighborhood.status).toBe('archived');
      });
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

  it('covers contract cancellation with reserved point release', async () => {
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

    await request(app.getHttpServer())
      .post('/api/disputes/' + disputeId + '/evidence')
      .set('Authorization', bearer(bobToken))
      .send({
        type: 'note',
        message: 'Une partie du travail a été réalisée et vérifiée.',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.author.displayName).toBe('Bob Dupont');
        expect(body.author).not.toHaveProperty('email');
      });

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

    const operations = [
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
      connection.collection('manageddocuments').deleteMany({
        serviceId: { $in: serviceIds },
      }),
      connection.collection('storagefiles').deleteMany({
        contextId: { $in: contractIds },
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
        slug: { $in: ['e2e-quartier', 'e2e-quartier-invalide'] },
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

function neighborhoodPayload(slug: string) {
  return {
    name: 'Quartier E2E',
    slug,
    description: 'Quartier geographique utilise par les tests E2E.',
    city: 'Paris',
    postalCode: '75001',
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [2.3508, 48.8567],
          [2.3518, 48.8567],
          [2.3518, 48.8577],
          [2.3508, 48.8577],
          [2.3508, 48.8567],
        ],
      ],
    },
  };
}
