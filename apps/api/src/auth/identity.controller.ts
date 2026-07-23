import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from './authenticated-user.type';
import { CurrentUser } from './current-user.decorator';
import { CompleteIdentityLinkDto } from './dto/complete-identity-link.dto';
import { IdentityLinkService } from './identity-link.service';
import {
  BearerTokenKind,
  KeycloakTokenVerifier,
} from './keycloak-token-verifier.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('identity')
@Controller('auth/identity')
export class IdentityController {
  constructor(
    private readonly linkService: IdentityLinkService,
    private readonly keycloakVerifier: KeycloakTokenVerifier,
  ) {}

  @Post('link/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Créer une demande de liaison Keycloak à usage unique',
  })
  requestLink(@CurrentUser() user: AuthenticatedUser) {
    return this.linkService.requestLink(user);
  }

  @Post('link/complete')
  @ApiBearerAuth()
  @ApiConflictResponse({
    description: 'Identité déjà liée ou conflit de compte',
  })
  @ApiOperation({
    summary: 'Finaliser une liaison après authentification Keycloak',
  })
  async completeLink(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CompleteIdentityLinkDto,
  ) {
    const token = this.extractBearer(authorization);

    if (this.keycloakVerifier.classify(token) !== BearerTokenKind.KEYCLOAK) {
      throw new UnauthorizedException('Un jeton Keycloak est requis.');
    }

    const payload = await this.keycloakVerifier.verify(token);
    return this.linkService.completeLink(dto.linkToken, payload);
  }

  private extractBearer(authorization?: string) {
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentification requise');
    }

    return token;
  }
}
