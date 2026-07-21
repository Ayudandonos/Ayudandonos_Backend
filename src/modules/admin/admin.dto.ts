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

export interface CampaignWithNeedProgressRow {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  endDate: Date | null;
  createdAt: Date;
  needs: { quantity: number; fulfilledQuantity: number }[];
}
