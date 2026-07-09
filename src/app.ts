import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { corsConfig } from './config/cors.config.js';
import { rateLimitConfig } from './config/rate-limit.config.js';
import { isDevelopment } from './config/env.config.js';
import { apiRouter } from './routes/index.js';
import { swaggerSpec } from './docs/swagger.config.js';
import { errorHandler, notFoundHandler } from './middlewares/index.js';

// Entrada:
// Ninguna.

// Proceso:
// Configura middlewares de seguridad, parsing, logging, Swagger y rutas de la API.

// Salida:
// Retorna la instancia de Express configurada y lista para escuchar peticiones.
export function createApp(): Express {
  const app = express();

  // Seguridad
  app.use(helmet());
  app.use(cors(corsConfig));
  app.use(rateLimit(rateLimitConfig));

  // Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Documentación Swagger
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Rutas API
  app.use('/api/v1', apiRouter);

  // Manejo de errores
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
