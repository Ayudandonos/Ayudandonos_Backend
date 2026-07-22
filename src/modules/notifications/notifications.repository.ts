import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type {
  CreateNotificationDto,
  ListNotificationsQueryDto,
} from './notifications.dto.js';

export class NotificationsRepository {
  /**
   * Entrada: userId: destinatario; query: paginacion y filtro de no leidas.
   * Proceso: Lista notificaciones del usuario ordenadas por fecha descendente.
   * Salida: Retorna items y total.
   */
  async findByUserPaginated(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<{ items: Prisma.NotificationGetPayload<object>[]; total: number }> {
    const where: Prisma.NotificationWhereInput = { userId };

    if (query.unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Entrada: userId: destinatario.
   * Proceso: Cuenta notificaciones no leidas del usuario.
   * Salida: Retorna el conteo.
   */
  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Entrada: id: identificador; userId: propietario esperado.
   * Proceso: Busca una notificacion perteneciente al usuario.
   * Salida: Retorna la entidad o null.
   */
  async findByIdForUser(id: string, userId: string) {
    return prisma.notification.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Entrada: data: payload de creacion.
   * Proceso: Persiste una notificacion para el usuario indicado.
   * Salida: Retorna la entidad creada.
   */
  async create(data: CreateNotificationDto) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        linkPath: data.linkPath ?? null,
        resourceType: data.resourceType ?? null,
        resourceId: data.resourceId ?? null,
      },
    });
  }

  /**
   * Entrada: id: identificador de la notificacion.
   * Proceso: Marca la notificacion como leida.
   * Salida: Retorna la entidad actualizada.
   */
  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Entrada: userId: destinatario.
   * Proceso: Marca como leidas todas las notificaciones pendientes del usuario.
   * Salida: Retorna la cantidad actualizada.
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }
}

export const notificationsRepository = new NotificationsRepository();
