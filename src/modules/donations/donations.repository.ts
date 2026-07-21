import type { DonationStatus, Prisma } from '@prisma/client';
import { CampaignStatus, FoundationStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type {
  CreateDonationDto,
  ListDonationsQueryDto,
  ListMessagesQueryDto,
  UpdateDonationDeliveryDto,
} from './donations.dto.js';

const donationInclude = {
  need: {
    select: {
      id: true,
      name: true,
      unit: true,
      quantity: true,
      fulfilledQuantity: true,
      campaignId: true,
      campaign: {
        select: {
          id: true,
          title: true,
          status: true,
          foundationId: true,
          foundation: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      },
    },
  },
  donor: {
    select: {
      id: true,
      fullName: true,
    },
  },
  statusHistory: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      changedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  },
  conversation: {
    select: {
      id: true,
    },
  },
} satisfies Prisma.DonationInclude;

export type DonationWithRelations = Prisma.DonationGetPayload<{
  include: typeof donationInclude;
}>;

const needForDonationInclude = {
  campaign: {
    select: {
      id: true,
      status: true,
      deletedAt: true,
      foundation: {
        select: {
          id: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  },
} satisfies Prisma.NeedInclude;

export type NeedForDonation = Prisma.NeedGetPayload<{
  include: typeof needForDonationInclude;
}>;

/**
 * Entrada: value: fecha ISO opcional o null.
 * Proceso: Convierte string ISO a Date o null segun el valor recibido.
 * Salida: Retorna Date, null o undefined si el valor no se envio.
 */
function toOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return new Date(value);
}

export class DonationsRepository {
  /**
   * Entrada: needId: identificador de la necesidad.
   * Proceso: Carga la necesidad con campana y fundacion para validar donacion.
   * Salida: Retorna la entidad o null si no existe.
   */
  async findNeedForDonation(needId: string): Promise<NeedForDonation | null> {
    return prisma.need.findFirst({
      where: { id: needId, deletedAt: null },
      include: needForDonationInclude,
    });
  }

  /**
   * Entrada: id: identificador de la donacion.
   * Proceso: Obtiene la donacion con relaciones necesarias para el DTO.
   * Salida: Retorna la entidad o null.
   */
  async findById(id: string): Promise<DonationWithRelations | null> {
    return prisma.donation.findUnique({
      where: { id },
      include: donationInclude,
    });
  }

  /**
   * Entrada: donorUserId: id del donante; query: paginacion y filtros.
   * Proceso: Lista donaciones del usuario donante ordenadas por fecha de creacion.
   * Salida: Retorna items paginados y total.
   */
  async findByDonorPaginated(
    donorUserId: string,
    query: ListDonationsQueryDto,
  ): Promise<{ items: DonationWithRelations[]; total: number }> {
    const where: Prisma.DonationWhereInput = { donorUserId };

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        include: donationInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.donation.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Entrada: foundationId: id de la fundacion; query: paginacion y filtros.
   * Proceso: Lista donaciones sobre necesidades de campanas de la fundacion.
   * Salida: Retorna items paginados y total.
   */
  async findByFoundationPaginated(
    foundationId: string,
    query: ListDonationsQueryDto,
  ): Promise<{ items: DonationWithRelations[]; total: number }> {
    const where: Prisma.DonationWhereInput = {
      need: {
        campaign: {
          foundationId,
          deletedAt: null,
        },
      },
    };

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        include: donationInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.donation.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Entrada: donorUserId: donante; data: datos del compromiso; needId: necesidad.
   * Proceso: Crea donacion, historial inicial, conversacion e incrementa cantidad cubierta.
   * Salida: Retorna la donacion creada con relaciones.
   */
  async createWithConversationAndHistory(
    donorUserId: string,
    needId: string,
    data: CreateDonationDto,
  ): Promise<DonationWithRelations> {
    return prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          needId,
          donorUserId,
          status: 'COMMITTED',
          quantity: data.quantity,
          notes: data.notes ?? null,
          estimatedDeliveryAt: data.estimatedDeliveryAt
            ? new Date(data.estimatedDeliveryAt)
            : null,
        },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId: donation.id,
          fromStatus: null,
          toStatus: 'COMMITTED',
          changedById: donorUserId,
        },
      });

      await tx.conversation.create({
        data: {
          donationId: donation.id,
        },
      });

      await tx.need.update({
        where: { id: needId },
        data: {
          fulfilledQuantity: { increment: data.quantity },
        },
      });

      const created = await tx.donation.findUniqueOrThrow({
        where: { id: donation.id },
        include: donationInclude,
      });

      return created;
    });
  }

  /**
   * Entrada: donationId, needId, quantity, fromStatus, toStatus, changedById.
   * Proceso: Actualiza estado, registra historial y ajusta fulfilledQuantity si se cancela.
   * Salida: Retorna la donacion actualizada con relaciones.
   */
  async updateStatusWithHistory(
    donationId: string,
    needId: string,
    quantity: number,
    fromStatus: DonationStatus,
    toStatus: DonationStatus,
    changedById: string,
  ): Promise<DonationWithRelations> {
    return prisma.$transaction(async (tx) => {
      await tx.donation.update({
        where: { id: donationId },
        data: { status: toStatus },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId,
          fromStatus,
          toStatus,
          changedById,
        },
      });

      if (toStatus === 'CANCELLED') {
        await tx.need.update({
          where: { id: needId },
          data: {
            fulfilledQuantity: { decrement: quantity },
          },
        });
      }

      return tx.donation.findUniqueOrThrow({
        where: { id: donationId },
        include: donationInclude,
      });
    });
  }

  /**
   * Entrada: id: identificador; data: campos de entrega.
   * Proceso: Actualiza datos de entrega de la donacion.
   * Salida: Retorna la donacion actualizada con relaciones.
   */
  async updateDelivery(
    id: string,
    data: UpdateDonationDeliveryDto,
  ): Promise<DonationWithRelations> {
    const updateData: Prisma.DonationUpdateInput = {};

    if (data.deliveryAddress !== undefined) {
      updateData.deliveryAddress = data.deliveryAddress;
    }

    if (data.deliveryLatitude !== undefined) {
      updateData.deliveryLatitude = data.deliveryLatitude;
    }

    if (data.deliveryLongitude !== undefined) {
      updateData.deliveryLongitude = data.deliveryLongitude;
    }

    if (data.estimatedDeliveryAt !== undefined) {
      updateData.estimatedDeliveryAt = toOptionalDate(data.estimatedDeliveryAt) ?? null;
    }

    return prisma.donation.update({
      where: { id },
      data: updateData,
      include: donationInclude,
    });
  }

  /**
   * Entrada: donationId: identificador de la donacion.
   * Proceso: Obtiene la conversacion vinculada a la donacion.
   * Salida: Retorna id de conversacion o null.
   */
  async findConversationIdByDonationId(donationId: string): Promise<string | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { donationId },
      select: { id: true },
    });

    return conversation?.id ?? null;
  }

  /**
   * Entrada: conversationId: identificador; query: paginacion.
   * Proceso: Lista mensajes de la conversacion ordenados cronologicamente.
   * Salida: Retorna items paginados y total.
   */
  async findMessagesPaginated(
    conversationId: string,
    query: ListMessagesQueryDto,
  ): Promise<{
    items: Prisma.MessageGetPayload<{
      include: { sender: { select: { id: true; fullName: true } } };
    }>[];
    total: number;
  }> {
    const where: Prisma.MessageWhereInput = { conversationId };

    const [items, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.message.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Entrada: conversationId, senderId, body: contenido del mensaje.
   * Proceso: Persiste un nuevo mensaje en la conversacion.
   * Salida: Retorna el mensaje creado con remitente.
   */
  async createMessage(
    conversationId: string,
    senderId: string,
    body: string,
  ): Promise<
    Prisma.MessageGetPayload<{
      include: { sender: { select: { id: true; fullName: true } } };
    }>
  > {
    return prisma.message.create({
      data: {
        conversationId,
        senderId,
        body,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }
}

export const donationsRepository = new DonationsRepository();

export { CampaignStatus, FoundationStatus };
