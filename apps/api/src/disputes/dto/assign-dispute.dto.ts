import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class AssignDisputeDto {
  @ApiPropertyOptional({
    description:
      'Modérateur ciblé. Sans valeur, le litige est assigné à l’acteur courant.',
  })
  @IsOptional()
  @IsMongoId()
  moderatorId?: string;
}
