import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';

export class NeedsController {
  findAll = asyncHandler(async (_req: Request, res: Response) => {
    // Entrada:
    // _req: petición HTTP; res: respuesta HTTP.

    // Proceso:
    // Responde con estado 501 indicando que el endpoint está pendiente de implementación.

    // Salida:
    // No retorna valor; envía respuesta JSON de endpoint en desarrollo.
    res.status(501).json(
      ApiResponseBuilder.error(API_MESSAGES.ENDPOINT_IN_DEVELOPMENT),
    );
  });
}

export const needsController = new NeedsController();
