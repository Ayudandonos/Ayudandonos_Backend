import { Router } from 'express';
import { ApiResponseBuilder } from '../shared/responses/api.response.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';
import { asyncHandler } from '../utils/async-handler.util.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireFoundationOperational } from '../middlewares/foundation-access.middleware.js';

const foundationOperationalRouter = Router();

/**
 * Entrada: Ninguna (fundacion autenticada y verificada).
 * Proceso: Reserva el endpoint de solicitudes de ayuda para la fase de donaciones.
 * Salida: No retorna valor; responde 501 indicando endpoint en desarrollo.
 */
const listFoundationRequestsHandler = asyncHandler(async (_req, res) => {
  res.status(501).json(
    ApiResponseBuilder.error(API_MESSAGES.ENDPOINT_IN_DEVELOPMENT),
  );
});

foundationOperationalRouter.get(
  '/requests',
  authenticate,
  requireFoundationOperational,
  listFoundationRequestsHandler,
);

export { foundationOperationalRouter };
