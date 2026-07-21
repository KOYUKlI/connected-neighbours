import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { DisputeOutcome, DisputeReason } from '../schemas/dispute.schema';

export class CreateDisputeDto {
  @ApiProperty({ enum: DisputeReason, example: DisputeReason.SERVICE_QUALITY })
  @IsEnum(DisputeReason)
  reason: DisputeReason;

  @ApiProperty({
    example:
      'La prestation déclarée comme réalisée nécessite encore une correction importante.',
    minLength: 20,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    enum: DisputeOutcome,
    example: DisputeOutcome.REQUESTER_REFUND,
  })
  @IsOptional()
  @IsEnum(DisputeOutcome)
  requestedOutcome?: DisputeOutcome;
}
