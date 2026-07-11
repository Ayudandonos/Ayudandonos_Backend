import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../shared/responses/api.response.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';

/**
 * Entrada: _req: petición HTTP; res: respuesta HTTP.
 * Proceso: Responde con código 404 cuando la ruta solicitada no existe en la API.
 * Salida: No retorna valor; envía la respuesta JSON de ruta no encontrada.
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json(
    ApiResponseBuilder.error(API_MESSAGES.ROUTE_NOT_FOUND),
  );
};
