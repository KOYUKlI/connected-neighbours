import cors from 'cors';
import express, { type NextFunction, type Request, type Response, type RequestHandler } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { corsOrigins, env } from '../config/env.js';
import { registerModules } from '../modules/register-modules.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  const httpLogger = pinoHttp as unknown as () => RequestHandler;
  app.use(httpLogger());
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.4',
      info: {
        title: 'Connected Neighbours API',
        version: '0.1.0',
        description: 'API de développement'
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`
        }
      ]
    },
    apis: ['src/modules/**/*.ts']
  });

  app.get('/api', (_req, res) => {
    res.json({
      name: 'Connected Neighbours API',
      version: '0.1.0',
      docs: '/docs'
    });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  registerModules(app);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  return app;
}