import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { AppError } from '../../shared/errors/app.error.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import type { AuthenticatedRequest } from '../../types/express.d.js';
import { campaignsService } from './campaigns.service.js';
import type {
  CampaignIdParamInput,
  CreateCampaignInput,
  ListCampaignsQueryInput,
  UpdateCampaignInput,
} from './campaigns.validations.js';

export class CampaignsController {
  /**
   * Entrada: req: peticion con query de paginacion; res: respuesta HTTP.
   * Proceso: Delega el listado publico de campanas publicadas al servicio.
   * Salida: No retorna valor; responde 200 con listado y meta.
   */
  findAll = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListCampaignsQueryInput;
    const result = await campaignsService.listPublished(query);

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.CAMPAIGNS_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion autenticada de fundacion operativa; res: respuesta HTTP.
   * Proceso: Delega el listado de campanas propias al servicio.
   * Salida: No retorna valor; responde 200 con listado y meta.
   */
  findMine = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const query = req.query as unknown as ListCampaignsQueryInput;
    const result = await campaignsService.listMine(query, foundation);

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.CAMPAIGNS_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion con id en params; res: respuesta HTTP.
   * Proceso: Delega la obtencion de detalle al servicio de campanas.
   * Salida: No retorna valor; responde 200 con detalle de la campana.
   */
  findById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as CampaignIdParamInput;
    const data = await campaignsService.getById(id, req.user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.CAMPAIGNS_FOUND_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada con body de creacion; res: respuesta HTTP.
   * Proceso: Delega la creacion de campana al servicio.
   * Salida: No retorna valor; responde 201 con campana creada.
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const body = req.body as CreateCampaignInput;
    const data = await campaignsService.create(body, foundation);

    res.status(201).json(
      ApiResponseBuilder.success(data, API_MESSAGES.CAMPAIGNS_CREATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id y body de actualizacion; res: respuesta HTTP.
   * Proceso: Delega la actualizacion de campana propia al servicio.
   * Salida: No retorna valor; responde 200 con campana actualizada.
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const { id } = req.params as CampaignIdParamInput;
    const body = req.body as UpdateCampaignInput;
    const data = await campaignsService.update(id, body, foundation);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.CAMPAIGNS_UPDATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada con id en params; res: respuesta HTTP.
   * Proceso: Delega el soft delete de campana propia al servicio.
   * Salida: No retorna valor; responde 200 confirmando eliminacion.
   */
  remove = asyncHandler(async (req: Request, res: Response) => {
    const foundation = this.requireFoundation(req);
    const { id } = req.params as CampaignIdParamInput;
    await campaignsService.remove(id, foundation);

    res.status(200).json(
      ApiResponseBuilder.success(null, API_MESSAGES.CAMPAIGNS_DELETE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada de fundacion.
   * Proceso: Exige que el middleware haya adjuntado la fundacion operativa.
   * Salida: Retorna la fundacion o lanza AppError 403.
   */
  private requireFoundation(req: Request) {
    const { foundation } = req as AuthenticatedRequest;

    if (!foundation) {
      throw new AppError(API_MESSAGES.FOUNDATIONS_NOT_FOUND, 404);
    }

    return foundation;
  }
}

export const campaignsController = new CampaignsController();
