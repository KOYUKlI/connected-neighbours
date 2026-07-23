import { ConflictException } from '@nestjs/common';

export class IdentityLinkRequiredException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      error: 'Conflict',
      code: 'link_required',
      message:
        'Un compte local utilise déjà cette adresse e-mail. Connectez-vous localement pour lier votre identité.',
    });
  }
}
