import { CampaignStatus } from '@prisma/client';
import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants.js';

const titleField = z
  .string()
  .trim()
  .min(3, VALIDATION_MESSAGES.CAMPAIGN_TITLE_MIN_LENGTH)
  .max(200, VALIDATION_MESSAGES.CAMPAIGN_TITLE_MAX_LENGTH);

const descriptionField = z
  .string()
  .trim()
  .min(10, VALIDATION_MESSAGES.CAMPAIGN_DESCRIPTION_MIN_LENGTH)
  .max(5000, VALIDATION_MESSAGES.CAMPAIGN_DESCRIPTION_MAX_LENGTH);

const optionalDateField = z
  .string()
  .datetime({ message: VALIDATION_MESSAGES.CAMPAIGN_INVALID_DATE })
  .nullable()
  .optional();

const foundationBranchIdField = z
  .string()
  .uuid(VALIDATION_MESSAGES.INVALID_BRANCH_UUID);

export const listCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
});

export const campaignIdParamSchema = z.object({
  id: z.string().uuid(VALIDATION_MESSAGES.INVALID_CAMPAIGN_UUID),
});

export const createCampaignSchema = z
  .object({
    title: titleField,
    description: descriptionField,
    foundationBranchId: foundationBranchIdField,
    status: z.nativeEnum(CampaignStatus).optional(),
    startDate: optionalDateField,
    endDate: optionalDateField,
  })
  .superRefine((data, ctx) => {
    if (data.status && data.status !== CampaignStatus.DRAFT && data.status !== CampaignStatus.PUBLISHED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.CAMPAIGN_CREATE_STATUS_INVALID,
        path: ['status'],
      });
    }

    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.CAMPAIGN_END_BEFORE_START,
        path: ['endDate'],
      });
    }
  });

export const updateCampaignSchema = z
  .object({
    title: titleField.optional(),
    description: descriptionField.optional(),
    foundationBranchId: foundationBranchIdField.optional(),
    status: z.nativeEnum(CampaignStatus).optional(),
    startDate: optionalDateField,
    endDate: optionalDateField,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: VALIDATION_MESSAGES.UPDATE_EMPTY_BODY,
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.CAMPAIGN_END_BEFORE_START,
        path: ['endDate'],
      });
    }
  });

export type ListCampaignsQueryInput = z.infer<typeof listCampaignsQuerySchema>;
export type CampaignIdParamInput = z.infer<typeof campaignIdParamSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
