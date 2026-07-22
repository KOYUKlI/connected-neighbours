import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  VoteBallotType,
  VotePrivacy,
  VoteStatus,
} from '../schemas/vote.schema';

export class ListVotesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: VoteStatus })
  @IsOptional()
  @IsEnum(VoteStatus)
  status?: VoteStatus;

  @ApiPropertyOptional({ enum: VoteBallotType })
  @IsOptional()
  @IsEnum(VoteBallotType)
  ballotType?: VoteBallotType;

  @ApiPropertyOptional({ enum: VotePrivacy })
  @IsOptional()
  @IsEnum(VotePrivacy)
  privacy?: VotePrivacy;

  @ApiPropertyOptional({ enum: ['me'] })
  @IsOptional()
  @IsIn(['me'])
  createdBy?: 'me';

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => optionalBoolean(value))
  @IsIn([true, false])
  answered?: boolean;

  @ApiPropertyOptional({
    enum: ['newest', 'closing_soon', 'opening_soon'],
    default: 'closing_soon',
  })
  @IsOptional()
  @IsIn(['newest', 'closing_soon', 'opening_soon'])
  sort?: 'newest' | 'closing_soon' | 'opening_soon';

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Réservé aux routes administratives.' })
  @IsOptional()
  @IsString()
  neighborhoodId?: string;

  @ApiPropertyOptional({ description: 'Réservé aux routes administratives.' })
  @IsOptional()
  @IsString()
  createdById?: string;
}

function optionalBoolean(value: unknown) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return typeof value === 'string' || typeof value === 'boolean' ? value : '';
}
