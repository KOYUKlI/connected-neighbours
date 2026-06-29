import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import {
  AlertSeverity,
  AlertSource,
  AlertStatus,
} from '../schemas/alert.schema';

export class UpdateAlertDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional({ enum: AlertSeverity })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({ enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({ enum: AlertSource })
  @IsOptional()
  @IsEnum(AlertSource)
  source?: AlertSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;
}
