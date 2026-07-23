import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Length, Max, Min } from 'class-validator';

export const PROOF_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export const PROOF_DOCUMENT_MIME_TYPES = ['application/pdf'] as const;
export const PROOF_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
] as const;
export const PROOF_MIME_TYPES = [
  ...PROOF_IMAGE_MIME_TYPES,
  ...PROOF_DOCUMENT_MIME_TYPES,
  ...PROOF_AUDIO_MIME_TYPES,
] as const;

export type ProofMimeType = (typeof PROOF_MIME_TYPES)[number];
export type ProofFileKind = 'image' | 'document' | 'audio';

export const MAX_PROOF_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_PROOF_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024;
export const MAX_PROOF_AUDIO_SIZE_BYTES = 25 * 1024 * 1024;

export class PresignProofUploadDto {
  @ApiProperty({ example: 'photo-realisation.webp' })
  @IsString()
  @Length(1, 255)
  filename: string;

  @ApiProperty({ enum: PROOF_MIME_TYPES, example: 'image/webp' })
  @IsIn(PROOF_MIME_TYPES)
  mimeType: ProofMimeType;

  @ApiProperty({ maximum: MAX_PROOF_AUDIO_SIZE_BYTES, example: 245000 })
  @IsInt()
  @Min(1)
  @Max(MAX_PROOF_AUDIO_SIZE_BYTES)
  sizeBytes: number;
}

export function getProofFileKind(mimeType: ProofMimeType): ProofFileKind {
  if ((PROOF_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return 'image';
  }
  if ((PROOF_AUDIO_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return 'audio';
  }
  return 'document';
}

export function getProofMaxSize(mimeType: ProofMimeType) {
  const kind = getProofFileKind(mimeType);
  if (kind === 'image') return MAX_PROOF_IMAGE_SIZE_BYTES;
  if (kind === 'audio') return MAX_PROOF_AUDIO_SIZE_BYTES;
  return MAX_PROOF_DOCUMENT_SIZE_BYTES;
}
