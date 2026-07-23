import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest } from './authenticated-user.type';
import { DualAuthService } from './dual-auth.service';

type BearerRequest = AuthenticatedRequest & {
  headers: { authorization?: string };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly dualAuthService: DualAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<BearerRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentification requise');
    }

    request.user = await this.dualAuthService.authenticate(token);
    return true;
  }
}
