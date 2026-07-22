import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { PresignAvatarUploadDto } from '../storage/dto/presign-avatar-upload.dto';
import { PublicUserDto } from './dto/public-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfilesService } from './user-profiles.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly userProfilesService: UserProfilesService) {}

  @Get('me/profile')
  @ApiOperation({ summary: 'Consulter son profil personnel' })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.userProfilesService.getMe(user);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Modifier les champs autorisés de son profil' })
  updateMyProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.userProfilesService.updateMe(dto, user);
  }

  @Post('me/avatar/presign')
  @ApiOperation({ summary: 'Créer une URL PUT privée pour son avatar' })
  presignAvatar(
    @Body() dto: PresignAvatarUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.userProfilesService.presignAvatar(dto, user);
  }

  @Post('me/avatar/:fileId/complete')
  @ApiOperation({ summary: 'Vérifier et associer un avatar chargé' })
  completeAvatar(
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.userProfilesService.completeAvatar(fileId, user);
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Supprimer logiquement son avatar' })
  removeAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.userProfilesService.removeAvatar(user);
  }

  @Get(':id/public')
  @ApiOperation({ summary: "Consulter le profil public minimal d'un habitant" })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiNotFoundResponse({ description: 'Compte absent ou desactive.' })
  findPublicProfile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.userProfilesService.getPublicProfile(id, user);
  }
}
