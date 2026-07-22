import type { DonationStatus } from '@prisma/client';

export type DonationNeedSummaryDto = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  fulfilledQuantity: number;
};

export type DonationCampaignSummaryDto = {
  id: string;
  title: string;
  status: string;
};

export type DonationDonorSummaryDto = {
  id: string;
  fullName: string;
};

export type DonationStatusHistoryDto = {
  id: string;
  fromStatus: DonationStatus | null;
  toStatus: DonationStatus;
  changedById: string | null;
  changedByFullName: string | null;
  note: string | null;
  createdAt: string;
};

export type DonationDto = {
  id: string;
  needId: string;
  donorUserId: string;
  status: DonationStatus;
  quantity: number;
  notes: string | null;
  estimatedDeliveryAt: string | null;
  deliveryAddress: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  createdAt: string;
  updatedAt: string;
  conversationId: string | null;
  need: DonationNeedSummaryDto;
  campaign: DonationCampaignSummaryDto;
  donor: DonationDonorSummaryDto;
  statusHistory: DonationStatusHistoryDto[];
};

export type CreateDonationDto = {
  needId: string;
  quantity: number;
  notes?: string;
  estimatedDeliveryAt?: string;
  initialMessage?: string;
};

export type UpdateDonationStatusDto = {
  status: DonationStatus;
};

export type UpdateDonationDeliveryDto = {
  deliveryAddress?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  estimatedDeliveryAt?: string | null;
};

export type ListDonationsQueryDto = {
  page: number;
  limit: number;
  status?: DonationStatus;
};

export type MessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  senderFullName: string;
  body: string;
  createdAt: string;
};

export type CreateMessageDto = {
  body: string;
};

export type ListMessagesQueryDto = {
  page: number;
  limit: number;
};

export type DonationStatusStatsDto = {
  count: number;
  quantity: number;
};

export type DonorDonationStatsDto = {
  totalDonations: number;
  totalQuantity: number;
  deliveredQuantity: number;
  cancelledDonations: number;
  byStatus: Record<DonationStatus, DonationStatusStatsDto>;
};
