import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { DownloadDisposition } from '../../storage/dto/download-file-query.dto';

export enum DocumentFileVariant {
  ORIGINAL = 'original',
  CURRENT = 'current',
  FINAL = 'final',
}

export class DocumentDownloadQueryDto {
  @ApiPropertyOptional({
    enum: DocumentFileVariant,
    default: DocumentFileVariant.CURRENT,
  })
  @IsOptional()
  @IsEnum(DocumentFileVariant)
  variant?: DocumentFileVariant;

  @ApiPropertyOptional({
    enum: DownloadDisposition,
    default: DownloadDisposition.INLINE,
  })
  @IsOptional()
  @IsEnum(DownloadDisposition)
  disposition?: DownloadDisposition;
}
