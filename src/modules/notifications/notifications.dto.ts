import type { NotificationType } from '@prisma/client';

export interface ListNotificationsQueryDto {
  page: number;
  limit: number;
  unreadOnly?: boolean;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath: string | null;
  resourceType: string | null;
  resourceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsUnreadCountDto {
  unreadCount: number;
}
