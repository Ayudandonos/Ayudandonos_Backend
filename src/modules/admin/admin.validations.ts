import { z } from 'zod';
import { CampaignStatus } from '@prisma/client';

export const adminDashboardQuerySchema = z.object({
  latestNeedsLimit: z.coerce.number().int().min(1).max(50).default(10),
  featuredCampaignsLimit: z.coerce.number().int().min(1).max(10).default(3),
});

export const adminCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).max(120).optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
});

export type AdminDashboardQueryInput = z.infer<typeof adminDashboardQuerySchema>;
export type AdminCampaignsQueryInput = z.infer<typeof adminCampaignsQuerySchema>;
