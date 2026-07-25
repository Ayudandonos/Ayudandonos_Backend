import type { CampaignStatus, FoundationBranchStatus } from '@prisma/client';

export interface ListCampaignsQueryDto {
  page: number;
  limit: number;
  search?: string;
  status?: CampaignStatus;
}

export interface CreateCampaignDto {
  title: string;
  description: string;
  foundationBranchId: string;
  status?: CampaignStatus;
  startDate?: string | null;
  endDate?: string | null;
  deliveryAddress?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
}

export interface UpdateCampaignDto {
  title?: string;
  description?: string;
  imageUrl?: string | null;
  foundationBranchId?: string;
  status?: CampaignStatus;
  startDate?: string | null;
  endDate?: string | null;
  deliveryAddress?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
}

export interface CampaignFoundationSummaryDto {
  id: string;
  name: string;
  acronym: string | null;
  slug: string | null;
  logoUrl: string | null;
  city: string | null;
  department: string | null;
}

export interface CampaignBranchSummaryDto {
  id: string;
  name: string;
  department: string;
  city: string;
  address: string;
  reference: string | null;
  phone: string;
  openingHours: string;
  latitude: number | null;
  longitude: number | null;
  status: FoundationBranchStatus;
}

export interface CampaignDto {
  id: string;
  foundationId: string;
  foundationBranchId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  status: CampaignStatus;
  startDate: string | null;
  endDate: string | null;
  deliveryAddress: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  createdAt: string;
  updatedAt: string;
  foundation: CampaignFoundationSummaryDto;
  branch: CampaignBranchSummaryDto;
}
