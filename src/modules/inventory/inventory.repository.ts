import {
  StockMovementType,
  type InventoryItem,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';

export type InventoryItemRecord = InventoryItem;

const movementInclude = {
  inventoryItem: {
    select: { id: true, name: true, unit: true },
  },
  donation: {
    select: {
      id: true,
      donor: { select: { fullName: true } },
    },
  },
  campaign: {
    select: { id: true, title: true },
  },
  foundationBranch: {
    select: { id: true, name: true, city: true },
  },
} satisfies Prisma.StockMovementInclude;

/**
 * Entrada: Ninguna.
 * Proceso: Acceso a datos de inventario, movimientos y salidas.
 * Salida: Retorna metodos del repositorio.
 */
export const inventoryRepository = {
  /**
   * Entrada: foundationId: id de fundacion.
   * Proceso: Lista items de inventario ordenados por nombre.
   * Salida: Retorna items activos de la fundacion.
   */
  async findItemsByFoundation(foundationId: string): Promise<InventoryItemRecord[]> {
    return prisma.inventoryItem.findMany({
      where: { foundationId },
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Entrada: id y foundationId.
   * Proceso: Busca item de inventario propio.
   * Salida: Retorna item o null.
   */
  async findItemByIdForFoundation(
    id: string,
    foundationId: string,
  ): Promise<InventoryItemRecord | null> {
    return prisma.inventoryItem.findFirst({
      where: { id, foundationId },
    });
  },

  /**
   * Entrada: tx, datos de donacion recibida y producto.
   * Proceso: Crea o actualiza item y registra movimiento IN ligado a la donacion.
   * Salida: Retorna item de inventario actualizado.
   */
  async registerInboundFromDonationInTransaction(
    tx: Prisma.TransactionClient,
    params: {
      foundationId: string;
      donationId: string;
      campaignId: string;
      foundationBranchId: string;
      itemName: string;
      itemUnit: string;
      quantity: number;
      createdById: string;
    },
  ): Promise<InventoryItemRecord> {
    const existing = await tx.inventoryItem.findFirst({
      where: {
        foundationId: params.foundationId,
        name: params.itemName,
        unit: params.itemUnit,
      },
    });

    const item =
      existing ??
      (await tx.inventoryItem.create({
        data: {
          foundationId: params.foundationId,
          name: params.itemName,
          unit: params.itemUnit,
          quantityAvailable: 0,
        },
      }));

    const updated = await tx.inventoryItem.update({
      where: { id: item.id },
      data: { quantityAvailable: { increment: params.quantity } },
    });

    await tx.stockMovement.create({
      data: {
        foundationId: params.foundationId,
        inventoryItemId: item.id,
        donationId: params.donationId,
        campaignId: params.campaignId,
        foundationBranchId: params.foundationBranchId,
        type: StockMovementType.IN,
        quantity: params.quantity,
        note: `Entrada automatica por donacion recibida ${params.donationId}`,
        createdById: params.createdById,
      },
    });

    return updated;
  },

  /**
   * Entrada: foundationId y query de paginacion.
   * Proceso: Lista movimientos de inventario de la fundacion.
   * Salida: Retorna items paginados y total.
   */
  async findMovementsPaginated(
    foundationId: string,
    query: { page: number; limit: number; type?: StockMovementType },
  ) {
    const where: Prisma.StockMovementWhereInput = { foundationId };

    if (query.type) {
      where.type = query.type;
    }

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: movementInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Entrada: foundationId y paginacion.
   * Proceso: Lista salidas de inventario con resumen de campana y post.
   * Salida: Retorna items paginados y total.
   */
  async findOutboundsPaginated(
    foundationId: string,
    query: { page: number; limit: number },
  ) {
    const where: Prisma.InventoryOutboundWhereInput = { foundationId };

    const [items, total] = await Promise.all([
      prisma.inventoryOutbound.findMany({
        where,
        include: {
          campaign: { select: { id: true, title: true } },
          foundationBranch: { select: { id: true, name: true, city: true } },
          post: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.inventoryOutbound.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Entrada: datos de salida, lineas, imagenes y usuario creador.
   * Proceso: Valida stock, decrementa inventario, crea salida, movimientos OUT y post publico.
   * Salida: Retorna ids de salida y post.
   */
  async createOutboundWithPost(params: {
    foundationId: string;
    campaignId: string;
    foundationBranchId: string;
    title: string;
    description: string;
    observations: string | null;
    slug: string;
    lines: Array<{ inventoryItemId: string; quantity: number; name: string; unit: string }>;
    imageUrls: string[];
    createdById: string | null;
  }): Promise<{ outboundId: string; postId: string; postSlug: string; totalQuantityDelivered: number }> {
    const totalQuantityDelivered = params.lines.reduce((sum, line) => sum + line.quantity, 0);

    return prisma.$transaction(async (tx) => {
      for (const line of params.lines) {
        const item = await tx.inventoryItem.findFirst({
          where: { id: line.inventoryItemId, foundationId: params.foundationId },
        });

        if (!item) {
          throw new Error('INVENTORY_ITEM_NOT_FOUND');
        }

        if (item.quantityAvailable < line.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${item.name}`);
        }
      }

      const outbound = await tx.inventoryOutbound.create({
        data: {
          foundationId: params.foundationId,
          campaignId: params.campaignId,
          foundationBranchId: params.foundationBranchId,
          title: params.title,
          description: params.description,
          observations: params.observations,
          totalQuantityDelivered,
          createdById: params.createdById,
        },
      });

      for (const line of params.lines) {
        await tx.inventoryItem.update({
          where: { id: line.inventoryItemId },
          data: { quantityAvailable: { decrement: line.quantity } },
        });

        await tx.inventoryOutboundLine.create({
          data: {
            outboundId: outbound.id,
            inventoryItemId: line.inventoryItemId,
            quantity: line.quantity,
          },
        });

        await tx.stockMovement.create({
          data: {
            foundationId: params.foundationId,
            inventoryItemId: line.inventoryItemId,
            outboundId: outbound.id,
            campaignId: params.campaignId,
            foundationBranchId: params.foundationBranchId,
            type: StockMovementType.OUT,
            quantity: line.quantity,
            note: params.observations ?? `Salida registrada (${outbound.id})`,
            createdById: params.createdById,
          },
        });
      }

      const post = await tx.foundationPost.create({
        data: {
          foundationId: params.foundationId,
          campaignId: params.campaignId,
          foundationBranchId: params.foundationBranchId,
          outboundId: outbound.id,
          title: params.title,
          description: params.description,
          totalQuantityDelivered,
          slug: params.slug,
          lines: {
            create: params.lines.map((line) => ({
              inventoryItemId: line.inventoryItemId,
              itemName: line.name,
              unit: line.unit,
              quantity: line.quantity,
            })),
          },
          images: {
            create: params.imageUrls.map((imageUrl, index) => ({
              imageUrl,
              sortOrder: index,
            })),
          },
        },
      });

      return {
        outboundId: outbound.id,
        postId: post.id,
        postSlug: post.slug,
        totalQuantityDelivered,
      };
    });
  },
};
