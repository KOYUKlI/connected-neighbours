import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HomeService } from './home.service';

@ApiTags('Home')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({ summary: "Charger l'accueil personnel de l'habitant" })
  @ApiOkResponse({
    description:
      'Profil, points, actions personnelles et activite recente du quartier.',
    schema: {
      example: {
        profile: {
          id: '665f22bd8bc7b9564f4a9201',
          displayName: 'Alice Martin',
          neighborhood: {
            id: '665f21ae8bc7b9564f4a9101',
            name: 'Quartier Centre',
            city: 'Paris',
            postalCode: '75001',
          },
        },
        points: { availablePoints: 75, reservedPoints: 25 },
        todoItems: [
          {
            type: 'sign_contract',
            serviceTitle: 'Aide pour monter un meuble',
          },
        ],
        recentServices: [],
        recentIncidents: [],
        counts: { createdServices: 2, applications: 0, contracts: 1 },
      },
    },
  })
  getHome(@CurrentUser() user: AuthenticatedUser) {
    return this.homeService.getHome(user);
  }
}
