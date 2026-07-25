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

export type DonationFoundationSummaryDto = {
  id: string;
  name: string;
  acronym: string | null;
  logoUrl: string | null;
};

export type DonationBranchSummaryDto = {
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

export type DonationConversationSummaryDto = {
  lastMessageAt: string | null;
  lastMessageBody: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
};

export type DonationDto = {
  id: string;
  needId: string;
  donorUserId: string;
  foundationBranchId: string;
  status: DonationStatus;
  quantity: number;
  receivedQuantity: number | null;
  notes: string | null;
  estimatedDeliveryAt: string | null;
  receivedAt: string | null;
  receptionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  conversationId: string | null;
  conversation: DonationConversationSummaryDto | null;
  need: DonationNeedSummaryDto;
  campaign: DonationCampaignSummaryDto;
  foundation: DonationFoundationSummaryDto;
  branch: DonationBranchSummaryDto;
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
  receivedQuantity?: number;
  receptionNotes?: string | null;
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
  receivedQuantity: number;
  cancelledDonations: number;
  byStatus: Record<DonationStatus, DonationStatusStatsDto>;
};
