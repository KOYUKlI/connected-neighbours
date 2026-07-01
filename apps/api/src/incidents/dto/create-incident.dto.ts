import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import {
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  IncidentType,
} from '../schemas/incident.schema';

export class CreateIncidentDto {
  @ApiProperty({ example: 'Local velo force' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'La porte du local velo semble avoir ete forcee.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: IncidentType, example: IncidentType.SECURITY })
  @IsEnum(IncidentType)
  type: IncidentType;

  @ApiProperty({ enum: IncidentSeverity, example: IncidentSeverity.HIGH })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty({ example: 'quartier-centre' })
  @IsString()
  @IsNotEmpty()
  neighborhoodId: string;

  @ApiPropertyOptional({ enum: IncidentStatus, example: IncidentStatus.REPORTED })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ example: 'user_123' })
  @IsOptional()
  @IsString()
  reportedById?: string;

  @ApiPropertyOptional({ enum: IncidentSource, example: IncidentSource.WEB })
  @IsOptional()
  @IsEnum(IncidentSource)
  source?: IncidentSource;

  @ApiPropertyOptional({ example: 'javafx-incident-123' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({ example: '2026-06-30T10:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastSyncedAt?: Date;
}
