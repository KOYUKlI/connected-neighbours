import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { SignatureFieldType } from '../schemas/managed-document.schema';

export class DocumentFieldDto {
  @ApiPropertyOptional({
    description: 'Absent lors de la création d’une nouvelle zone.',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: SignatureFieldType })
  @IsEnum(SignatureFieldType)
  type: SignatureFieldType;

  @ApiProperty({ minimum: 1, example: 1 })
  @IsNumber()
  @IsInt()
  @Min(1)
  pageNumber: number;

  @ApiProperty({ minimum: 0, maximum: 1, example: 0.08 })
  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @ApiProperty({ minimum: 0, maximum: 1, example: 0.72 })
  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;

  @ApiProperty({ minimum: 0.03, maximum: 1, example: 0.36 })
  @IsNumber()
  @Min(0.03)
  @Max(1)
  width: number;

  @ApiProperty({ minimum: 0.02, maximum: 1, example: 0.08 })
  @IsNumber()
  @Min(0.02)
  @Max(1)
  height: number;

  @ApiProperty()
  @IsMongoId()
  assignedToUserId: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  label?: string;
}

export class UpdateDocumentFieldsDto {
  @ApiProperty({ type: [DocumentFieldDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DocumentFieldDto)
  fields: DocumentFieldDto[];
}
