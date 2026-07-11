import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import type { AuthenticatedRequest } from '../../types/express.d.js';
import { foundationsService } from './foundations.service.js';
import type {
  FoundationDocumentTypeParamInput,
  FoundationIdParamInput,
  ListFoundationsQueryInput,
  UpdateFoundationInput,
  UpdateFoundationStatusInput,
  UploadDocumentBodyInput,
} from './foundations.validations.js';

export class FoundationsController {
  /**
   * Entrada: req: peticion con query de paginacion y filtros; res: respuesta HTTP.
   * Proceso: Delega el listado paginado al servicio de fundaciones.
   * Salida: No retorna valor; responde 200 con listado, meta y stats opcional.
   */
  findAll = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListFoundationsQueryInput;
    const result = await foundationsService.listFoundations(query, req.user);

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.FOUNDATIONS_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion con id en params; res: respuesta HTTP.
   * Proceso: Delega la obtencion de detalle al servicio de fundaciones.
   * Salida: No retorna valor; responde 200 con detalle de la fundacion.
   */
  findById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as FoundationIdParamInput;
    const data = await foundationsService.getFoundationById(id, req.user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.FOUNDATIONS_FOUND_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada de fundacion; res: respuesta HTTP.
   * Proceso: Delega la obtencion del perfil propio al servicio de fundaciones.
   * Salida: No retorna valor; responde 200 con detalle de la fundacion propia.
   */
  findMine = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const data = await foundationsService.getMyFoundation(user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.FOUNDATIONS_FOUND_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id y body de actualizacion; res: respuesta HTTP.
   * Proceso: Delega la actualizacion de perfil al servicio de fundaciones.
   * Salida: No retorna valor; responde 200 con fundacion actualizada.
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params as FoundationIdParamInput;
    const body = req.body as UpdateFoundationInput;
    const data = await foundationsService.updateFoundation(id, body, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.FOUNDATIONS_UPDATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id y body de estado; res: respuesta HTTP.
   * Proceso: Delega la actualizacion administrativa de estado al servicio.
   * Salida: No retorna valor; responde 200 con fundacion actualizada.
   */
  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params as FoundationIdParamInput;
    const body = req.body as UpdateFoundationStatusInput;
    const data = await foundationsService.updateFoundationStatus(id, body, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.FOUNDATIONS_STATUS_UPDATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion multipart con logo; res: respuesta HTTP.
   * Proceso: Delega la carga de logo al servicio de fundaciones.
   * Salida: No retorna valor; responde 200 con fundacion actualizada.
   */
  uploadLogo = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params as FoundationIdParamInput;
    const data = await foundationsService.uploadLogo(id, req.file as Express.Multer.File, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.FOUNDATIONS_LOGO_UPLOAD_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion multipart con archivo y tipo documental; res: respuesta HTTP.
   * Proceso: Delega la carga de documento legal al servicio de fundaciones.
   * Salida: No retorna valor; responde 200 con fundacion actualizada.
   */
  uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params as FoundationIdParamInput;
    const { type } = req.body as UploadDocumentBodyInput;
    const data = await foundationsService.uploadDocument(
      id,
      type,
      req.file as Express.Multer.File,
      user,
    );

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.FOUNDATIONS_DOCUMENT_UPLOAD_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id y tipo documental; res: respuesta HTTP.
   * Proceso: Resuelve archivo en disco y lo envia como descarga autenticada.
   * Salida: No retorna valor; responde con el archivo adjunto.
   */
  downloadDocument = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id, type } = req.params as FoundationDocumentTypeParamInput;
    const file = await foundationsService.getDocumentDownload(id, type, user);

    res.download(file.absolutePath, file.fileName, {
      headers: { 'Content-Type': file.mimeType },
    });
  });
}

export const foundationsController = new FoundationsController();
