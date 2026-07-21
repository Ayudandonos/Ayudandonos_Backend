import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type {
  CreateNeedDto,
  ListNeedsQueryDto,
  UpdateNeedDto,
} from './needs.dto.js';

const needInclude = {
  campaign: {
    select: {
      id: true,
      foundationId: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.NeedInclude;

export type NeedWithCampaign = Prisma.NeedGetPayload<{
  include: typeof needInclude;
}>;

export class NeedsRepository {
  /**
   * Entrada: campaignId: id de campana; query: paginacion.
   * Proceso: Lista necesidades activas de la campana ordenadas por prioridad y fecha.
   * Salida: Retorna items paginados y total de registros.
   */
  async findByCampaignPaginated(
    campaignId: string,
    query: ListNeedsQueryDto,
  ): Promise<{ items: NeedWithCampaign[]; total: number }> {
    const where: Prisma.NeedWhereInput = {
      campaignId,
      deletedAt: null,
    };

    const [items, total] = await Promise.all([
      prisma.need.findMany({
        where,
        include: needInclude,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.need.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Entrada: id: identificador de la necesidad.
   * Proceso: Obtiene la necesidad activa con datos minimos de campana.
   * Salida: Retorna la entidad o null si no existe o esta eliminada.
   */
  async findById(id: string): Promise<NeedWithCampaign | null> {
    return prisma.need.findFirst({
      where: { id, deletedAt: null },
      include: needInclude,
    });
  }

  /**
   * Entrada: data: datos de creacion validados.
   * Proceso: Persiste una nueva necesidad vinculada a la campana.
   * Salida: Retorna la necesidad creada con campana.
   */
  async create(data: CreateNeedDto): Promise<NeedWithCampaign> {
    return prisma.need.create({
      data: {
        campaignId: data.campaignId,
        name: data.name,
        description: data.description ?? null,
        quantity: data.quantity,
        unit: data.unit,
        priority: data.priority,
      },
      include: needInclude,
    });
  }

  /**
   * Entrada: id: identificador; data: campos a actualizar.
   * Proceso: Actualiza la necesidad existente.
   * Salida: Retorna la necesidad actualizada con campana.
   */
  async update(id: string, data: UpdateNeedDto): Promise<NeedWithCampaign> {
    const updateData: Prisma.NeedUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity;
    }

    if (data.unit !== undefined) {
      updateData.unit = data.unit;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    return prisma.need.update({
      where: { id },
      data: updateData,
      include: needInclude,
    });
  }

  /**
   * Entrada: id: identificador de la necesidad.
   * Proceso: Marca la necesidad como eliminada con soft delete.
   * Salida: Retorna void tras actualizar deletedAt.
   */
  async softDelete(id: string): Promise<void> {
    await prisma.need.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Entrada: needId: identificador de la necesidad.
   * Proceso: Cuenta donaciones asociadas a la necesidad.
   * Salida: Retorna el numero total de donaciones.
   */
  async countDonationsByNeedId(needId: string): Promise<number> {
    return prisma.donation.count({
      where: { needId },
    });
  }
}

export const needsRepository = new NeedsRepository();
