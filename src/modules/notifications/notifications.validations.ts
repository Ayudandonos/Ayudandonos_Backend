import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (typeof value === 'boolean') {
        return value;
      }
      return value === 'true';
    }),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.INVALID_NOTIFICATION_UUID),
});

export type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;
export type NotificationIdParamInput = z.infer<typeof notificationIdParamSchema>;
