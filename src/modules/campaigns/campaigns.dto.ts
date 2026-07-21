import type { CampaignStatus } from '@prisma/client';

export interface ListCampaignsQueryDto {
  page: number;
  limit: number;
  search?: string;
  status?: CampaignStatus;
}

export interface CreateCampaignDto {
  title: string;
  description: string;
  imageUrl?: string | null;
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

export interface CampaignDto {
  id: string;
  foundationId: string;
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
}
