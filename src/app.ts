import path from 'node:path';
import express, { type Express, type RequestHandler } from 'express';
import cors from 'cors';
import helmetImport from 'helmet';
import morgan from 'morgan';
import rateLimitImport from 'express-rate-limit';
import type { RateLimitRequestHandler } from 'express-rate-limit';
import type { HelmetOptions } from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { corsConfig } from './config/cors.config.js';
import { rateLimitConfig } from './config/rate-limit.config.js';
import { isDevelopment, uploadConfig } from './config/env.config.js';
import { apiRouter } from './routes/index.js';
import { swaggerSpec } from './docs/swagger.config.js';
import { errorHandler, notFoundHandler } from './middlewares/index.js';
import { ApiResponseBuilder } from './shared/responses/api.response.js';
import { API_MESSAGES } from './shared/constants/messages.constants.js';
import { resolveDefaultImport } from './utils/resolve-default-import.util.js';

type HelmetMiddleware = (options?: Readonly<HelmetOptions>) => RequestHandler;
type RateLimitMiddleware = (options: typeof rateLimitConfig) => RateLimitRequestHandler;

const helmet = resolveDefaultImport<HelmetMiddleware>(helmetImport);
const rateLimit = resolveDefaultImport<RateLimitMiddleware>(rateLimitImport);

/**
 * Entrada: Ninguna.
 * Proceso: Configura middlewares de seguridad, parsing, logging, Swagger y rutas de la API.
 * Salida: Retorna la instancia de Express configurada y lista para escuchar peticiones.
 */
export function createApp(): Express {
  const app = express();

  // cross-origin: el frontend (otro origen) puede embeber /uploads y assets de la API.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors(corsConfig));
  app.use(rateLimit(rateLimitConfig));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    '/uploads/foundations',
    express.static(path.join(uploadConfig.rootDir, uploadConfig.foundationsDir)),
  );

  if (isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  const apiRootPayload = {
    name: 'Ayudandonos API',
    version: '1.0.0',
    basePath: '/api/v1',
    health: '/api/v1/health',
    docs: '/api/v1/docs',
    auth: '/api/v1/auth',
    users: '/api/v1/users',
    foundations: '/api/v1/foundations',
  };

  app.get(['/', '/api/v1'], (_req, res) => {
    res.status(200).json(
      ApiResponseBuilder.success(apiRootPayload, API_MESSAGES.API_ROOT_INFO),
    );
  });

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
