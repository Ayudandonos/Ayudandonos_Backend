import type { NeedPriority } from '@prisma/client';

export interface ListNeedsQueryDto {
  campaignId: string;
  page: number;
  limit: number;
}

export interface CreateNeedDto {
  campaignId: string;
  name: string;
  description?: string | null;
  quantity: number;
  unit: string;
  priority?: NeedPriority;
}

export interface UpdateNeedDto {
  name?: string;
  description?: string | null;
  quantity?: number;
  unit?: string;
  priority?: NeedPriority;
}

export interface NeedDto {
  id: string;
  campaignId: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  priority: NeedPriority;
  fulfilledQuantity: number;
  createdAt: string;
  updatedAt: string;
}
