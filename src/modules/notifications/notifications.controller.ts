import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import type { AuthenticatedRequest } from '../../types/express.d.js';
import { notificationsService } from './notifications.service.js';
import type {
  ListNotificationsQueryInput,
  NotificationIdParamInput,
} from './notifications.validations.js';

export class NotificationsController {
  /**
   * Entrada: req: peticion autenticada con query; res: respuesta HTTP.
   * Proceso: Delega el listado de notificaciones del usuario.
   * Salida: No retorna valor; responde 200 con items y meta.
   */
  findMine = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const query = req.query as unknown as ListNotificationsQueryInput;
    const result = await notificationsService.listMine(user.id, query);

    res.status(200).json(
      ApiResponseBuilder.success(
        result.data,
        API_MESSAGES.NOTIFICATIONS_LIST_SUCCESS,
        result.meta,
      ),
    );
  });

  /**
   * Entrada: req: peticion autenticada; res: respuesta HTTP.
   * Proceso: Delega el conteo de no leidas.
   * Salida: No retorna valor; responde 200 con unreadCount.
   */
  unreadCount = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const data = await notificationsService.getUnreadCount(user.id);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.NOTIFICATIONS_UNREAD_COUNT_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion con id; res: respuesta HTTP.
   * Proceso: Delega marcar una notificacion como leida.
   * Salida: No retorna valor; responde 200 con la notificacion.
   */
  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params as NotificationIdParamInput;
    const data = await notificationsService.markAsRead(id, user.id);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.NOTIFICATIONS_MARK_READ_SUCCESS),
    );
  });

  /**
   * Entrada: req: peticion autenticada; res: respuesta HTTP.
   * Proceso: Delega marcar todas como leidas.
   * Salida: No retorna valor; responde 200 con updatedCount.
   */
  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const data = await notificationsService.markAllAsRead(user.id);

    res.status(200).json(
      ApiResponseBuilder.success(data, API_MESSAGES.NOTIFICATIONS_MARK_ALL_READ_SUCCESS),
    );
  });
}

export const notificationsController = new NotificationsController();
