import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MFA_KEY = 'auth:require-mfa';
export const RequireMfa = () => SetMetadata(REQUIRE_MFA_KEY, true);
