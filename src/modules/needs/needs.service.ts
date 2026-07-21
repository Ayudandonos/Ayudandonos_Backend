import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import type { ApiResponseMeta } from '../../shared/responses/api.response.js';
import type { FoundationWithRelations } from '../foundations/foundations.repository.js';
import { campaignsRepository } from '../campaigns/campaigns.repository.js';
import type {
  CreateNeedDto,
  ListNeedsQueryDto,
  NeedDto,
  UpdateNeedDto,
} from './needs.dto.js';
import {
  needsRepository,
  type NeedWithCampaign,
} from './needs.repository.js';

export class NeedsService {
  /**
   * Entrada: query: campaignId y paginacion.
   * Proceso: Valida que la campana exista y lista necesidades activas.
   * Salida: Retorna items mapeados y meta de paginacion.
   */
  async listByCampaign(
    query: ListNeedsQueryDto,
  ): Promise<{ data: { items: NeedDto[] }; meta: ApiResponseMeta }> {
    await this.requireExistingCampaign(query.campaignId);

    const { items, total } = await needsRepository.findByCampaignPaginated(
      query.campaignId,
      query,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: { items: items.map((need) => this.toDto(need)) },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: id: identificador de la necesidad.
   * Proceso: Carga la necesidad activa y valida que la campana exista.
   * Salida: Retorna el DTO o lanza AppError.
   */
  async getById(id: string): Promise<NeedDto> {
    const need = await this.requireNeed(id);
    await this.requireExistingCampaign(need.campaignId);
    return this.toDto(need);
  }

  /**
   * Entrada: input: datos de creacion; foundation: fundacion autenticada.
   * Proceso: Valida campana propia no eliminada y crea la necesidad.
   * Salida: Retorna la necesidad creada.
   */
  async create(
    input: CreateNeedDto,
    foundation: FoundationWithRelations,
  ): Promise<NeedDto> {
    await this.requireOwnedCampaign(input.campaignId, foundation.id);

    const created = await needsRepository.create(input);
    return this.toDto(created);
  }

  /**
   * Entrada: id: identificador; input: cambios; foundation: fundacion autenticada.
   * Proceso: Valida ownership sobre la campana y actualiza la necesidad.
   * Salida: Retorna la necesidad actualizada.
   */
  async update(
    id: string,
    input: UpdateNeedDto,
    foundation: FoundationWithRelations,
  ): Promise<NeedDto> {
    const need = await this.requireNeed(id);
    this.assertIsOwner(need, foundation.id);

    const updated = await needsRepository.update(id, input);
    return this.toDto(updated);
  }

  /**
   * Entrada: id: identificador; foundation: fundacion autenticada.
   * Proceso: Valida ownership, ausencia de donaciones y aplica soft delete.
   * Salida: Retorna void o lanza AppError.
   */
  async remove(id: string, foundation: FoundationWithRelations): Promise<void> {
    const need = await this.requireNeed(id);
    this.assertIsOwner(need, foundation.id);

    const donationCount = await needsRepository.countDonationsByNeedId(id);

    if (donationCount > 0) {
      throw new AppError(API_MESSAGES.NEEDS_HAS_DONATIONS, 400);
    }

    await needsRepository.softDelete(id);
  }

  /**
   * Entrada: campaignId: identificador de campana.
   * Proceso: Verifica que la campana exista y no este eliminada.
   * Salida: Retorna void o lanza AppError 404.
   */
  private async requireExistingCampaign(campaignId: string): Promise<void> {
    const campaign = await campaignsRepository.findById(campaignId);

    if (!campaign) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_NOT_FOUND, 404);
    }
  }

  /**
   * Entrada: campaignId y foundationId de la fundacion autenticada.
   * Proceso: Carga la campana y valida que pertenezca a la fundacion.
   * Salida: Retorna la campana o lanza AppError.
   */
  private async requireOwnedCampaign(campaignId: string, foundationId: string): Promise<void> {
    const campaign = await campaignsRepository.findById(campaignId);

    if (!campaign) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_NOT_FOUND, 404);
    }

    if (campaign.foundationId !== foundationId) {
      throw new AppError(API_MESSAGES.NEEDS_CAMPAIGN_NOT_OWNED, 403);
    }
  }

  /**
   * Entrada: id: identificador de la necesidad.
   * Proceso: Carga la necesidad activa o lanza 404.
   * Salida: Retorna NeedWithCampaign.
   */
  private async requireNeed(id: string): Promise<NeedWithCampaign> {
    const need = await needsRepository.findById(id);

    if (!need) {
      throw new AppError(API_MESSAGES.NEEDS_NOT_FOUND, 404);
    }

    return need;
  }

  /**
   * Entrada: need: entidad con campana; foundationId: fundacion autenticada.
   * Proceso: Verifica que la campana de la necesidad sea de la fundacion.
   * Salida: Retorna void o lanza AppError 403.
   */
  private assertIsOwner(need: NeedWithCampaign, foundationId: string): void {
    if (need.campaign.foundationId !== foundationId) {
      throw new AppError(API_MESSAGES.NEEDS_CANNOT_MANAGE_OTHERS, 403);
    }
  }

  /**
   * Entrada: need: entidad Prisma.
   * Proceso: Mapea la entidad al DTO de respuesta.
   * Salida: Retorna NeedDto.
   */
  private toDto(need: NeedWithCampaign): NeedDto {
    return {
      id: need.id,
      campaignId: need.campaignId,
      name: need.name,
      description: need.description,
      quantity: need.quantity,
      unit: need.unit,
      priority: need.priority,
      fulfilledQuantity: need.fulfilledQuantity,
      createdAt: need.createdAt.toISOString(),
      updatedAt: need.updatedAt.toISOString(),
    };
  }
}

export const needsService = new NeedsService();
