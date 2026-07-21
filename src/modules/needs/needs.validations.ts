import { NeedPriority } from '@prisma/client';
import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

const nameField = z
  .string()
  .trim()
  .min(2, VALIDATION_MESSAGES.NEED_NAME_MIN_LENGTH)
  .max(200, VALIDATION_MESSAGES.NEED_NAME_MAX_LENGTH);

const descriptionField = z
  .string()
  .trim()
  .max(2000, VALIDATION_MESSAGES.NEED_DESCRIPTION_MAX_LENGTH)
  .nullable()
  .optional();

const quantityField = z.coerce
  .number()
  .int()
  .min(1, VALIDATION_MESSAGES.NEED_QUANTITY_MIN);

const unitField = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGES.NEED_UNIT_MIN_LENGTH)
  .max(50, VALIDATION_MESSAGES.NEED_UNIT_MAX_LENGTH);

const campaignIdField = z
  .string()
  .uuid(VALIDATION_MESSAGES.INVALID_CAMPAIGN_UUID);

export const listNeedsQuerySchema = z.object({
  campaignId: campaignIdField,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const needIdParamSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.INVALID_NEED_UUID),
});

export const createNeedSchema = z.object({
  campaignId: campaignIdField,
  name: nameField,
  description: descriptionField,
  quantity: quantityField,
  unit: unitField,
  priority: z.nativeEnum(NeedPriority).optional(),
});

export const updateNeedSchema = z
  .object({
    name: nameField.optional(),
    description: descriptionField,
    quantity: quantityField.optional(),
    unit: unitField.optional(),
    priority: z.nativeEnum(NeedPriority).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: VALIDATION_MESSAGES.UPDATE_EMPTY_BODY,
  });

export type ListNeedsQueryInput = z.infer<typeof listNeedsQuerySchema>;
export type NeedIdParamInput = z.infer<typeof needIdParamSchema>;
export type CreateNeedInput = z.infer<typeof createNeedSchema>;
export type UpdateNeedInput = z.infer<typeof updateNeedSchema>;
