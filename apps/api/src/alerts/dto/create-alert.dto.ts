import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import {
  AlertSeverity,
  AlertSource,
  AlertStatus,
} from '../schemas/alert.schema';

export class CreateAlertDto {
  @ApiProperty({ example: 'Porte forcee' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'La serrure presente des traces de forcement.' })
  @IsString()
  @IsNotEmpty()
  details: string;

  @ApiProperty({ enum: AlertSeverity, example: AlertSeverity.HIGH })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiPropertyOptional({ enum: AlertStatus, example: AlertStatus.CREATED })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({ enum: AlertSource, example: AlertSource.WEB })
  @IsOptional()
  @IsEnum(AlertSource)
  source?: AlertSource;

  @ApiPropertyOptional({ example: 'javafx-alert-123' })
  @IsOptional()
  @IsString()
  externalId?: string;
}
