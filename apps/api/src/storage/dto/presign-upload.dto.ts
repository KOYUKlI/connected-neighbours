import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

import { StorageContextType } from '../schemas/storage-file.schema';

export const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;

export class PresignUploadDto {
  @ApiProperty({ example: 'contrat-prestation.pdf' })
  @IsString()
  @Length(1, 255)
  filename: string;

  @ApiProperty({ enum: ['application/pdf'], example: 'application/pdf' })
  @IsEnum({ PDF: 'application/pdf' })
  mimeType: 'application/pdf';

  @ApiProperty({ maximum: MAX_PDF_SIZE_BYTES, example: 125000 })
  @IsInt()
  @Min(1)
  @Max(MAX_PDF_SIZE_BYTES)
  sizeBytes: number;

  @ApiProperty({
    enum: StorageContextType,
    example: StorageContextType.CONTRACT_DOCUMENT,
  })
  @IsEnum(StorageContextType)
  contextType: StorageContextType;

  @ApiProperty({ description: 'Identifiant du contrat autorisant le dépôt.' })
  @IsMongoId()
  contextId: string;
}
