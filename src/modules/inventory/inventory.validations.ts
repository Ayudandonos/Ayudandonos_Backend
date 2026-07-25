import { StockMovementType } from '@prisma/client';
import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

const outboundLineSchema = z.object({
  inventoryItemId: z.string().uuid(VALIDATION_MESSAGES.INVALID_INVENTORY_ITEM_UUID),
  quantity: z
    .number()
    .int(VALIDATION_MESSAGES.INVENTORY_QUANTITY_MIN)
    .min(1, VALIDATION_MESSAGES.INVENTORY_QUANTITY_MIN),
});

export const createOutboundSchema = z.object({
  campaignId: z.string().uuid(VALIDATION_MESSAGES.INVALID_CAMPAIGN_UUID),
  foundationBranchId: z.string().uuid(VALIDATION_MESSAGES.INVALID_BRANCH_UUID),
  title: z
    .string()
    .trim()
    .min(3, VALIDATION_MESSAGES.POST_TITLE_MIN_LENGTH)
    .max(200, VALIDATION_MESSAGES.POST_TITLE_MAX_LENGTH),
  description: z
    .string()
    .trim()
    .min(10, VALIDATION_MESSAGES.POST_DESCRIPTION_MIN_LENGTH)
    .max(5000, VALIDATION_MESSAGES.POST_DESCRIPTION_MAX_LENGTH),
  observations: z
    .string()
    .trim()
    .max(2000, VALIDATION_MESSAGES.INVENTORY_NOTE_MAX_LENGTH)
    .optional()
    .nullable(),
  lines: z
    .array(outboundLineSchema)
    .min(1, VALIDATION_MESSAGES.INVENTORY_OUTBOUND_LINES_REQUIRED),
});

export const listInventoryMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.nativeEnum(StockMovementType).optional(),
});

export type CreateOutboundInput = z.infer<typeof createOutboundSchema>;
export type ListInventoryMovementsQueryInput = z.infer<typeof listInventoryMovementsQuerySchema>;
