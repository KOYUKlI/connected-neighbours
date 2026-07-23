import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthenticationProvider } from './authenticated-identity.type';
import { AuthenticatedRequest } from './authenticated-user.type';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user?.role || !requiredRoles.includes(user.role)) return false;

    const protectsAdministration = requiredRoles.some((role) =>
      [Role.ADMIN, Role.MODERATOR].includes(role),
    );
    if (
      protectsAdministration &&
      user.identity?.provider === AuthenticationProvider.KEYCLOAK &&
      !user.identity.mfaSatisfied
    ) {
      throw new ForbiddenException(
        'Une authentification multifacteur est requise pour le back-office.',
      );
    }

    return true;
  }
}
