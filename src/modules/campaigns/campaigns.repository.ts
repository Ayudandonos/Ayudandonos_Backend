import type { Campaign, Prisma } from '@prisma/client';
import { CampaignStatus, FoundationStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type {
  CreateCampaignDto,
  ListCampaignsQueryDto,
  UpdateCampaignDto,
} from './campaigns.dto.js';

const campaignInclude = {
  foundation: {
    select: {
      id: true,
      userId: true,
      name: true,
      acronym: true,
      slug: true,
      logoUrl: true,
      city: true,
      department: true,
      status: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.CampaignInclude;

export type CampaignWithFoundation = Prisma.CampaignGetPayload<{
  include: typeof campaignInclude;
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

export class CampaignsRepository {
  /**
   * Entrada: query: filtros y paginacion.
   * Proceso: Lista campanas publicadas de fundaciones verificadas activas.
   * Salida: Retorna items paginados y total de registros.
   */
  async findPublishedPaginated(
    query: ListCampaignsQueryDto,
  ): Promise<{ items: CampaignWithFoundation[]; total: number }> {
    const where: Prisma.CampaignWhereInput = {
      deletedAt: null,
      status: CampaignStatus.PUBLISHED,
      foundation: {
        status: FoundationStatus.VERIFIED,
        deletedAt: null,
        user: { isActive: true },
      },
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: campaignInclude,
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Entrada: foundationId: id de la fundacion; query: filtros y paginacion.
   * Proceso: Lista campanas propias no eliminadas con filtro opcional de estado.
   * Salida: Retorna items paginados y total de registros.
   */
  async findByFoundationPaginated(
    foundationId: string,
    query: ListCampaignsQueryDto,
  ): Promise<{ items: CampaignWithFoundation[]; total: number }> {
    const where: Prisma.CampaignWhereInput = {
      foundationId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: campaignInclude,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Entrada: id: identificador de la campana.
   * Proceso: Obtiene la campana con resumen de fundacion si no esta eliminada.
   * Salida: Retorna la entidad o null.
   */
  async findById(id: string): Promise<CampaignWithFoundation | null> {
    return prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: campaignInclude,
    });
  }

  /**
   * Entrada: foundationId: id de la fundacion; data: datos de creacion.
   * Proceso: Persiste una nueva campana asociada a la fundacion.
   * Salida: Retorna la campana creada con relaciones.
   */
  async create(
    foundationId: string,
    data: CreateCampaignDto,
  ): Promise<CampaignWithFoundation> {
    return prisma.campaign.create({
      data: {
        foundationId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl ?? null,
        status: data.status ?? CampaignStatus.DRAFT,
        startDate: toOptionalDate(data.startDate) ?? null,
        endDate: toOptionalDate(data.endDate) ?? null,
        deliveryAddress: data.deliveryAddress ?? null,
        deliveryLatitude: data.deliveryLatitude ?? null,
        deliveryLongitude: data.deliveryLongitude ?? null,
      },
      include: campaignInclude,
    });
  }

  /**
   * Entrada: id: identificador; data: campos a actualizar.
   * Proceso: Actualiza campos de la campana existente.
   * Salida: Retorna la campana actualizada con relaciones.
   */
  async update(id: string, data: UpdateCampaignDto): Promise<CampaignWithFoundation> {
    const updateData: Prisma.CampaignUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.startDate !== undefined) {
      updateData.startDate = toOptionalDate(data.startDate) ?? null;
    }

    if (data.endDate !== undefined) {
      updateData.endDate = toOptionalDate(data.endDate) ?? null;
    }

    if (data.deliveryAddress !== undefined) {
      updateData.deliveryAddress = data.deliveryAddress;
    }

    if (data.deliveryLatitude !== undefined) {
      updateData.deliveryLatitude = data.deliveryLatitude;
    }

    if (data.deliveryLongitude !== undefined) {
      updateData.deliveryLongitude = data.deliveryLongitude;
    }

    return prisma.campaign.update({
      where: { id },
      data: updateData,
      include: campaignInclude,
    });
  }

  /**
   * Entrada: id: identificador de la campana.
   * Proceso: Marca la campana como eliminada con soft delete.
   * Salida: Retorna la entidad actualizada.
   */
  async softDelete(id: string): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const campaignsRepository = new CampaignsRepository();
