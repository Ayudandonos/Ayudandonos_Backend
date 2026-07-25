import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { AppError } from '../../shared/errors/app.error.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import type { AuthenticatedRequest } from '../../types/express.d.js';
import { inventoryService } from './inventory.service.js';
import { createOutboundSchema, listInventoryMovementsQuerySchema } from './inventory.validations.js';

export class InventoryController {
  /**
   * Entrada: req: peticion autenticada de fundacion; res: respuesta HTTP.
   * Proceso: Delega listado de inventario al servicio.
   * Salida: No retorna valor; responde 200 con items.
   */
  listItems = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const data = await inventoryService.listItems(foundation);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.INVENTORY_LIST_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con query de paginacion; res: respuesta HTTP.
   * Proceso: Delega listado de movimientos de inventario al servicio.
   * Salida: No retorna valor; responde 200 con movimientos y meta.
   */
  listMovements = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const query = listInventoryMovementsQuerySchema.parse(req.query);
    const result = await inventoryService.listMovements(foundation, query);

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.INVENTORY_MOVEMENTS_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion con query de paginacion; res: respuesta HTTP.
   * Proceso: Delega listado de salidas de inventario al servicio.
   * Salida: No retorna valor; responde 200 con salidas y meta.
   */
  listOutbounds = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const query = listInventoryMovementsQuerySchema.parse(req.query);
    const result = await inventoryService.listOutbounds(foundation, {
      page: query.page,
      limit: query.limit,
    });

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.INVENTORY_OUTBOUNDS_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion multipart con payload JSON e imagenes; res: respuesta HTTP.
   * Proceso: Parsea payload, valida con Zod y delega salida con post al servicio.
   * Salida: No retorna valor; responde 201 con resultado de salida y post.
   */
  createOutbound = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const auth = req as AuthenticatedRequest;
    const rawPayload = req.body.payload;

    if (typeof rawPayload !== 'string' || rawPayload.trim().length === 0) {
      throw new AppError(API_MESSAGES.VALIDATION_ERROR, 400);
    }

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(rawPayload) as unknown;
    } catch {
      throw new AppError(API_MESSAGES.VALIDATION_ERROR, 400);
    }

    const input = createOutboundSchema.parse(parsedPayload);
    const imageFiles = Array.isArray(req.files) ? req.files : [];

    const data = await inventoryService.createOutbound(
      input,
      imageFiles,
      foundation,
      auth.user!.id,
    );

    res.status(201).json(
      ApiResponseBuilder.success(data, API_MESSAGES.INVENTORY_OUTBOUND_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada de fundacion.
   * Proceso: Exige fundacion operativa adjunta por middleware.
   * Salida: Retorna fundacion o lanza AppError 404.
   */
  private requireFoundation(req: Request) {
    const { foundation } = req as AuthenticatedRequest;

    if (!foundation) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
    }

    return foundation;
  }
}

export const inventoryController = new InventoryController();
