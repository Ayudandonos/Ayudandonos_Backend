import { Router } from 'express';
import { ApiResponseBuilder } from '../shared/responses/api.response.js';
import { API_MESSAGES } from '../shared/constants/messages.constants.js';
import { asyncHandler } from '../utils/async-handler.util.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireFoundationOperational } from '../middlewares/foundation-access.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { AppError } from '../shared/errors/app.error.js';
import type { AuthenticatedRequest } from '../types/express.d.js';
import { donationsService } from '../modules/donations/donations.service.js';
import {
  listDonationsQuerySchema,
  type ListDonationsQueryInput,
} from '../modules/donations/donations.validations.js';

const foundationOperationalRouter = Router();

/**
 * @swagger
 * tags:
 *   name: FoundationRequests
 *   description: Solicitudes de donacion recibidas por la fundacion operativa
 */

/**
 * @swagger
 * /foundation/requests:
 *   get:
 *     summary: Listar solicitudes de donacion de la fundacion
 *     tags: [FoundationRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [COMMITTED, IN_TRANSIT, DELIVERED, CONFIRMED, CANCELLED]
 *     responses:
 *       200:
 *         description: Listado obtenido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Fundacion no operativa
 */

/**
 * Entrada: req: fundacion autenticada y operativa; res: respuesta HTTP.
 * Proceso: Lista solicitudes de donacion recibidas por la fundacion con paginacion.
 * Salida: No retorna valor; responde 200 con listado y meta.
 */
const listFoundationRequestsHandler = asyncHandler(async (req, res) => {
  const { foundation } = req as AuthenticatedRequest;
  const query = req.query as unknown as ListDonationsQueryInput;

  if (!foundation) {
    throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
  }

  const result = await donationsService.listFoundationRequests(foundation.id, query);

  res.status(200).json(
    ApiResponseBuilder.success(
      result.data,
      API_MESSAGES.DONATIONS_LIST_SUCCESS,
      result.meta,
    ),
  );
});

foundationOperationalRouter.get(
  '/requests',
  authenticate,
  requireFoundationOperational,
  validate(listDonationsQuerySchema, 'query'),
  listFoundationRequestsHandler,
);

export { foundationOperationalRouter };
