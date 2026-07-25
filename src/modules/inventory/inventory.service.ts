import { randomUUID } from 'node:crypto';
import { FoundationBranchStatus } from '@prisma/client';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES, inventoryInsufficientStockMessage } from '../../shared/constants/messages.constants.js';
import { savePublicImage } from '../../shared/utils/upload.util.js';
import { campaignsRepository } from '../campaigns/campaigns.repository.js';
import { foundationBranchesRepository } from '../foundations/foundation-branches.repository.js';
import type { FoundationWithRelations } from '../foundations/foundations.repository.js';
import type { ApiResponseMeta } from '../../shared/responses/api.response.js';
import type {
  InventoryItemDto,
  InventoryOutboundSummaryDto,
  OutboundResultDto,
  StockMovementDto,
  ListInventoryMovementsQueryDto,
} from './inventory.dto.js';
import type { CreateOutboundInput } from './inventory.validations.js';
import { inventoryRepository, type InventoryItemRecord } from './inventory.repository.js';

const MIN_POST_IMAGES = 3;

/**
 * Entrada: title: titulo del post.
 * Proceso: Genera slug unico legible para URL publica.
 * Salida: Retorna slug con sufijo aleatorio.
 */
function buildPostSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `${base || 'entrega'}-${randomUUID().slice(0, 8)}`;
}

export class InventoryService {
  /**
   * Entrada: foundation: fundacion autenticada.
   * Proceso: Lista items de inventario de la fundacion.
   * Salida: Retorna items mapeados a DTO.
   */
  async listItems(foundation: FoundationWithRelations): Promise<{ items: InventoryItemDto[] }> {
    const items = await inventoryRepository.findItemsByFoundation(foundation.id);
    return { items: items.map((item) => this.toItemDto(item)) };
  }

  /**
   * Entrada: foundation y query de paginacion.
   * Proceso: Lista movimientos de inventario de la fundacion.
   * Salida: Retorna items paginados y meta.
   */
  async listMovements(
    foundation: FoundationWithRelations,
    query: ListInventoryMovementsQueryDto,
  ): Promise<{ data: { items: StockMovementDto[] }; meta: ApiResponseMeta }> {
    const { items, total } = await inventoryRepository.findMovementsPaginated(
      foundation.id,
      query,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: {
        items: items.map((movement) => ({
          id: movement.id,
          type: movement.type,
          quantity: movement.quantity,
          note: movement.note,
          createdAt: movement.createdAt.toISOString(),
          inventoryItem: movement.inventoryItem,
          donation: movement.donation
            ? {
                id: movement.donation.id,
                donorFullName: movement.donation.donor.fullName,
              }
            : null,
          campaign: movement.campaign,
          foundationBranch: movement.foundationBranch,
        })),
      },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: foundation y query de paginacion.
   * Proceso: Lista salidas de inventario de la fundacion.
   * Salida: Retorna items paginados y meta.
   */
  async listOutbounds(
    foundation: FoundationWithRelations,
    query: { page: number; limit: number },
  ): Promise<{ data: { items: InventoryOutboundSummaryDto[] }; meta: ApiResponseMeta }> {
    const { items, total } = await inventoryRepository.findOutboundsPaginated(
      foundation.id,
      query,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: {
        items: items.map((outbound) => ({
          id: outbound.id,
          title: outbound.title,
          totalQuantityDelivered: outbound.totalQuantityDelivered,
          observations: outbound.observations,
          createdAt: outbound.createdAt.toISOString(),
          campaign: outbound.campaign,
          foundationBranch: outbound.foundationBranch,
          postId: outbound.post?.id ?? null,
        })),
      },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: input de salida, imagenes, foundation y usuario.
   * Proceso: Valida campaña, sede activa, stock y crea salida con post obligatorio.
   * Salida: Retorna resultado con ruta publica del post.
   */
  async createOutbound(
    input: CreateOutboundInput,
    imageFiles: Express.Multer.File[],
    foundation: FoundationWithRelations,
    createdById: string,
  ): Promise<OutboundResultDto> {
    if (imageFiles.length < MIN_POST_IMAGES) {
      throw new AppError(API_MESSAGES.INVENTORY_OUTBOUND_IMAGES_MIN, 400);
    }

    const campaign = await campaignsRepository.findById(input.campaignId);

    if (!campaign || campaign.deletedAt) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_NOT_FOUND, 404);
    }

    if (campaign.foundationId !== foundation.id) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_CANNOT_MANAGE_OTHERS, 403);
    }

    if (campaign.foundationBranchId !== input.foundationBranchId) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_BRANCH_MISMATCH, 400);
    }

    const branch = await foundationBranchesRepository.findByIdForFoundation(
      foundation.id,
      input.foundationBranchId,
    );

    if (!branch || branch.status !== FoundationBranchStatus.ACTIVE) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_BRANCH_NOT_ACTIVE, 400);
    }

    const resolvedLines: Array<{
      inventoryItemId: string;
      quantity: number;
      name: string;
      unit: string;
    }> = [];

    for (const line of input.lines) {
      const item = await inventoryRepository.findItemByIdForFoundation(
        line.inventoryItemId,
        foundation.id,
      );

      if (!item) {
        throw new AppError(API_MESSAGES.INVENTORY_ITEM_NOT_FOUND, 404);
      }

      if (item.quantityAvailable < line.quantity) {
        throw new AppError(inventoryInsufficientStockMessage(item.name), 400);
      }

      resolvedLines.push({
        inventoryItemId: item.id,
        quantity: line.quantity,
        name: item.name,
        unit: item.unit,
      });
    }

    const slug = buildPostSlug(input.title);
    const imageUrls: string[] = [];

    for (const file of imageFiles) {
      const saved = await savePublicImage(
        `foundations/${foundation.id}/posts/${slug}`,
        file,
      );
      if (!saved.publicUrl) {
        throw new AppError(API_MESSAGES.UPLOAD_STORAGE_FAILED, 500);
      }
      imageUrls.push(saved.publicUrl);
    }

    try {
      const result = await inventoryRepository.createOutboundWithPost({
        foundationId: foundation.id,
        campaignId: input.campaignId,
        foundationBranchId: input.foundationBranchId,
        title: input.title,
        description: input.description,
        observations: input.observations ?? null,
        slug,
        lines: resolvedLines,
        imageUrls,
        createdById,
      });

      return {
        outboundId: result.outboundId,
        postId: result.postId,
        postSlug: result.postSlug,
        publicPath: `/foundations/${foundation.id}/posts/${result.postId}`,
        totalQuantityDelivered: result.totalQuantityDelivered,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('INSUFFICIENT_STOCK:')) {
        const itemName = error.message.split(':')[1] ?? '';
        throw new AppError(inventoryInsufficientStockMessage(itemName), 400);
      }
      throw error;
    }
  }

  /**
   * Entrada: item de inventario de Prisma.
   * Proceso: Mapea entidad a DTO de respuesta.
   * Salida: Retorna InventoryItemDto.
   */
  private toItemDto(item: InventoryItemRecord): InventoryItemDto {
    return {
      id: item.id,
      name: item.name,
      unit: item.unit,
      quantityAvailable: item.quantityAvailable,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}

export const inventoryService = new InventoryService();
