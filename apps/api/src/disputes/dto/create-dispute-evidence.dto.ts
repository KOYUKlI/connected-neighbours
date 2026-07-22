import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { DisputeEvidenceType } from '../schemas/dispute-evidence.schema';

export class CreateDisputeEvidenceDto {
  @ApiPropertyOptional({
    enum: DisputeEvidenceType,
    example: DisputeEvidenceType.NOTE,
    description:
      'Champ historique facultatif. Le type de fichier est déterminé par le stockage vérifié.',
    deprecated: true,
  })
  @IsOptional()
  @IsEnum(DisputeEvidenceType)
  type?: DisputeEvidenceType;

  @ApiPropertyOptional({
    example: 'La fixation reste instable après la correction demandée.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({ example: '665f24aa8bc7b9564f4a9310' })
  @IsOptional()
  @IsMongoId()
  fileId?: string;
}
