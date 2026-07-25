import { CampaignStatus, FoundationBranchStatus, FoundationStatus } from '@prisma/client';
import type { FoundationBranch } from '@prisma/client';
import { AppError } from '../../shared/errors/app.error.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { mapUnknownError } from '../../shared/errors/map-unknown-error.js';
import {
  deleteStoredFile,
  saveCampaignImage,
} from '../../shared/utils/upload.util.js';
import type { ApiResponseMeta } from '../../shared/responses/api.response.js';
import type { FoundationWithRelations } from '../foundations/foundations.repository.js';
import { foundationBranchesRepository } from '../foundations/foundation-branches.repository.js';
import type {
  CampaignBranchSummaryDto,
  CampaignDto,
  CreateCampaignDto,
  ListCampaignsQueryDto,
  UpdateCampaignDto,
} from './campaigns.dto.js';
import {
  campaignsRepository,
  type CampaignWithFoundation,
} from './campaigns.repository.js';

type RequesterContext = {
  id: string;
  email: string;
  role: string;
};

const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  [CampaignStatus.DRAFT]: [CampaignStatus.PUBLISHED, CampaignStatus.CANCELLED],
  [CampaignStatus.PUBLISHED]: [CampaignStatus.FINISHED, CampaignStatus.CANCELLED],
  [CampaignStatus.FINISHED]: [],
  [CampaignStatus.CANCELLED]: [],
};

/**
 * Entrada: branch: sede de acopio.
 * Proceso: Construye direccion legible para compatibilidad con campos delivery_*.
 * Salida: Retorna texto de direccion formateado.
 */
function formatBranchDeliveryAddress(branch: FoundationBranch): string {
  return `${branch.address}, ${branch.city}, ${branch.department}`;
}

export class CampaignsService {
  /**
   * Entrada: query: filtros y paginacion publicos.
   * Proceso: Lista campanas publicadas de fundaciones verificadas.
   * Salida: Retorna items mapeados y meta de paginacion.
   */
  async listPublished(
    query: ListCampaignsQueryDto,
  ): Promise<{ data: { items: CampaignDto[] }; meta: ApiResponseMeta }> {
    const { items, total } = await campaignsRepository.findPublishedPaginated(query);
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: { items: items.map((campaign) => this.toDto(campaign)) },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: query: filtros; foundation: fundacion autenticada operativa.
   * Proceso: Lista campanas propias de la fundacion con filtro opcional de estado.
   * Salida: Retorna items mapeados y meta de paginacion.
   */
  async listMine(
    query: ListCampaignsQueryDto,
    foundation: FoundationWithRelations,
  ): Promise<{ data: { items: CampaignDto[] }; meta: ApiResponseMeta }> {
    const { items, total } = await campaignsRepository.findByFoundationPaginated(
      foundation.id,
      query,
    );
    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: { items: items.map((campaign) => this.toDto(campaign)) },
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Entrada: id: identificador; requester: usuario autenticado opcional.
   * Proceso: Publico ve solo PUBLISHED; el owner ve cualquier estado propio.
   * Salida: Retorna el DTO de la campana o lanza AppError.
   */
  async getById(id: string, requester?: RequesterContext): Promise<CampaignDto> {
    const campaign = await this.requireCampaign(id);
    this.assertCanViewCampaign(campaign, requester);
    return this.toDto(campaign);
  }

  /**
   * Entrada: input: datos de creacion; foundation: fundacion operativa autenticada.
   * Proceso: Crea campana en DRAFT o PUBLISHED validando fechas al publicar y sede activa.
   * Salida: Retorna la campana creada.
   */
  async create(
    input: CreateCampaignDto,
    foundation: FoundationWithRelations,
  ): Promise<CampaignDto> {
    const status = input.status ?? CampaignStatus.DRAFT;

    if (status === CampaignStatus.PUBLISHED) {
      this.assertPublishRequirements(input.startDate, input.endDate);
    }

    const branch = await this.resolveActiveBranch(foundation.id, input.foundationBranchId);
    const payload: CreateCampaignDto = {
      ...input,
      status,
      deliveryAddress: formatBranchDeliveryAddress(branch),
      deliveryLatitude: branch.latitude,
      deliveryLongitude: branch.longitude,
    };

    const created = await campaignsRepository.create(foundation.id, payload);

    return this.toDto(created);
  }

  /**
   * Entrada: id: identificador; input: cambios; foundation: fundacion autenticada.
   * Proceso: Valida ownership, inmutabilidad y transiciones; actualiza la campana.
   * Salida: Retorna la campana actualizada.
   */
  async update(
    id: string,
    input: UpdateCampaignDto,
    foundation: FoundationWithRelations,
  ): Promise<CampaignDto> {
    const campaign = await this.requireCampaign(id);
    this.assertIsOwner(campaign, foundation.id);
    this.assertIsMutable(campaign.status);

    const nextStatus = input.status ?? campaign.status;

    if (input.status && input.status !== campaign.status) {
      this.assertAllowedTransition(campaign.status, input.status);
    }

    const nextStartDate =
      input.startDate !== undefined
        ? input.startDate
        : campaign.startDate?.toISOString() ?? null;
    const nextEndDate =
      input.endDate !== undefined
        ? input.endDate
        : campaign.endDate?.toISOString() ?? null;

    if (nextStatus === CampaignStatus.PUBLISHED) {
      this.assertPublishRequirements(nextStartDate, nextEndDate);
    }

    if (
      nextStartDate &&
      nextEndDate &&
      new Date(nextEndDate) < new Date(nextStartDate)
    ) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_END_BEFORE_START, 400);
    }

    const payload: UpdateCampaignDto = { ...input };

    if (input.foundationBranchId !== undefined) {
      const branch = await this.resolveActiveBranch(foundation.id, input.foundationBranchId);
      payload.deliveryAddress = formatBranchDeliveryAddress(branch);
      payload.deliveryLatitude = branch.latitude;
      payload.deliveryLongitude = branch.longitude;
    }

    const updated = await campaignsRepository.update(id, payload);
    return this.toDto(updated);
  }

