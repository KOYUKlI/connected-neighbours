import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import {
  SyncEntityType,
  SyncOperationType,
} from '../schemas/sync-operation.schema';

export class SyncOperationInputDto {
  @ApiProperty({ example: 'javafx-op-0001' })
  @IsString()
  @IsNotEmpty()
  operationId: string;

  @ApiProperty({ enum: SyncEntityType, example: SyncEntityType.INCIDENT })
  @IsEnum(SyncEntityType)
  entityType: SyncEntityType;

  @ApiPropertyOptional({ example: '66b0f3f9a4f8c1f900000001' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ enum: SyncOperationType, example: SyncOperationType.CREATE })
  @IsEnum(SyncOperationType)
  operationType: SyncOperationType;

  @ApiProperty({
    type: Object,
    example: {
      title: 'Eclairage en panne',
      description: 'Lampadaire eteint devant le batiment B.',
      type: 'maintenance',
      severity: 'medium',
      neighborhoodId: 'quartier-centre',
      externalId: 'javafx-incident-42',
    },
  })
  @IsObject()
  payload: Record<string, unknown>;
}

export class PushSyncDto {
  @ApiProperty({ example: 'javafx-client-poste-01' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ type: [SyncOperationInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SyncOperationInputDto)
  operations: SyncOperationInputDto[];
}
