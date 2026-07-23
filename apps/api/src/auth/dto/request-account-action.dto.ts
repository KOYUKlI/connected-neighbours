import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum AccountSecurityAction {
  VERIFY_EMAIL = 'verify_email',
  UPDATE_PASSWORD = 'update_password',
  CONFIGURE_TOTP = 'configure_totp',
}

export class RequestAccountActionDto {
  @ApiProperty({ enum: AccountSecurityAction })
  @IsEnum(AccountSecurityAction)
  action: AccountSecurityAction;
}
