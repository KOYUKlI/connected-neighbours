import { PickType } from '@nestjs/swagger';

import { SignDocumentDto } from './sign-document.dto';

export class LegacyContractSignDto extends PickType(SignDocumentDto, [
  'consent',
  'signatureText',
] as const) {}
