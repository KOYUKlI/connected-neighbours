import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { DisputeEvidenceType } from '../schemas/dispute-evidence.schema';

export class CreateDisputeEvidenceDto {
  @ApiProperty({
    enum: DisputeEvidenceType,
    example: DisputeEvidenceType.NOTE,
  })
  @IsEnum(DisputeEvidenceType)
  type: DisputeEvidenceType;

  @ApiPropertyOptional({
    example: 'La fixation reste instable après la correction demandée.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({
    example: 'disputes/proof-reference.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileReference?: string;
}
