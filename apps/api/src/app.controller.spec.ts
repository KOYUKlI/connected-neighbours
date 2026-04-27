import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should expose API metadata', () => {
      expect(appController.getRoot()).toEqual({
        message: 'Connected Neighbours API',
        docs: '/docs',
        api: '/api',
        health: '/api/health',
      });
    });
  });

  describe('health', () => {
    it('should expose a health check payload', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'connected-neighbours-api',
      });
    });
  });
});
