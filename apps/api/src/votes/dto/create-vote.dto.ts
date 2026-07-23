import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

import {
  VoteBallotType,
  VotePrivacy,
  VoteResultsVisibility,
  VoteStatus,
} from '../schemas/vote.schema';

export type VoteOptionInput =
  | string
  | {
      label: string;
      description?: string;
    };

export class CreateVoteDto {
  @ApiPropertyOptional({ example: 'Quel projet financer en priorité ?' })
  @IsOptional()
  @IsString()
  @Length(3, 180)
  title?: string;

  @ApiPropertyOptional({
    deprecated: true,
    description: 'Ancien nom accepté temporairement. Utiliser title.',
  })
  @IsOptional()
  @IsString()
  @Length(3, 180)
  question?: string;

  @ApiPropertyOptional({
    example: 'Choisissez le projet prioritaire pour le quartier.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 4000)
  description?: string;

  @ApiProperty({ example: 'quartier-centre' })
  @IsString()
  @Length(2, 120)
  neighborhoodId: string;

  @ApiPropertyOptional({ enum: VoteBallotType })
  @IsOptional()
  @IsEnum(VoteBallotType)
  ballotType?: VoteBallotType;

  @ApiPropertyOptional({ enum: VotePrivacy, default: VotePrivacy.PUBLIC })
  @IsOptional()
  @IsEnum(VotePrivacy)
  privacy?: VotePrivacy;

  @ApiPropertyOptional({
    enum: VoteResultsVisibility,
    default: VoteResultsVisibility.AFTER_CLOSE,
  })
  @IsOptional()
  @IsEnum(VoteResultsVisibility)
  resultsVisibility?: VoteResultsVisibility;

  @ApiProperty({
    description:
      'Libellés historiques ou objets { label, description } canoniques.',
    example: [{ label: 'Composteur partagé' }, { label: 'Arceaux vélo' }],
  })
  @IsArray()
  @ArrayMinSize(2)
  options: VoteOptionInput[];

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minSelections?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSelections?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowAnswerChange?: boolean;

  @ApiPropertyOptional({
    deprecated: true,
    description: 'Ancien indicateur accepté pour déduire ballotType.',
  })
  @IsOptional()
  @IsBoolean()
  allowMultipleChoices?: boolean;

  @ApiPropertyOptional({ example: '2026-08-01T08:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  opensAt?: Date;

  @ApiProperty({ example: '2026-08-10T18:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  closesAt: Date;

  @ApiPropertyOptional({
    enum: [VoteStatus.DRAFT, VoteStatus.SCHEDULED],
    default: VoteStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(VoteStatus)
  status?: VoteStatus;
}
