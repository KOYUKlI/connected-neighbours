import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PasswordService } from './password.service';
import { Role } from './role.enum';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly passwordService: PasswordService,
  ) {}

  async onModuleInit() {
    if (process.env.DEV_AUTH_SEED !== 'true') {
      return;
    }

    await this.ensureDevUser({
      email: 'resident@connected.local',
      displayName: 'Resident Demo',
      role: Role.RESIDENT,
      neighborhoodId: 'quartier-centre',
      password: 'resident123',
    });

    await this.ensureDevUser({
      email: 'moderator@connected.local',
      displayName: 'Moderator Demo',
      role: Role.MODERATOR,
      neighborhoodId: 'quartier-centre',
      password: 'moderator123',
    });

    await this.ensureDevUser({
      email: 'admin@connected.local',
      displayName: 'Admin Demo',
      role: Role.ADMIN,
      neighborhoodId: 'quartier-centre',
      password: 'admin123',
    });
  }

  async ensureDevUser(input: {
    email: string;
    displayName: string;
    role: Role;
    neighborhoodId: string;
    password: string;
  }) {
    const existing = await this.userModel.findOne({ email: input.email }).exec();

    if (existing) {
      return existing;
    }

    const passwordHash = await this.passwordService.hash(input.password);

    return this.userModel.create({
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      neighborhoodId: input.neighborhoodId,
      passwordHash,
      isActive: true,
    });
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  toPublicUser(user: UserDocument) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      neighborhoodId: user.neighborhoodId,
      isActive: user.isActive,
    };
  }
}