  /**
   * Entrada: id: identificador; file: archivo de imagen; foundation: fundacion autenticada.
   * Proceso: Reemplaza la imagen de la campana en Blob o almacenamiento local.
   * Salida: Retorna la campana actualizada.
   */
  async uploadImage(
    id: string,
    file: Express.Multer.File,
    foundation: FoundationWithRelations,
  ): Promise<CampaignDto> {
    try {
      const campaign = await this.requireCampaign(id);
      this.assertIsOwner(campaign, foundation.id);
      this.assertIsMutable(campaign.status);

      const saved = await saveCampaignImage(id, file);
      const previousImage = campaign.imageUrl;

      try {
        await campaignsRepository.update(id, { imageUrl: saved.publicUrl });
      } catch (error) {
        await deleteStoredFile(saved.storageKey);
        throw mapUnknownError(error);
      }

      if (previousImage) {
        await deleteStoredFile(previousImage);
      }

      const refreshed = await this.requireCampaign(id);
      return this.toDto(refreshed);
    } catch (error) {
      throw mapUnknownError(error);
    }
  }

  /**
   * Entrada: id: identificador; foundation: fundacion autenticada.
   * Proceso: Valida ownership y aplica soft delete.
   * Salida: Retorna void o lanza AppError.
   */
  async remove(id: string, foundation: FoundationWithRelations): Promise<void> {
    const campaign = await this.requireCampaign(id);
    this.assertIsOwner(campaign, foundation.id);
    await campaignsRepository.softDelete(id);
  }

