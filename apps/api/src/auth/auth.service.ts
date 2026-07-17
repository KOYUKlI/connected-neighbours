import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const passwordOk = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordOk) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      neighborhoodId: user.neighborhoodId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.usersService.toPublicUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur introuvable ou inactif');
    }

    return this.usersService.toPublicUser(user);
  }

  async neighbours(userId: string, neighborhoodId: string) {
    const users = await this.usersService.findByNeighborhood(
      neighborhoodId,
      userId,
    );

    return users.map((user) => this.usersService.toPublicUser(user));
  }
}
