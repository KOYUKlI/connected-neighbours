import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RecommendationsQueryDto {
  @ApiPropertyOptional({ example: 'Bricolage' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  limit = 12;

  @ApiPropertyOptional({
    description: 'Identifiants MongoDB à exclure, séparés par des virgules.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 100)
      : value,
  )
  @IsArray()
  @IsString({ each: true })
  excludeIds: string[] = [];
}
