import { CampaignStatus, DonationStatus, FoundationStatus, Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type { CampaignWithNeedProgressRow } from './admin.dto.js';

export interface AdminLatestNeedRow {
  id: string;
  name: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
  foundationName: string;
}

export class AdminRepository {
  /**
   * Entrada: at: instante de referencia para vigencia de campanas.
   * Proceso: Construye el filtro Prisma de campanas activas publicadas en esa fecha.
   * Salida: Retorna condiciones where reutilizables en consultas de campanas.
   */
  private buildActivePublishedCampaignWhere(at: Date): Prisma.CampaignWhereInput {
    return {
      status: CampaignStatus.PUBLISHED,
      deletedAt: null,
      AND: [
        {
          OR: [{ endDate: null }, { endDate: { gte: at } }],
        },
        {
          OR: [{ startDate: null }, { startDate: { lte: at } }],
        },
      ],
    };
  }

  /**
   * Entrada: at: instante de referencia.
   * Proceso: Cuenta campanas publicadas vigentes segun fechas de inicio y fin.
   * Salida: Retorna el total de campanas activas.
   */
  async countActiveCampaigns(at: Date): Promise<number> {
    return prisma.campaign.count({
      where: this.buildActivePublishedCampaignWhere(at),
    });
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Cuenta necesidades con cantidad pendiente en campanas no canceladas ni eliminadas.
   * Salida: Retorna el total de needs pendientes.
   */
  async countPendingNeeds(): Promise<number> {
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM needs n
      INNER JOIN campaigns c ON c.id = n.campaign_id
      WHERE n.deleted_at IS NULL
        AND n.fulfilled_quantity < n.quantity
        AND c.deleted_at IS NULL
        AND c.status <> ${CampaignStatus.CANCELLED}::"CampaignStatus"
    `;

    return Number(result[0]?.count ?? 0);
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Verifica si existe al menos una need pendiente con prioridad alta.
   * Salida: Retorna true si hay needs criticas pendientes.
   */
  async hasPendingHighPriorityNeed(): Promise<boolean> {
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM needs n
        INNER JOIN campaigns c ON c.id = n.campaign_id
        WHERE n.deleted_at IS NULL
          AND n.fulfilled_quantity < n.quantity
          AND n.priority = 'HIGH'::"NeedPriority"
          AND c.deleted_at IS NULL
          AND c.status <> ${CampaignStatus.CANCELLED}::"CampaignStatus"
      ) AS exists
    `;

    return Boolean(result[0]?.exists);
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Cuenta donaciones entregadas o confirmadas segun regla de negocio v1.
   * Salida: Retorna el total de ayudas entregadas.
   */
  async countDeliveredAids(): Promise<number> {
    return prisma.donation.count({
      where: {
        status: {
          in: [DonationStatus.DELIVERED, DonationStatus.CONFIRMED],
        },
      },
    });
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Cuenta fundaciones verificadas con usuario activo.
   * Salida: Retorna el total de fundaciones verificadas.
   */
  async countVerifiedFoundations(): Promise<number> {
    return prisma.foundation.count({
      where: {
        status: FoundationStatus.VERIFIED,
        user: { isActive: true },
      },
    });
  }

  /**
   * Entrada: limit: cantidad maxima de filas.
   * Proceso: Obtiene needs pendientes de campanas publicadas ordenadas por fecha de creacion.
   * Salida: Retorna filas con nombre de fundacion para el dashboard.
   */
  async findLatestPendingNeeds(limit: number): Promise<AdminLatestNeedRow[]> {
    return prisma.$queryRaw<AdminLatestNeedRow[]>`
      SELECT
        n.id,
        n.name,
        n.priority,
        n.created_at AS "createdAt",
        f.name AS "foundationName"
      FROM needs n
      INNER JOIN campaigns c ON c.id = n.campaign_id
      INNER JOIN foundations f ON f.id = c.foundation_id
      WHERE n.deleted_at IS NULL
        AND n.fulfilled_quantity < n.quantity
        AND c.deleted_at IS NULL
        AND c.status = ${CampaignStatus.PUBLISHED}::"CampaignStatus"
      ORDER BY n.created_at DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Entrada: at: instante de referencia para vigencia.
   * Proceso: Carga campanas publicadas vigentes con needs no eliminadas para calcular progreso.
   * Salida: Retorna campanas con cantidades agregables por need.
   */
  async findPublishedCampaignsWithNeeds(at: Date): Promise<CampaignWithNeedProgressRow[]> {
    return prisma.campaign.findMany({
      where: this.buildActivePublishedCampaignWhere(at),
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        endDate: true,
        createdAt: true,
        needs: {
          where: { deletedAt: null },
          select: {
            quantity: true,
            fulfilledQuantity: true,
          },
        },
      },
    });
  }
}

export const adminRepository = new AdminRepository();
