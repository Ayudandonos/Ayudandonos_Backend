import type { Request, Response } from 'express';
import { DonationStatus } from '@prisma/client';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { AppError } from '../../shared/errors/app.error.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import type { AuthenticatedRequest } from '../../types/express.d.js';
import { donationsService } from './donations.service.js';
import type {
  CreateDonationInput,
  CreateMessageInput,
  DonationIdParamInput,
  ListDonationsQueryInput,
  ListMessagesQueryInput,
  UpdateDonationStatusInput,
} from './donations.validations.js';

export class DonationsController {
  /**
   * Entrada: req: peticion autenticada USER con body de creacion; res: respuesta HTTP.
   * Proceso: Delega la creacion del compromiso de donacion al servicio.
   * Salida: No retorna valor; responde 201 con la donacion creada.
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const user = this.requireUser(req);
    const body = req.body as CreateDonationInput;
    const data = await donationsService.create(body, user.id);

    res.status(201).json(
      ApiResponseBuilder.success(data, API_MESSAGES.DONATIONS_CREATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada USER; res: respuesta HTTP.
   * Proceso: Delega el listado paginado de donaciones del donante al servicio.
   * Salida: No retorna valor; responde 200 con listado y meta.
   */
  findMine = asyncHandler(async (req: Request, res: Response) => {
    const user = this.requireUser(req);
    const query = req.query as unknown as ListDonationsQueryInput;
    const result = await donationsService.listMine(query, user.id);

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.DONATIONS_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion autenticada con id en params; res: respuesta HTTP.
   * Proceso: Delega la obtencion de detalle al servicio de donaciones.
   * Salida: No retorna valor; responde 200 con detalle de la donacion.
   */
  findById = asyncHandler(async (req: Request, res: Response) => {
    const user = this.requireUser(req);
    const { id } = req.params as DonationIdParamInput;
    const data = await donationsService.getById(id, user);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.DONATIONS_FOUND_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id y body de estado; res: respuesta HTTP.
   * Proceso: Delega la actualizacion de estado al servicio segun rol del usuario.
   * Salida: No retorna valor; responde 200 con donacion actualizada.
   */
  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const user = this.requireUser(req);
    const { id } = req.params as DonationIdParamInput;
    const body = req.body as UpdateDonationStatusInput;
    const data = await donationsService.updateStatus(id, body, user);

    const message =
      body.status === DonationStatus.RECEIVED
        ? API_MESSAGES.DONATIONS_RECEIVE_SUCCESS
        : API_MESSAGES.DONATIONS_STATUS_UPDATE_SUCCESS;

    res.status(200).json(ApiResponseBuilder.success(data, message));
  });

  /**
   * Entrada: req: peticion autenticada con id de donacion; res: respuesta HTTP.
   * Proceso: Delega el listado de mensajes de la conversacion al servicio.
   * Salida: No retorna valor; responde 200 con mensajes y meta.
   */
  listMessages = asyncHandler(async (req: Request, res: Response) => {
    const user = this.requireUser(req);
    const { id } = req.params as DonationIdParamInput;
    const query = req.query as unknown as ListMessagesQueryInput;
    const result = await donationsService.listMessages(id, query, user);

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.MESSAGES_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion autenticada con cuerpo de mensaje; res: respuesta HTTP.
   * Proceso: Delega el envio de mensaje en la conversacion de la donacion.
   * Salida: No retorna valor; responde 201 con el mensaje creado.
   */
  createMessage = asyncHandler(async (req: Request, res: Response) => {
    const user = this.requireUser(req);
    const { id } = req.params as DonationIdParamInput;
    const body = req.body as CreateMessageInput;
    const data = await donationsService.createMessage(id, body, user);

    res.status(201).json(
      ApiResponseBuilder.success(data, API_MESSAGES.MESSAGES_CREATE_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada con id de donacion; res: respuesta HTTP.
   * Proceso: Delega la confirmacion de lectura de mensajes al servicio.
   * Salida: No retorna valor; responde 200.
   */
  markMessagesRead = asyncHandler(async (req: Request, res: Response) => {
    const user = this.requireUser(req);
    const { id } = req.params as DonationIdParamInput;
    await donationsService.markMessagesAsRead(id, user);

    res.status(200).json(
      ApiResponseBuilder.success(null, API_MESSAGES.MESSAGES_MARK_READ_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada.
   * Proceso: Exige usuario autenticado en la peticion.
   * Salida: Retorna el usuario o lanza AppError 401.
   */
  private requireUser(req: Request) {
    const { user } = req as AuthenticatedRequest;

    if (!user) {
      throw new AppError(API_MESSAGES.AUTH_UNAUTHORIZED, 401);
    }

    return user;
  }
}

export const donationsController = new DonationsController();
