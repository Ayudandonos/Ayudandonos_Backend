import type {
  AdminDashboardDataDto,
  AdminDashboardQueryDto,
  AdminFeaturedCampaignItemDto,
  AdminReportMonthlyItemDto,
  AdminReportSeriesItemDto,
  AdminReportsDataDto,
  CampaignWithNeedProgressRow,
} from './admin.dto.js';
import { adminRepository } from './admin.repository.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REPORT_MONTHS = 6;

const ROLE_LABELS: Record<string, string> = {
  USER: 'Donantes',
  FOUNDATION: 'Fundaciones',
  ADMIN: 'Administradores',
};

const FOUNDATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendientes',
  VERIFIED: 'Verificadas',
  REJECTED: 'Rechazadas',
  SUSPENDED: 'Suspendidas',
};

const DONATION_STATUS_LABELS: Record<string, string> = {
  COMMITTED: 'Comprometidas',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregadas',
  CONFIRMED: 'Confirmadas',
  CANCELLED: 'Canceladas',
};

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicadas',
  FINISHED: 'Finalizadas',
  CANCELLED: 'Canceladas',
};

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

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
   * Entrada: Ninguna.
   * Proceso: Agrega resumen, series por estado/rol y actividad mensual de los ultimos meses.
   * Salida: Retorna el payload de reportes administrativos.
   */
  async getReports(): Promise<AdminReportsDataDto> {
    const from = this.getReportsPeriodStart(new Date(), REPORT_MONTHS);

    const [
      summary,
      usersByRole,
      foundationsByStatus,
      donationsByStatus,
      campaignsByStatus,
      monthlyRows,
    ] = await Promise.all([
      adminRepository.getReportSummaryCounts(),
      adminRepository.groupUsersByRole(),
      adminRepository.groupFoundationsByStatus(),
      adminRepository.groupDonationsByStatus(),
      adminRepository.groupCampaignsByStatus(),
      adminRepository.getMonthlyActivitySince(from),
    ]);

    return {
      summary,
      usersByRole: this.mapSeries(usersByRole, ROLE_LABELS),
      foundationsByStatus: this.mapSeries(foundationsByStatus, FOUNDATION_STATUS_LABELS),
      donationsByStatus: this.mapSeries(donationsByStatus, DONATION_STATUS_LABELS),
      campaignsByStatus: this.mapSeries(campaignsByStatus, CAMPAIGN_STATUS_LABELS),
      monthlyActivity: this.buildMonthlyActivity(monthlyRows, REPORT_MONTHS),
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
   * Entrada: now: instante actual; months: cantidad de meses a cubrir.
   * Proceso: Calcula el inicio del mes mas antiguo del periodo de reportes.
   * Salida: Retorna la fecha de inicio del primer mes incluido.
   */
  private getReportsPeriodStart(now: Date, months: number): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  }

  /**
   * Entrada: rows: pares clave/valor; labels: etiquetas en espanol por clave.
   * Proceso: Transforma filas crudas en series etiquetadas para graficos.
   * Salida: Retorna items de serie ordenados por valor descendente.
   */
  private mapSeries(
    rows: Array<{ key: string; value: number }>,
    labels: Record<string, string>,
  ): AdminReportSeriesItemDto[] {
    return rows
      .map((row) => ({
        key: row.key,
        label: labels[row.key] ?? row.key,
        value: row.value,
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Entrada: rows: altas mensuales; months: cantidad de meses a completar.
   * Proceso: Rellena meses sin datos con ceros y genera etiquetas cortas.
   * Salida: Retorna la serie mensual continua para graficos de lineas y barras.
   */
  private buildMonthlyActivity(
    rows: Array<{
      monthKey: string;
      users: number;
      foundations: number;
      donations: number;
      campaigns: number;
    }>,
    months: number,
  ): AdminReportMonthlyItemDto[] {
    const byMonth = new Map(rows.map((row) => [row.monthKey, row]));
    const now = new Date();
    const result: AdminReportMonthlyItemDto[] = [];

    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      const values = byMonth.get(monthKey) ?? {
        users: 0,
        foundations: 0,
        donations: 0,
        campaigns: 0,
      };

      result.push({
        monthKey,
        label: MONTH_LABELS[date.getUTCMonth()] ?? monthKey,
        users: values.users,
        foundations: values.foundations,
        donations: values.donations,
        campaigns: values.campaigns,
      });
    }

    return result;
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
