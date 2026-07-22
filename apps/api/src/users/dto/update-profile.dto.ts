import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ProfileVisibility } from '../../auth/schemas/user.schema';

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 12 })
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @IsOptional()
  interests?: string[];

  @ApiPropertyOptional({ enum: ProfileVisibility })
  @IsEnum(ProfileVisibility)
  @IsOptional()
  profileVisibility?: ProfileVisibility;

  @IsBoolean()
  @IsOptional()
  showNeighborhood?: boolean;

  @IsBoolean()
  @IsOptional()
  showReviews?: boolean;

  @IsBoolean()
  @IsOptional()
  showCompletedServices?: boolean;

  @IsBoolean()
  @IsOptional()
  showReputation?: boolean;
}
