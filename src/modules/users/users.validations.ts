import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

const optionalNullableTrimmed = (min: number, max: number, minMsg: string, maxMsg?: string) =>
  z
    .string()
    .trim()
    .min(min, minMsg)
    .max(max, maxMsg ?? minMsg)
    .nullable()
    .optional();

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
    phone: optionalNullableTrimmed(
      7,
      20,
      VALIDATION_MESSAGES.USER_PHONE_MIN_LENGTH,
      VALIDATION_MESSAGES.USER_PHONE_MAX_LENGTH,
    ),
    city: optionalNullableTrimmed(
      2,
      100,
      VALIDATION_MESSAGES.USER_CITY_MIN_LENGTH,
      VALIDATION_MESSAGES.USER_CITY_MAX_LENGTH,
    ),
    department: optionalNullableTrimmed(
      2,
      100,
      VALIDATION_MESSAGES.USER_DEPARTMENT_MIN_LENGTH,
      VALIDATION_MESSAGES.USER_DEPARTMENT_MAX_LENGTH,
    ),
    bio: z
      .string()
      .trim()
      .max(500, VALIDATION_MESSAGES.USER_BIO_MAX_LENGTH)
      .nullable()
      .optional(),
    avatarUrl: z
      .string()
      .trim()
      .url(VALIDATION_MESSAGES.INVALID_URL)
      .nullable()
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
