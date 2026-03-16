import { Router } from 'express';

export const healthRouter = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Vérifie que l'API répond
 *     responses:
 *       200:
 *         description: API disponible
 */
healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString()
  });
});