import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Length, Max, Min } from 'class-validator';

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
export const AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

export class PresignAvatarUploadDto {
  @ApiProperty({ example: 'avatar.webp' })
  @IsString()
  @Length(1, 255)
  filename: string;

  @ApiProperty({ enum: AVATAR_MIME_TYPES, example: 'image/webp' })
  @IsIn(AVATAR_MIME_TYPES)
  mimeType: AvatarMimeType;

  @ApiProperty({ maximum: MAX_AVATAR_SIZE_BYTES, example: 245000 })
  @IsInt()
  @Min(1)
  @Max(MAX_AVATAR_SIZE_BYTES)
  sizeBytes: number;
}
