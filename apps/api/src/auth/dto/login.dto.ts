import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'alice@connected-neighbours.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'alice123' })
  @IsString()
  @MinLength(6)
  password: string;
}
