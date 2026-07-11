import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';

export class DonationsController {
  /**
   * Entrada: _req: peticion HTTP; res: respuesta HTTP.
   * Proceso: Responde con estado 501 indicando que el endpoint esta pendiente de implementacion.
   * Salida: No retorna valor; envia respuesta JSON de endpoint en desarrollo.
   */
  findAll = asyncHandler(async (_req: Request, res: Response) => {
    res.status(501).json(
      ApiResponseBuilder.error(API_MESSAGES.ENDPOINT_IN_DEVELOPMENT),
    );
  });
}

export const donationsController = new DonationsController();
