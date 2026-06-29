import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({
    example: 'Bonjour, je suis disponible samedi et j’ai deja garde des enfants.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: '2026-07-04T14:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  proposedDate?: Date;

  @ApiPropertyOptional({ example: 40, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  proposedPricePoints?: number;
}
