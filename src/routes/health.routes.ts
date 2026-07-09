import { Router, type Request, type Response } from 'express';
import { ApiResponseBuilder } from '../shared/responses/api.response.js';
import { asyncHandler } from '../utils/async-handler.util.js';
import { env } from '../config/env.config.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';

const healthRouter = Router();

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
healthRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    // Entrada:
    // _req: petición HTTP; res: respuesta HTTP.

    // Proceso:
    // Construye y envía la respuesta de estado del servidor con entorno, timestamp y versión.

    // Salida:
    // No retorna valor; responde con código 200 y el objeto de health check.
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
  }),
);

export { healthRouter };