  /**
   * Entrada: foundationId y branchId.
   * Proceso: Verifica que la sede exista, pertenezca a la fundacion y este activa.
   * Salida: Retorna la sede o lanza AppError.
   */
  private async resolveActiveBranch(
    foundationId: string,
    branchId: string,
  ): Promise<FoundationBranch> {
    const branch = await foundationBranchesRepository.findByIdForFoundation(
      foundationId,
      branchId,
    );

    if (!branch) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_BRANCH_NOT_FOUND, 404);
    }

    if (branch.status !== FoundationBranchStatus.ACTIVE) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_BRANCH_NOT_ACTIVE, 400);
    }

    return branch;
  }

  /**
   * Entrada: id: identificador de campana.
   * Proceso: Carga la campana o lanza 404 si no existe.
   * Salida: Retorna la entidad con fundacion.
   */
  private async requireCampaign(id: string): Promise<CampaignWithFoundation> {
    const campaign = await campaignsRepository.findById(id);

    if (!campaign) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_NOT_FOUND, 404);
    }

    return campaign;
  }

  /**
   * Entrada: campaign: entidad; requester: usuario opcional.
   * Proceso: Permite ver PUBLISHED al publico; el owner ve las propias.
   * Salida: Retorna void o lanza AppError 403/404.
   */
  private assertCanViewCampaign(
    campaign: CampaignWithFoundation,
    requester?: RequesterContext,
  ): void {
    if (
      campaign.status === CampaignStatus.PUBLISHED &&
      campaign.foundation.status === FoundationStatus.VERIFIED &&
      !campaign.foundation.deletedAt
    ) {
      return;
    }

    if (requester?.role === 'ADMIN') {
      return;
    }

    if (requester?.role === 'FOUNDATION' && requester.id === campaign.foundation.userId) {
      return;
    }

    throw new AppError(API_MESSAGES.CAMPAIGNS_NOT_PUBLIC, 403);
  }

  /**
   * Entrada: campaign: entidad; foundationId: id de la fundacion autenticada.
   * Proceso: Verifica que la campana pertenezca a la fundacion.
   * Salida: Retorna void o lanza AppError 403.
   */
  private assertIsOwner(campaign: CampaignWithFoundation, foundationId: string): void {
    if (campaign.foundationId !== foundationId) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_CANNOT_MANAGE_OTHERS, 403);
    }
  }

  /**
   * Entrada: status: estado actual de la campana.
   * Proceso: Impide modificar campanas finalizadas o canceladas.
   * Salida: Retorna void o lanza AppError 400.
   */
  private assertIsMutable(status: CampaignStatus): void {
    if (status === CampaignStatus.FINISHED || status === CampaignStatus.CANCELLED) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_IMMUTABLE_STATUS, 400);
    }
  }

  /**
   * Entrada: from: estado actual; to: estado destino.
   * Proceso: Valida la matriz de transiciones permitidas.
   * Salida: Retorna void o lanza AppError 400.
   */
  private assertAllowedTransition(from: CampaignStatus, to: CampaignStatus): void {
    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_INVALID_STATUS_TRANSITION, 400);
    }
  }

  /**
   * Entrada: startDate/endDate: fechas candidatas a publicar.
   * Proceso: Exige fechas presentes y endDate >= startDate para publicar.
   * Salida: Retorna void o lanza AppError 400.
   */
  private assertPublishRequirements(
    startDate?: string | null,
    endDate?: string | null,
  ): void {
    if (!startDate || !endDate) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_PUBLISH_DATES_REQUIRED, 400);
    }

    if (new Date(endDate) < new Date(startDate)) {
      throw new AppError(API_MESSAGES.CAMPAIGNS_END_BEFORE_START, 400);
    }
  }

  /**
   * Entrada: branch: sede asociada a la campana.
   * Proceso: Mapea la sede al resumen expuesto en la API.
   * Salida: Retorna CampaignBranchSummaryDto.
   */
  private toBranchDto(branch: FoundationBranch): CampaignBranchSummaryDto {
    return {
      id: branch.id,
      name: branch.name,
      department: branch.department,
      city: branch.city,
      address: branch.address,
      reference: branch.reference,
      phone: branch.phone,
      openingHours: branch.openingHours,
      latitude: branch.latitude,
      longitude: branch.longitude,
      status: branch.status,
    };
  }

  /**
   * Entrada: campaign: entidad con fundacion.
   * Proceso: Mapea la entidad Prisma al DTO de respuesta.
   * Salida: Retorna CampaignDto.
   */
  private toDto(campaign: CampaignWithFoundation): CampaignDto {
    return {
      id: campaign.id,
      foundationId: campaign.foundationId,
      foundationBranchId: campaign.foundationBranchId,
      title: campaign.title,
      description: campaign.description,
      imageUrl: campaign.imageUrl,
      status: campaign.status,
      startDate: campaign.startDate?.toISOString() ?? null,
      endDate: campaign.endDate?.toISOString() ?? null,
      deliveryAddress: campaign.deliveryAddress,
      deliveryLatitude: campaign.deliveryLatitude,
      deliveryLongitude: campaign.deliveryLongitude,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
      foundation: {
        id: campaign.foundation.id,
        name: campaign.foundation.name,
        acronym: campaign.foundation.acronym,
        slug: campaign.foundation.slug,
        logoUrl: campaign.foundation.logoUrl,
        city: campaign.foundation.city,
        department: campaign.foundation.department,
      },
      branch: this.toBranchDto(campaign.foundationBranch),
    };
  }
}

export const campaignsService = new CampaignsService();
