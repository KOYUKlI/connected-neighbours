import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../role.enum';

export type UserDocument = HydratedDocument<User>;

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

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, default: 100, min: 0 })
  pointsBalance: number;

  @Prop({ required: true, default: 0, min: 0 })
  reservedPoints: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
