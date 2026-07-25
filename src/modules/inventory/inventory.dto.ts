import type { StockMovementType } from '@prisma/client';

export interface InventoryItemDto {
  id: string;
  name: string;
  unit: string;
  quantityAvailable: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementDto {
  id: string;
  type: StockMovementType;
  quantity: number;
  note: string | null;
  createdAt: string;
  inventoryItem: {
    id: string;
    name: string;
    unit: string;
  };
  donation: {
    id: string;
    donorFullName: string;
  } | null;
  campaign: {
    id: string;
    title: string;
  } | null;
  foundationBranch: {
    id: string;
    name: string;
    city: string;
  } | null;
}

export interface InventoryOutboundSummaryDto {
  id: string;
  title: string;
  totalQuantityDelivered: number;
  observations: string | null;
  createdAt: string;
  campaign: {
    id: string;
    title: string;
  };
  foundationBranch: {
    id: string;
    name: string;
    city: string;
  };
  postId: string | null;
}

export interface OutboundResultDto {
  outboundId: string;
  postId: string;
  postSlug: string;
  publicPath: string;
  totalQuantityDelivered: number;
}

export interface ListInventoryMovementsQueryDto {
  page: number;
  limit: number;
  type?: StockMovementType;
}
