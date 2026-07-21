import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { AppError } from '../../shared/errors/app.error.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import type { AuthenticatedRequest } from '../../types/express.d.js';
import { needsService } from './needs.service.js';
import type {
  CreateNeedInput,
  ListNeedsQueryInput,
  NeedIdParamInput,
  UpdateNeedInput,
} from './needs.validations.js';

export class NeedsController {
  /**
   * Entrada: req: peticion con campaignId y paginacion; res: respuesta HTTP.
   * Proceso: Delega el listado publico de necesidades por campana al servicio.
   * Salida: No retorna valor; responde 200 con listado y meta.
   */
  findAll = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListNeedsQueryInput;
    const result = await needsService.listByCampaign(query);

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.NEEDS_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion con id en params; res: respuesta HTTP.
   * Proceso: Delega la obtencion de detalle de necesidad al servicio.
   * Salida: No retorna valor; responde 200 con la necesidad.
   */
  findById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as NeedIdParamInput;
    const data = await needsService.getById(id);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.NEEDS_FOUND_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada con body de creacion; res: respuesta HTTP.
   * Proceso: Delega la creacion de necesidad al servicio.
   * Salida: No retorna valor; responde 201 con necesidad creada.
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const body = req.body as CreateNeedInput;
    const data = await needsService.create(body, foundation);

    res.status(201).json(
      ApiResponseBuilder.success(data, API_MESSAGES.NEEDS_CREATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id y body de actualizacion; res: respuesta HTTP.
   * Proceso: Delega la actualizacion de necesidad propia al servicio.
   * Salida: No retorna valor; responde 200 con necesidad actualizada.
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const { id } = req.params as NeedIdParamInput;
    const body = req.body as UpdateNeedInput;
    const data = await needsService.update(id, body, foundation);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.NEEDS_UPDATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada con id en params; res: respuesta HTTP.
   * Proceso: Delega el soft delete de necesidad propia al servicio.
   * Salida: No retorna valor; responde 200 confirmando eliminacion.
   */
  remove = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const { id } = req.params as NeedIdParamInput;
    await needsService.remove(id, foundation);

    res.status(200).json(
      ApiResponseBuilder.success(null, API_MESSAGES.NEEDS_DELETE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada de fundacion.
   * Proceso: Exige que el middleware haya adjuntado la fundacion operativa.
   * Salida: Retorna la fundacion o lanza AppError 404.
   */
  private requireFoundation(req: Request) {
    const { foundation } = req as AuthenticatedRequest;

    if (!foundation) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
    }

    return foundation;
  }
}

export const needsController = new NeedsController();
