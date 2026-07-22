import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
} from 'class-validator';

import { GraphEntityType } from '../graph.types';

const booleanValue = ({ value }: { value: unknown }) =>
  value === true || value === 'true';

export class ReconcileGraphDto {
  @ApiPropertyOptional({
    enum: GraphEntityType,
    isArray: true,
    description:
      'Types à reconstruire. Sans valeur, toutes les projections sont traitées dans un ordre stable.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(GraphEntityType, { each: true })
  entityTypes?: GraphEntityType[];

  @ApiPropertyOptional({
    default: false,
    description: 'Compte les documents MongoDB sans écrire dans Neo4j.',
  })
  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  dryRun = false;

  @ApiPropertyOptional({
    default: false,
    description: 'Confirmation obligatoire pour une réconciliation réelle.',
  })
  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  confirm = false;
}
