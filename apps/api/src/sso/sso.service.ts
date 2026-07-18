import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

import { UsersService } from '../auth/users.service';
import { SsoCode, SsoCodeDocument } from './schemas/sso-code.schema';

const CODE_TTL_SECONDS = 60;
const ALLOWED_CALLBACK_HOSTS = ['127.0.0.1', 'localhost'];

@Injectable()
export class SsoService {
  constructor(
    @InjectModel(SsoCode.name)
    private readonly ssoCodeModel: Model<SsoCodeDocument>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async authorize(userId: string, callbackUrl: string, codeChallenge: string) {
    this.assertLoopbackCallback(callbackUrl);

    const code = randomBytes(32).toString('hex');

    await this.ssoCodeModel.create({
      code,
      userId,
      codeChallenge,
      used: false,
      expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
    });

    return { code };
  }

  async exchange(code: string, codeVerifier: string) {
    const ssoCode = await this.ssoCodeModel.findOne({ code }).exec();

    if (!ssoCode || ssoCode.used || ssoCode.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Code SSO invalide ou expiré');
    }

    const expectedChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    if (!this.safeEquals(expectedChallenge, ssoCode.codeChallenge)) {
      throw new UnauthorizedException('Code SSO invalide ou expiré');
    }

    ssoCode.used = true;
    await ssoCode.save();

    const user = await this.usersService.findById(ssoCode.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur introuvable ou inactif');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      neighborhoodId: user.neighborhoodId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.usersService.toPublicUser(user),
    };
  }

  private assertLoopbackCallback(callbackUrl: string) {
    let parsed: URL;

    try {
      parsed = new URL(callbackUrl);
    } catch {
      throw new BadRequestException('URL de callback invalide');
    }

    if (
      parsed.protocol !== 'http:' ||
      !ALLOWED_CALLBACK_HOSTS.includes(parsed.hostname)
    ) {
      throw new BadRequestException('URL de callback non autorisée');
    }
  }

  private safeEquals(a: string, b: string) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  }
}
