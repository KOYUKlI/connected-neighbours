import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

import {
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  IncidentType,
} from '../schemas/incident.schema';

export class UpdateIncidentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: IncidentType })
  @IsOptional()
  @IsEnum(IncidentType)
  type?: IncidentType;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  neighborhoodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportedById?: string;

  @ApiPropertyOptional({ enum: IncidentSource })
  @IsOptional()
  @IsEnum(IncidentSource)
  source?: IncidentSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastSyncedAt?: Date;
}
