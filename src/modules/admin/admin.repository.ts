import { CampaignStatus, DonationStatus, FoundationStatus, Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.client.js';
import type { AdminCampaignsQueryDto, CampaignWithNeedProgressRow } from './admin.dto.js';

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
   * Entrada: Ninguna.
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

  /**
   * Entrada: Ninguna.
   * Proceso: Cuenta usuarios, fundaciones, donaciones, campanas y needs para resumen.
   * Salida: Retorna totales del reporte administrativo.
   */
  async getReportSummaryCounts(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalFoundations: number;
    verifiedFoundations: number;
    totalDonations: number;
    deliveredDonations: number;
    totalCampaigns: number;
    totalNeeds: number;
  }> {
    const [
      totalUsers,
      activeUsers,
      totalFoundations,
      verifiedFoundations,
      totalDonations,
      deliveredDonations,
      totalCampaigns,
      totalNeeds,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.foundation.count(),
      prisma.foundation.count({
        where: { status: FoundationStatus.VERIFIED, user: { isActive: true } },
      }),
      prisma.donation.count(),
      prisma.donation.count({
        where: { status: { in: [DonationStatus.DELIVERED, DonationStatus.CONFIRMED] } },
      }),
      prisma.campaign.count({ where: { deletedAt: null } }),
      prisma.need.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalFoundations,
      verifiedFoundations,
      totalDonations,
      deliveredDonations,
      totalCampaigns,
      totalNeeds,
    };
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Agrupa usuarios por rol.
   * Salida: Retorna pares role/count.
   */
  async groupUsersByRole(): Promise<Array<{ key: string; value: number }>> {
    const rows = await prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.role,
      value: row._count._all,
    }));
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Agrupa fundaciones por estado.
   * Salida: Retorna pares status/count.
   */
  async groupFoundationsByStatus(): Promise<Array<{ key: string; value: number }>> {
    const rows = await prisma.foundation.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.status,
      value: row._count._all,
    }));
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Agrupa donaciones por estado.
   * Salida: Retorna pares status/count.
   */
  async groupDonationsByStatus(): Promise<Array<{ key: string; value: number }>> {
    const rows = await prisma.donation.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.status,
      value: row._count._all,
    }));
  }

  /**
   * Entrada: Ninguna.
   * Proceso: Agrupa campanas no eliminadas por estado.
   * Salida: Retorna pares status/count.
   */
  async groupCampaignsByStatus(): Promise<Array<{ key: string; value: number }>> {
    const rows = await prisma.campaign.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.status,
      value: row._count._all,
    }));
  }

  /**
   * Entrada: from: inicio del periodo mensual.
   * Proceso: Cuenta altas mensuales de usuarios, fundaciones, donaciones y campanas.
   * Salida: Retorna series mensuales tipadas.
   */
  async getMonthlyActivitySince(from: Date): Promise<
    Array<{
      monthKey: string;
      users: number;
      foundations: number;
      donations: number;
      campaigns: number;
    }>
  > {
    const [users, foundations, donations, campaigns] = await Promise.all([
      prisma.$queryRaw<Array<{ month_key: string; total: bigint }>>`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month_key,
               COUNT(*)::bigint AS total
        FROM users
        WHERE created_at >= ${from}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<Array<{ month_key: string; total: bigint }>>`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month_key,
               COUNT(*)::bigint AS total
        FROM foundations
        WHERE created_at >= ${from}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<Array<{ month_key: string; total: bigint }>>`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month_key,
               COUNT(*)::bigint AS total
        FROM donations
        WHERE created_at >= ${from}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<Array<{ month_key: string; total: bigint }>>`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month_key,
               COUNT(*)::bigint AS total
        FROM campaigns
        WHERE created_at >= ${from}
          AND deleted_at IS NULL
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    const map = new Map<
      string,
      { users: number; foundations: number; donations: number; campaigns: number }
    >();

    /**
     * Entrada: rows: conteos mensuales; field: clave de metrica a llenar.
     * Proceso: Acumula totales por mes en el mapa compartido.
     * Salida: No retorna valor.
     */
    const merge = (
      rows: Array<{ month_key: string; total: bigint }>,
      field: 'users' | 'foundations' | 'donations' | 'campaigns',
    ) => {
      for (const row of rows) {
        const current = map.get(row.month_key) ?? {
          users: 0,
          foundations: 0,
          donations: 0,
          campaigns: 0,
        };
        current[field] = Number(row.total);
        map.set(row.month_key, current);
      }
    };

    merge(users, 'users');
    merge(foundations, 'foundations');
    merge(donations, 'donations');
    merge(campaigns, 'campaigns');

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, values]) => ({
        monthKey,
        ...values,
      }));
  }

  /**
   * Entrada: query: paginacion, busqueda y estado opcional.
   * Proceso: Lista campanas no eliminadas con fundacion, creador y conteos de needs/donaciones.
   * Salida: Retorna items enriquecidos y total de registros.
   */
  async findCampaignsForAdmin(query: AdminCampaignsQueryDto): Promise<{
    items: Array<{
      id: string;
      title: string;
      status: CampaignStatus;
      imageUrl: string | null;
      startDate: Date | null;
      endDate: Date | null;
      createdAt: Date;
      foundation: {
        id: string;
        name: string;
        city: string | null;
        department: string | null;
        user: { fullName: string; email: string };
      };
      needs: Array<{ _count: { donations: number } }>;
    }>;
    total: number;
  }> {
    const where: Prisma.CampaignWhereInput = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { foundation: { name: { contains: query.search, mode: 'insensitive' } } },
        { foundation: { user: { fullName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          imageUrl: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          foundation: {
            select: {
              id: true,
              name: true,
              city: true,
              department: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          needs: {
            where: { deletedAt: null },
            select: {
              _count: {
                select: { donations: true },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return { items, total };
  }
}

export const adminRepository = new AdminRepository();
