import swaggerJsdoc from 'swagger-jsdoc';
import { env, isDevelopment } from '../config/env.config.js';

const servers: { url: string; description: string }[] = [];

if (env.VERCEL_URL) {
  servers.push({
    url: `https://${env.VERCEL_URL}/api/v1`,
    description: 'Vercel (produccion)',
  });
}

servers.push({
  url: `http://localhost:${env.PORT}/api/v1`,
  description: isDevelopment ? 'Desarrollo local' : 'Local',
});

const apiDocGlobs = isDevelopment
  ? ['./src/routes/*.ts', './src/modules/**/*.routes.ts']
  : ['./dist/routes/*.js', './dist/modules/**/*.routes.js'];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ayudándonos API',
      version: '1.0.0',
      description:
        'API REST para la plataforma Ayudándonos — conexión entre fundaciones y donantes en especie.',
      contact: {
        name: 'Ayudándonos',
      },
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operación exitosa' },
            data: { type: 'object' },
            errors: { type: 'null', example: null },
            meta: { type: 'object' },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error en la operación' },
            data: { type: 'null', example: null },
            errors: { type: 'object', nullable: true },
          },
        },
      },
    },
  },
  apis: apiDocGlobs,
};

export const swaggerSpec = swaggerJsdoc(options);
