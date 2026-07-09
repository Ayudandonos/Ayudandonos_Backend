import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env.config.js';

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
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Servidor de desarrollo',
      },
    ],
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
            meta: { type: 'object' },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error en la operación' },
            errors: { type: 'object' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
