import type { DonationStatus, Prisma } from '@prisma/client';
import { CampaignStatus, FoundationStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import { inventoryRepository } from '../inventory/inventory.repository.js';
import type {
  CreateDonationDto,
  DonorDonationStatsDto,
  ListDonationsQueryDto,
  ListMessagesQueryDto,
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
              name: true,
              acronym: true,
              logoUrl: true,
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
  foundationBranch: {
    select: {
      id: true,
      name: true,
      department: true,
      city: true,
      address: true,
      reference: true,
      phone: true,
      openingHours: true,
      latitude: true,
      longitude: true,
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
      lastMessageAt: true,
      lastMessageBody: true,
      lastMessageSenderId: true,
      donorLastReadAt: true,
      foundationLastReadAt: true,
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
      title: true,
      status: true,
      foundationBranchId: true,
      deletedAt: true,
      foundation: {
        select: {
          id: true,
          userId: true,
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
        orderBy: [
          { conversation: { lastMessageAt: 'desc' } },
          { createdAt: 'desc' },
        ],
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
        orderBy: [
          { conversation: { lastMessageAt: 'desc' } },
          { createdAt: 'desc' },
        ],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.donation.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Entrada: donorUserId, need con campana, data del compromiso.
   * Proceso: Crea donacion con sede de campana, historial, conversacion e incrementa fulfilled.
   * Salida: Retorna la donacion creada con relaciones.
   */
  async createWithConversationAndHistory(
    donorUserId: string,
    need: NeedForDonation,
    data: CreateDonationDto,
  ): Promise<DonationWithRelations> {
    return prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          needId: need.id,
          donorUserId,
          foundationBranchId: need.campaign.foundationBranchId,
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

      if (data.initialMessage?.trim()) {
        const conversation = await tx.conversation.findUniqueOrThrow({
          where: { donationId: donation.id },
        });

        const trimmedBody = data.initialMessage.trim();
        const message = await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: donorUserId,
            body: trimmedBody,
          },
        });

        await tx.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: message.createdAt,
            lastMessageBody: trimmedBody,
            lastMessageSenderId: donorUserId,
          },
        });
      }

      await tx.need.update({
        where: { id: need.id },
        data: {
          fulfilledQuantity: { increment: data.quantity },
        },
      });

      return tx.donation.findUniqueOrThrow({
        where: { id: donation.id },
        include: donationInclude,
      });
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
   * Entrada: donation, cantidad recibida, notas y usuario que confirma.
   * Proceso: Marca RECEIVED, registra historial y entrada automatica de inventario.
   * Salida: Retorna la donacion actualizada con relaciones.
   */
  async confirmReceptionWithInventory(
    donation: DonationWithRelations,
    receivedQuantity: number,
    receptionNotes: string | null,
    changedById: string,
  ): Promise<DonationWithRelations> {
    return prisma.$transaction(async (tx) => {
      await tx.donation.update({
        where: { id: donation.id },
        data: {
          status: 'RECEIVED',
          receivedQuantity,
          receivedAt: new Date(),
          receptionNotes,
        },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId: donation.id,
          fromStatus: donation.status,
          toStatus: 'RECEIVED',
          changedById,
          note: receptionNotes,
        },
      });

      await inventoryRepository.registerInboundFromDonationInTransaction(tx, {
        foundationId: donation.need.campaign.foundationId,
        donationId: donation.id,
        campaignId: donation.need.campaign.id,
        foundationBranchId: donation.foundationBranchId,
        itemName: donation.need.name,
        itemUnit: donation.need.unit,
        quantity: receivedQuantity,
        createdById: changedById,
      });

      return tx.donation.findUniqueOrThrow({
        where: { id: donation.id },
        include: donationInclude,
      });
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
   * Entrada: donationId: identificador de la donacion.
   * Proceso: Obtiene la conversacion existente o la crea si falta (datos legacy o seed).
   * Salida: Retorna el id de la conversacion.
   */
  async ensureConversationByDonationId(donationId: string): Promise<string> {
    const existing = await this.findConversationIdByDonationId(donationId);
    if (existing) {
      return existing;
    }

    const conversation = await prisma.conversation.create({
      data: { donationId },
      select: { id: true },
    });

    return conversation.id;
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
   * Entrada: conversationId y senderId del donante.
   * Proceso: Cuenta mensajes enviados por el donante en la conversacion.
   * Salida: Retorna el total de mensajes del donante.
   */
  async countDonorMessages(conversationId: string, donorUserId: string): Promise<number> {
    return prisma.message.count({
      where: { conversationId, senderId: donorUserId },
    });
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
    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
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

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: message.createdAt,
          lastMessageBody: body,
          lastMessageSenderId: senderId,
        },
      });

      return message;
    });
  }

  /**
   * Entrada: conversationId, readerUserId y fecha de ultima lectura.
   * Proceso: Cuenta mensajes del otro participante posteriores a la lectura.
   * Salida: Retorna total de mensajes no leidos.
   */
  async countUnreadMessages(
    conversationId: string,
    readerUserId: string,
    lastReadAt: Date | null,
  ): Promise<number> {
    return prisma.message.count({
      where: {
        conversationId,
        senderId: { not: readerUserId },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });
  }

  /**
   * Entrada: conversationId y rol del lector en la conversacion.
   * Proceso: Actualiza timestamp de lectura del participante.
   * Salida: Retorna void.
   */
  async markConversationAsRead(
    conversationId: string,
    readerRole: 'donor' | 'foundation',
  ): Promise<void> {
    const now = new Date();

    await prisma.conversation.update({
      where: { id: conversationId },
      data:
        readerRole === 'donor'
          ? { donorLastReadAt: now }
          : { foundationLastReadAt: now },
    });
  }

  /**
   * Entrada: donorUserId: identificador del donante.
   * Proceso: Agrega conteos y sumas de quantity por estado de donacion.
   * Salida: Retorna estadisticas consolidadas del donante.
   */
  async getDonorStats(donorUserId: string): Promise<DonorDonationStatsDto> {
    const grouped = await prisma.donation.groupBy({
      by: ['status'],
      where: { donorUserId },
      _count: { _all: true },
      _sum: { quantity: true, receivedQuantity: true },
    });

    const emptyStats = (): { count: number; quantity: number } => ({
      count: 0,
      quantity: 0,
    });

    const byStatus: DonorDonationStatsDto['byStatus'] = {
      COMMITTED: emptyStats(),
      RECEIVED: emptyStats(),
      CANCELLED: emptyStats(),
    };

    for (const row of grouped) {
      const quantity =
        row.status === 'RECEIVED'
          ? (row._sum.receivedQuantity ?? row._sum.quantity ?? 0)
          : (row._sum.quantity ?? 0);

      byStatus[row.status] = {
        count: row._count._all,
        quantity,
      };
    }

    const cancelledDonations = byStatus.CANCELLED.count;
    const totalDonations =
      byStatus.COMMITTED.count + byStatus.RECEIVED.count + byStatus.CANCELLED.count;

    const totalQuantity = byStatus.COMMITTED.quantity + byStatus.RECEIVED.quantity;
    const receivedQuantity = byStatus.RECEIVED.quantity;

    return {
      totalDonations,
      totalQuantity,
      receivedQuantity,
      cancelledDonations,
      byStatus,
    };
  }
}

export const donationsRepository = new DonationsRepository();

export { CampaignStatus, FoundationStatus };
