import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class AssignUserNeighborhoodDto {
  @ApiProperty({ example: '665f22bd8bc7b9564f4a9201' })
  @IsMongoId()
  userId: string;

  @ApiProperty({
    example: 'Justificatif de domicile vérifié par la modération.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  justification: string;
}
