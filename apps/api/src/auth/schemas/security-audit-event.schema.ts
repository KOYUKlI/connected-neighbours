import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SecurityAuditEventDocument = HydratedDocument<SecurityAuditEvent>;

export enum SecurityEventType {
  LOGIN_LOCAL_SUCCESS = 'login_local_success',
  LOGIN_LOCAL_FAILURE = 'login_local_failure',
  LOGIN_KEYCLOAK_SUCCESS = 'login_keycloak_success',
  IDENTITY_PROVISIONED = 'identity_provisioned',
  IDENTITY_LINK_REQUESTED = 'identity_link_requested',
  IDENTITY_LINKED = 'identity_linked',
  IDENTITY_LINK_FAILED = 'identity_link_failed',
  ACCOUNT_DISABLED_REJECTION = 'account_disabled_rejection',
  LOGOUT = 'logout',
  LOGOUT_ALL = 'logout_all',
  ADMIN_SESSION_REVOKED = 'admin_session_revoked',
  ADMIN_ACCOUNT_ACTION_REQUESTED = 'admin_account_action_requested',
  EMAIL_VERIFICATION_REQUESTED = 'email_verification_requested',
  PASSWORD_CHANGE_REQUESTED = 'password_change_requested',
  MFA_SETUP_REQUESTED = 'mfa_setup_requested',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
}

export enum SecurityEventResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  DENIED = 'denied',
}

@Schema({ timestamps: true, versionKey: false })
export class SecurityAuditEvent {
  @Prop({ type: String, default: null, index: true })
  userId: string | null;

  @Prop({ required: true, enum: ['local', 'keycloak', 'system'] })
  provider: string;

  @Prop({ required: true, enum: SecurityEventType, index: true })
  eventType: SecurityEventType;

  @Prop({ required: true, enum: SecurityEventResult })
  result: SecurityEventResult;

  @Prop({ type: Date, default: Date.now, index: true })
  occurredAt: Date;

  @Prop({ type: Object, default: {} })
  context: Record<string, string | number | boolean | null>;
}

export const SecurityAuditEventSchema =
  SchemaFactory.createForClass(SecurityAuditEvent);

SecurityAuditEventSchema.index({ userId: 1, occurredAt: -1 });
