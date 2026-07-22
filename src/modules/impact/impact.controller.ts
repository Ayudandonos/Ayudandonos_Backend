import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import { impactService } from './impact.service.js';

export class ImpactController {
  /**
   * Entrada: _req: peticion publica; res: respuesta HTTP.
   * Proceso: Delega la agregacion de estadisticas publicas de impacto al servicio.
   * Salida: No retorna valor; responde 200 con contadores reales.
   */
  getPublicStats = asyncHandler(async (_req: Request, res: Response) => {
    const data = await impactService.getPublicStats();

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.IMPACT_STATS_SUCCESS),
    );
  });
}

export const impactController = new ImpactController();
