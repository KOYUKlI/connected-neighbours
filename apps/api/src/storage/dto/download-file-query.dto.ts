import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum DownloadDisposition {
  INLINE = 'inline',
  ATTACHMENT = 'attachment',
}

export class DownloadFileQueryDto {
  @ApiPropertyOptional({
    enum: DownloadDisposition,
    default: DownloadDisposition.INLINE,
  })
  @IsOptional()
  @IsEnum(DownloadDisposition)
  disposition?: DownloadDisposition;
}
