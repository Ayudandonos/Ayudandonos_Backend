import type {
  AdminDashboardDataDto,
  AdminDashboardQueryDto,
  AdminFeaturedCampaignItemDto,
  CampaignWithNeedProgressRow,
} from './admin.dto.js';
import { adminRepository } from './admin.repository.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class AdminService {
  /**
   * Entrada: query: limites opcionales para listas del dashboard.
   * Proceso: Agrega KPIs y listas desde la base de datos segun reglas de negocio v1.
   * Salida: Retorna el payload del panel administrativo.
   */
  async getDashboard(query: AdminDashboardQueryDto): Promise<AdminDashboardDataDto> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

    const [
      activeCampaigns,
      activeCampaignsThirtyDaysAgo,
      pendingNeeds,
      deliveredAids,
      verifiedFoundations,
      pendingNeedsCritical,
      latestNeedRows,
      campaignRows,
    ] = await Promise.all([
      adminRepository.countActiveCampaigns(now),
      adminRepository.countActiveCampaigns(thirtyDaysAgo),
      adminRepository.countPendingNeeds(),
      adminRepository.countDeliveredAids(),
      adminRepository.countVerifiedFoundations(),
      adminRepository.hasPendingHighPriorityNeed(),
      adminRepository.findLatestPendingNeeds(query.latestNeedsLimit),
      adminRepository.findPublishedCampaignsWithNeeds(now),
    ]);

    const activeCampaignsTrendPercent = this.computeTrendPercent(
      activeCampaigns,
      activeCampaignsThirtyDaysAgo,
    );

    const featuredCampaigns = this.buildFeaturedCampaigns(
      campaignRows,
      query.featuredCampaignsLimit,
      now,
    );

    return {
      kpis: {
        activeCampaigns,
        pendingNeeds,
        deliveredAids,
        verifiedFoundations,
        activeCampaignsTrendPercent,
        pendingNeedsCritical,
      },
      latestNeeds: latestNeedRows.map((row) => ({
        id: row.id,
        name: row.name,
        foundationName: row.foundationName,
        priority: row.priority,
        publishedAt: row.createdAt.toISOString(),
      })),
      ...(featuredCampaigns.length > 0 ? { featuredCampaigns } : { featuredCampaigns: [] }),
    };
  }

  /**
   * Entrada: current: valor actual; previous: valor del periodo anterior.
   * Proceso: Calcula variacion porcentual redondeada; null si el denominador es cero.
   * Salida: Retorna el porcentaje de tendencia o null.
   */
  computeTrendPercent(current: number, previous: number): number | null {
    if (previous === 0) {
      return null;
    }

    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Entrada: needs: cantidades de la campana.
   * Proceso: Agrega progreso como sum fulfilled / sum quantity acotado a 0-100.
   * Salida: Retorna entero de porcentaje de avance.
   */
  computeCampaignProgressPercent(needs: { quantity: number; fulfilledQuantity: number }[]): number {
    const totalRequired = needs.reduce((sum, need) => sum + need.quantity, 0);
    const totalFulfilled = needs.reduce((sum, need) => sum + need.fulfilledQuantity, 0);

    if (totalRequired <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((totalFulfilled / totalRequired) * 100));
  }

  /**
   * Entrada: endDate: fecha fin de campana; now: instante actual.
   * Proceso: Calcula dias restantes con redondeo hacia arriba; null si no hay fecha fin.
   * Salida: Retorna dias restantes o null.
   */
  computeDaysRemaining(endDate: Date | null, now: Date): number | null {
    if (!endDate) {
      return null;
    }

    const diffMs = endDate.getTime() - now.getTime();
    return Math.ceil(diffMs / MS_PER_DAY);
  }

  /**
   * Entrada: campaigns: campanas publicadas; limit: maximo a devolver; now: referencia temporal.
   * Proceso: Ordena por progreso, urgencia de fin y antiguedad; marca la primera como principal.
   * Salida: Retorna lista de campanas destacadas para el panel lateral.
   */
  private buildFeaturedCampaigns(
    campaigns: CampaignWithNeedProgressRow[],
    limit: number,
    now: Date,
  ): AdminFeaturedCampaignItemDto[] {
    const ranked = campaigns
      .map((campaign) => ({
        campaign,
        progressPercent: this.computeCampaignProgressPercent(campaign.needs),
        daysRemaining: this.computeDaysRemaining(campaign.endDate, now),
      }))
      .sort((a, b) => {
        if (b.progressPercent !== a.progressPercent) {
          return b.progressPercent - a.progressPercent;
        }

        const aEnd = a.campaign.endDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bEnd = b.campaign.endDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        if (aEnd !== bEnd) {
          return aEnd - bEnd;
        }

        return b.campaign.createdAt.getTime() - a.campaign.createdAt.getTime();
      })
      .slice(0, limit);

    return ranked.map((item, index) => ({
      id: item.campaign.id,
      title: item.campaign.title,
      description: item.campaign.description,
      imageUrl: item.campaign.imageUrl,
      progressPercent: item.progressPercent,
      daysRemaining: item.daysRemaining,
      ...(index === 0 ? { isPrimary: true } : {}),
    }));
  }
}

export const adminService = new AdminService();
