import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RevokeIdentitySessionsDto {
  @ApiProperty({
    example: 'Compte potentiellement compromis, révocation demandée.',
    maxLength: 300,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  reason: string;
}
