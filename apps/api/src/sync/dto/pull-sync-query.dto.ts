import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PullSyncQueryDto {
  @ApiProperty({ example: 'javafx-client-poste-01' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiPropertyOptional({ example: '2026-06-30T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  since?: string;
}
