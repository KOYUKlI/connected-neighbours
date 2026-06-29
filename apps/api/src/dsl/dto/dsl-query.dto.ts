import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class DslQueryDto {
  @ApiProperty({
    example: 'FIND incidents WHERE severity = "high" AND status != "closed"',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Nombre maximal de resultats, plafonne a 100 cote service.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
