import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedRequest } from './authenticated-user.type';
import { REQUIRE_MFA_KEY } from './require-mfa.decorator';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_MFA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user?.identity?.mfaSatisfied) {
      throw new ForbiddenException(
        'Une authentification multifacteur est requise pour cette action.',
      );
    }

    return true;
  }
}
