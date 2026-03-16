import type { Express } from 'express';
import { healthRouter } from './health/health.route.js';

export function registerModules(app: Express) {
  app.use('/api', healthRouter);
}