import { ServiceUnavailableException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { Connection } from 'mongoose';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import {
  BearerTokenKind,
  KeycloakTokenVerifier,
  type KeycloakTokenPayload,
} from '../src/auth/keycloak-token-verifier.service';
import { Role } from '../src/auth/role.enum';
import { UsersService } from '../src/auth/users.service';

describe('Dual authentication (e2e)', () => {
  let app: NestFastifyApplication;
  let connection: Connection;
  let users: UsersService;
  let payload: KeycloakTokenPayload;
  let keycloakUnavailable = false;

  const verifier = {
    classify: jest.fn((token: string) =>
      token === 'keycloak-e2e-token'
        ? BearerTokenKind.KEYCLOAK
        : BearerTokenKind.LOCAL,
    ),
    verify: jest.fn(() => {
      if (keycloakUnavailable) {
        return Promise.reject(
          new ServiceUnavailableException('Keycloak indisponible'),
        );
      }
      return Promise.resolve(payload);
    }),
  };

  beforeAll(async () => {
    configureEnvironment();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(KeycloakTokenVerifier)
      .useValue(verifier)
      .compile();

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
    users = app.get(UsersService);
    await connection.collection('users').deleteMany({
      email: /@dual-auth\.example$/,
    });
  });

  afterAll(async () => {
    await connection.collection('users').deleteMany({
      email: /@dual-auth\.example$/,
    });
    await connection.collection('securityauditevents').deleteMany({});
    await app.close();
  });

  beforeEach(() => {
    keycloakUnavailable = false;
    payload = keycloakPayload(
      'new-resident@dual-auth.example',
      'kc-new-resident',
    );
  });

  it('auto-provisions a verified identity only as a MongoDB resident', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer keycloak-e2e-token')
      .expect(200)
      .expect((response) => {
        const body = response.body as AuthMeResponse;
        expect(body.email).toBe('new-resident@dual-auth.example');
        expect(body.role).toBe(Role.RESIDENT);
        expect(body.identityProvider).toBe('keycloak');
        expect(body.onboardingCompleted).toBe(false);
      });

    await request(app.getHttpServer())
      .get('/api/auth/admin-only')
      .set('Authorization', 'Bearer keycloak-e2e-token')
      .expect(403);
  });

  it('returns link_required instead of linking an existing local email', async () => {
    await users.ensureDevUser({
      email: 'existing-local@dual-auth.example',
      displayName: 'Existing Local',
      role: Role.RESIDENT,
      neighborhoodId: 'quartier-centre',
      password: 'local-password',
    });
    payload = keycloakPayload(
      'existing-local@dual-auth.example',
      'kc-existing-local',
    );

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer keycloak-e2e-token')
      .expect(409)
      .expect((response) => {
        const body = response.body as ErrorResponse;
        expect(body.code).toBe('link_required');
      });
  });

  it('uses the MongoDB role after a deterministic identity link', async () => {
    const mongoAdmin = await users.ensureDevUser({
      email: 'linked-admin@dual-auth.example',
      displayName: 'Linked Admin',
      role: Role.ADMIN,
      neighborhoodId: 'quartier-centre',
      password: 'local-password',
    });
    await users.linkKeycloakIdentity({
      userId: mongoAdmin.id,
      keycloakSubject: 'kc-linked-admin',
      emailVerified: true,
    });
    payload = keycloakPayload(
      'linked-admin@dual-auth.example',
      'kc-linked-admin',
    );

    await request(app.getHttpServer())
      .get('/api/auth/admin-only')
      .set('Authorization', 'Bearer keycloak-e2e-token')
      .expect(200);
  });

  it('keeps local login working when Keycloak validation is unavailable', async () => {
    await users.ensureDevUser({
      email: 'javafx-admin@dual-auth.example',
      displayName: 'JavaFX Admin',
      role: Role.ADMIN,
      neighborhoodId: 'quartier-centre',
      password: 'admin-password',
    });
    keycloakUnavailable = true;

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'javafx-admin@dual-auth.example',
        password: 'admin-password',
      })
      .expect(200);

    const loginBody = login.body as LoginResponse;
    expect(loginBody.accessToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200);
  });
});

type AuthMeResponse = {
  email: string;
  role: Role;
  identityProvider: string;
  onboardingCompleted: boolean;
};

type ErrorResponse = { code: string };
type LoginResponse = { accessToken: string };

function keycloakPayload(email: string, subject: string): KeycloakTokenPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: 'http://localhost:8080/realms/connected-neighbours',
    aud: 'connected-neighbours-api',
    azp: 'connected-neighbours-web',
    sub: subject,
    email,
    email_verified: true,
    name: email.split('@')[0],
    iat: now,
    exp: now + 300,
    amr: ['pwd'],
    realm_access: { roles: ['admin'] },
  };
}

function configureEnvironment() {
  process.env.NODE_ENV = 'test';
  process.env.HOST = '127.0.0.1';
  process.env.PORT = '0';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.COOKIE_SECRET = 'dual-auth-test-cookie-secret';
  process.env.MONGODB_URI =
    'mongodb://127.0.0.1:27017/connected-neighbours-e2e?serverSelectionTimeoutMS=5000';
  process.env.NEO4J_ENABLED = 'false';
  process.env.GRAPH_SYNC_WORKER_ENABLED = 'false';
  process.env.MINIO_ENDPOINT = 'localhost';
  process.env.MINIO_PORT = '9000';
  process.env.MINIO_USE_SSL = 'false';
  process.env.MINIO_ACCESS_KEY = 'minioadmin';
  process.env.MINIO_SECRET_KEY = 'minioadmin';
  process.env.MINIO_BUCKET = 'connected-neighbours';
  process.env.AUTH_LOCAL_ENABLED = 'true';
  process.env.KEYCLOAK_ENABLED = 'true';
  process.env.KEYCLOAK_INTERNAL_URL = 'http://localhost:8080';
  process.env.KEYCLOAK_PUBLIC_URL = 'http://localhost:8080';
  process.env.KEYCLOAK_REALM = 'connected-neighbours';
  process.env.KEYCLOAK_API_AUDIENCE = 'connected-neighbours-api';
  process.env.KEYCLOAK_WEB_CLIENT_ID = 'connected-neighbours-web';
  process.env.KEYCLOAK_ADMIN_CLIENT_ID = 'connected-neighbours-admin';
  process.env.JWT_SECRET = 'dual-auth-test-jwt-secret-with-enough-length';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.DEV_AUTH_SEED = 'false';
}
