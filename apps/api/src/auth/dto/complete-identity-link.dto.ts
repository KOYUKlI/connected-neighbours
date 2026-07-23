import { IsString, Length } from 'class-validator';

export class CompleteIdentityLinkDto {
  @IsString()
  @Length(32, 256)
  linkToken: string;
}
