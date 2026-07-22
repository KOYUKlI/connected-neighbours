import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../role.enum';

export type UserDocument = HydratedDocument<User>;

export enum ProfileVisibility {
  NEIGHBORHOOD = 'neighborhood',
  PRIVATE = 'private',
}

export enum NeighborhoodAssignmentSource {
  ADMIN = 'admin',
  RESIDENT_CONFIRMATION = 'resident_confirmation',
  SEED = 'seed',
  SYSTEM = 'system',
}

export type NeighborhoodAssignmentHistoryEntry = {
  previousNeighborhoodId: string | null;
  neighborhoodId: string;
  source: NeighborhoodAssignmentSource;
  actorId: string;
  reason: string | null;
  occurredAt: Date;
};

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ required: true, type: String, enum: Role, default: Role.RESIDENT })
  role: Role;

  @Prop({ required: true, trim: true })
  neighborhoodId: string;

  @Prop({ type: String, trim: true, default: null, select: false })
  pendingNeighborhoodId: string | null;

  @Prop({ type: Date, default: null, select: false })
  pendingNeighborhoodExpiresAt: Date | null;

  @Prop({ type: Date, default: null })
  neighborhoodAssignedAt: Date | null;

  @Prop({
    type: String,
    enum: NeighborhoodAssignmentSource,
    default: NeighborhoodAssignmentSource.SYSTEM,
  })
  neighborhoodAssignmentSource: NeighborhoodAssignmentSource;

  @Prop({ type: String, default: null })
  neighborhoodAssignmentActorId: string | null;

  @Prop({ type: [Object], default: [] })
  neighborhoodAssignmentHistory: NeighborhoodAssignmentHistoryEntry[];

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, default: 100, min: 0 })
  pointsBalance: number;

  @Prop({ required: true, default: 0, min: 0 })
  reservedPoints: number;

  @Prop({ type: String, trim: true, maxlength: 500, default: '' })
  bio: string;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ type: String, trim: true, default: null })
  avatarFileId: string | null;

  @Prop({
    type: String,
    enum: ProfileVisibility,
    default: ProfileVisibility.NEIGHBORHOOD,
  })
  profileVisibility: ProfileVisibility;

  @Prop({ type: Boolean, default: true })
  showNeighborhood: boolean;

  @Prop({ type: Boolean, default: true })
  showReviews: boolean;

  @Prop({ type: Boolean, default: true })
  showCompletedServices: boolean;

  @Prop({ type: Boolean, default: true })
  showReputation: boolean;

  @Prop({ type: Date, default: null })
  profileUpdatedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
