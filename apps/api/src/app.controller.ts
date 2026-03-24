import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'Connected Neighbours API',
      docs: '/docs',
      api: '/api',
      health: '/api/health',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'connected-neighbours-api',
    };
  }
}