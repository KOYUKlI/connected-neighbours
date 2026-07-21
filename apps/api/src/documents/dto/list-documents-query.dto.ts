import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { ManagedDocumentStatus } from '../schemas/managed-document.schema';

export enum DocumentListRole {
  OWNED = 'owned',
  TO_SIGN = 'to-sign',
  COMPLETED = 'completed',
}

export class ListDocumentsQueryDto {
  @ApiPropertyOptional({ enum: ManagedDocumentStatus })
  @IsOptional()
  @IsEnum(ManagedDocumentStatus)
  status?: ManagedDocumentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  contractId?: string;

  @ApiPropertyOptional({ enum: DocumentListRole })
  @IsOptional()
  @IsEnum(DocumentListRole)
  role?: DocumentListRole;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
