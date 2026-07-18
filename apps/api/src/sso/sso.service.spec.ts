import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';

import { SsoService } from './sso.service';

describe('SsoService', () => {
  let service: SsoService;

  const ssoCodeModelMock = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const usersServiceMock = {
    findById: jest.fn(),
    toPublicUser: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SsoService(
      ssoCodeModelMock as never,
      usersServiceMock as never,
      jwtServiceMock as never,
    );
  });

  describe('authorize', () => {
    it('should reject a non-loopback callback URL', async () => {
      await expect(
        service.authorize('user_1', 'https://evil.example.com/callback', 'challenge'),
      ).rejects.toThrow(BadRequestException);

      expect(ssoCodeModelMock.create).not.toHaveBeenCalled();
    });

    it('should reject a malformed callback URL', async () => {
      await expect(
        service.authorize('user_1', 'not-a-url', 'challenge'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a one-time code for a loopback callback URL', async () => {
      ssoCodeModelMock.create.mockResolvedValue({});

      const result = await service.authorize(
        'user_1',
        'http://127.0.0.1:53682/callback',
        'challenge',
      );

      expect(result.code).toEqual(expect.any(String));
      expect(ssoCodeModelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_1',
          codeChallenge: 'challenge',
          used: false,
        }),
      );
    });

    it('should accept a localhost callback URL', async () => {
      ssoCodeModelMock.create.mockResolvedValue({});

      await expect(
        service.authorize('user_1', 'http://localhost:53682/callback', 'challenge'),
      ).resolves.toEqual({ code: expect.any(String) });
    });
  });

  describe('exchange', () => {
    const verifier = 'sw1lPP0zZWx6MPjB4vMgSWzuXSMLm3fW38T0FGSyulg';
    const challenge = createHash('sha256').update(verifier).digest('base64url');

    it('should reject when the code does not exist', async () => {
      ssoCodeModelMock.findOne.mockReturnValue(execResult(null));

      await expect(service.exchange('missing-code', verifier)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject when the code was already used', async () => {
      ssoCodeModelMock.findOne.mockReturnValue(
        execResult(ssoCodeDocument({ used: true, codeChallenge: challenge })),
      );

      await expect(service.exchange('code_1', verifier)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject when the code has expired', async () => {
      ssoCodeModelMock.findOne.mockReturnValue(
        execResult(
          ssoCodeDocument({
            codeChallenge: challenge,
            expiresAt: new Date(Date.now() - 1000),
          }),
        ),
      );

      await expect(service.exchange('code_1', verifier)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject when the code verifier does not match the stored challenge', async () => {
      ssoCodeModelMock.findOne.mockReturnValue(
        execResult(ssoCodeDocument({ codeChallenge: challenge })),
      );

      await expect(
        service.exchange('code_1', 'wrong-verifier'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should mint a token and mark the code used on a valid exchange', async () => {
      const doc = ssoCodeDocument({ codeChallenge: challenge });
      ssoCodeModelMock.findOne.mockReturnValue(execResult(doc));
      usersServiceMock.findById.mockResolvedValue({
        id: 'user_1',
        email: 'alice@connected-neighbours.local',
        role: 'admin',
        displayName: 'Alice',
        neighborhoodId: 'quartier-centre',
        isActive: true,
      });
      usersServiceMock.toPublicUser.mockReturnValue({ id: 'user_1' });
      jwtServiceMock.signAsync.mockResolvedValue('signed-jwt');

      const result = await service.exchange('code_1', verifier);

      expect(doc.used).toBe(true);
      expect(doc.save).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'signed-jwt', user: { id: 'user_1' } });
    });

    it('should reject when the user is no longer active', async () => {
      const doc = ssoCodeDocument({ codeChallenge: challenge });
      ssoCodeModelMock.findOne.mockReturnValue(execResult(doc));
      usersServiceMock.findById.mockResolvedValue({ isActive: false });

      await expect(service.exchange('code_1', verifier)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

function execResult<T>(value: T) {
  return {
    exec: jest.fn().mockResolvedValue(value),
  };
}

function ssoCodeDocument(overrides: {
  used?: boolean;
  codeChallenge: string;
  expiresAt?: Date;
}) {
  return {
    code: 'code_1',
    userId: 'user_1',
    codeChallenge: overrides.codeChallenge,
    used: overrides.used ?? false,
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60_000),
    save: jest.fn().mockResolvedValue(undefined),
  };
}
