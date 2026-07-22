import { NotificationType } from '@prisma/client';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import type { ApiResponseMeta } from '../../shared/responses/api.response.js';
import type {
  CreateNotificationDto,
  ListNotificationsQueryDto,
  NotificationDto,
  NotificationsUnreadCountDto,
} from './notifications.dto.js';
import { notificationsRepository } from './notifications.repository.js';

export class NotificationsService {
  /**
   * Entrada: userId: usuario autenticado; query: paginacion y filtro.
   * Proceso: Lista notificaciones del usuario con meta de paginacion.
   * Salida: Retorna items mapeados y meta.
   */
  async listMine(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<{ data: { items: NotificationDto[] }; meta: ApiResponseMeta }> {
    const { items, total } = await notificationsRepository.findByUserPaginated(
      userId,
      query,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: { items: items.map((item) => this.toDto(item)) },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: userId: usuario autenticado.
   * Proceso: Cuenta notificaciones no leidas.
   * Salida: Retorna el conteo.
   */
  async getUnreadCount(userId: string): Promise<NotificationsUnreadCountDto> {
    const unreadCount = await notificationsRepository.countUnread(userId);
    return { unreadCount };
  }

  /**
   * Entrada: id: identificador; userId: propietario.
   * Proceso: Marca como leida solo si pertenece al usuario.
   * Salida: Retorna la notificacion actualizada.
   */
  async markAsRead(id: string, userId: string): Promise<NotificationDto> {
    const notification = await notificationsRepository.findByIdForUser(id, userId);

    if (!notification) {
      throw new AppError(API_MESSAGES.NOTIFICATIONS_NOT_FOUND, 404);
    }

    if (notification.isRead) {
      return this.toDto(notification);
    }

    const updated = await notificationsRepository.markAsRead(id);
    return this.toDto(updated);
  }

  /**
   * Entrada: userId: usuario autenticado.
   * Proceso: Marca todas las notificaciones pendientes como leidas.
   * Salida: Retorna la cantidad actualizada.
   */
  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const updatedCount = await notificationsRepository.markAllAsRead(userId);
    return { updatedCount };
  }

  /**
   * Entrada: data: payload interno de creacion.
   * Proceso: Crea una notificacion sin exponer el endpoint al cliente.
   * Salida: Retorna void; errores de persistencia se propagan.
   */
  async createInternal(data: CreateNotificationDto): Promise<void> {
    await notificationsRepository.create(data);
  }

  /**
   * Entrada: foundationUserId, donationId, campaignTitle, donorName.
   * Proceso: Notifica a la fundacion que recibio un nuevo compromiso.
   * Salida: Retorna void.
   */
  async notifyDonationCreated(params: {
    foundationUserId: string;
    donationId: string;
    campaignTitle: string;
    donorName: string;
  }): Promise<void> {
    await this.createInternal({
      userId: params.foundationUserId,
      type: NotificationType.DONATION_CREATED,
      title: 'Nuevo compromiso de donación',
      body: `${params.donorName} se comprometió a aportar en la campaña "${params.campaignTitle}".`,
      linkPath: `/foundation/requests/${params.donationId}`,
      resourceType: 'DONATION',
      resourceId: params.donationId,
    });
  }

  /**
   * Entrada: recipientUserId, donationId, status, linkPath.
   * Proceso: Notifica cambio de estado de donacion al destinatario.
   * Salida: Retorna void.
   */
  async notifyDonationStatusChanged(params: {
    recipientUserId: string;
    donationId: string;
    status: string;
    linkPath: string;
  }): Promise<void> {
    await this.createInternal({
      userId: params.recipientUserId,
      type: NotificationType.DONATION_STATUS_CHANGED,
      title: 'Actualización de donación',
      body: `El estado de tu donación cambió a ${params.status}.`,
      linkPath: params.linkPath,
      resourceType: 'DONATION',
      resourceId: params.donationId,
    });
  }

  /**
   * Entrada: recipientUserId, donationId, senderName, linkPath.
   * Proceso: Notifica un mensaje nuevo en el chat de la donacion.
   * Salida: Retorna void.
   */
  async notifyDonationMessage(params: {
    recipientUserId: string;
    donationId: string;
    senderName: string;
    linkPath: string;
  }): Promise<void> {
    await this.createInternal({
      userId: params.recipientUserId,
      type: NotificationType.DONATION_MESSAGE,
      title: 'Nuevo mensaje',
      body: `${params.senderName} te envió un mensaje sobre una donación.`,
      linkPath: params.linkPath,
      resourceType: 'DONATION',
      resourceId: params.donationId,
    });
  }

  /**
   * Entrada: donorUserId, donationId.
   * Proceso: Notifica al donante que la fundacion actualizo la entrega.
   * Salida: Retorna void.
   */
  async notifyDonationDeliveryUpdated(params: {
    donorUserId: string;
    donationId: string;
  }): Promise<void> {
    await this.createInternal({
      userId: params.donorUserId,
      type: NotificationType.DONATION_DELIVERY_UPDATED,
      title: 'Entrega actualizada',
      body: 'La fundación actualizó los datos de entrega de tu donación.',
      linkPath: `/my-donations/${params.donationId}`,
      resourceType: 'DONATION',
      resourceId: params.donationId,
    });
  }

  /**
   * Entrada: notification: entidad Prisma.
   * Proceso: Mapea al DTO de respuesta.
   * Salida: Retorna NotificationDto.
   */
  private toDto(notification: {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    linkPath: string | null;
    resourceType: string | null;
    resourceId: string | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      linkPath: notification.linkPath,
      resourceType: notification.resourceType,
      resourceId: notification.resourceId,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}

export const notificationsService = new NotificationsService();
