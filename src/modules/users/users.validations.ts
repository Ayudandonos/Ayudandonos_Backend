import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  role: z.enum(['USER', 'FOUNDATION', 'ADMIN']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.INVALID_UUID),
});

export const updateUserSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, VALIDATION_MESSAGES.FULL_NAME_MIN_LENGTH)
      .optional(),
    isActive: z.boolean().optional(),
    role: z.enum(['USER', 'FOUNDATION', 'ADMIN']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: VALIDATION_MESSAGES.UPDATE_EMPTY_BODY,
  });

export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type UserIdParamInput = z.infer<typeof userIdParamSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
