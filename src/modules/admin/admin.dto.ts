import type { NeedPriority } from '@prisma/client';

export interface AdminDashboardQueryDto {
  latestNeedsLimit: number;
  featuredCampaignsLimit: number;
}

export interface AdminDashboardKpisDto {
  activeCampaigns: number;
  pendingNeeds: number;
  deliveredAids: number;
  verifiedFoundations: number;
  activeCampaignsTrendPercent?: number | null;
  pendingNeedsCritical?: boolean;
}

export interface AdminLatestNeedItemDto {
  id: string;
  name: string;
  foundationName: string;
  priority: NeedPriority;
  publishedAt: string;
}

export interface AdminFeaturedCampaignItemDto {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  progressPercent: number;
  daysRemaining: number | null;
  isPrimary?: boolean;
}

export interface AdminDashboardDataDto {
  kpis: AdminDashboardKpisDto;
  latestNeeds: AdminLatestNeedItemDto[];
  featuredCampaigns?: AdminFeaturedCampaignItemDto[];
}

export interface AdminReportSeriesItemDto {
  key: string;
  label: string;
  value: number;
}

export interface AdminReportMonthlyItemDto {
  monthKey: string;
  label: string;
  users: number;
  foundations: number;
  donations: number;
  campaigns: number;
}

export interface AdminReportsSummaryDto {
  totalUsers: number;
  totalFoundations: number;
  totalDonations: number;
  totalCampaigns: number;
  totalNeeds: number;
  activeUsers: number;
  verifiedFoundations: number;
  deliveredDonations: number;
}

export interface AdminReportsDataDto {
  summary: AdminReportsSummaryDto;
  usersByRole: AdminReportSeriesItemDto[];
  foundationsByStatus: AdminReportSeriesItemDto[];
  donationsByStatus: AdminReportSeriesItemDto[];
  campaignsByStatus: AdminReportSeriesItemDto[];
  monthlyActivity: AdminReportMonthlyItemDto[];
}

export interface AdminCampaignsQueryDto {
  page: number;
  limit: number;
  search?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'FINISHED' | 'CANCELLED';
}

export interface AdminCampaignListItemDto {
  id: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'FINISHED' | 'CANCELLED';
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  donationsCount: number;
  needsCount: number;
  foundation: {
    id: string;
    name: string;
    city: string | null;
    department: string | null;
  };
  createdBy: {
    fullName: string;
    email: string;
  };
}

export interface CampaignWithNeedProgressRow {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  endDate: Date | null;
  createdAt: Date;
  needs: { quantity: number; fulfilledQuantity: number }[];
}
