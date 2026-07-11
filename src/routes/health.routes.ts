import { Router, type Request, type Response } from 'express';
import { ApiResponseBuilder } from '../shared/responses/api.response.js';
import { asyncHandler } from '../utils/async-handler.util.js';
import { env } from '../config/env.config.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';

const healthRouter = Router();

/**
 * Entrada: _req: peticion HTTP; res: respuesta HTTP.
 * Proceso: Construye y envia la respuesta de estado del servidor con entorno, timestamp y version.
 * Salida: No retorna valor; responde con codigo 200 y el objeto de health check.
 */
const healthCheckHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(
    ApiResponseBuilder.success(
      {
        status: 'ok',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      API_MESSAGES.SUCCESS_DEFAULT,
    ),
  );
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verificar estado del servidor
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servidor operativo
 */
healthRouter.get('/', healthCheckHandler);

export { healthRouter };
