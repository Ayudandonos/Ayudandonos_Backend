import { z } from 'zod';

export const adminDashboardQuerySchema = z.object({
  latestNeedsLimit: z.coerce.number().int().min(1).max(50).default(10),
  featuredCampaignsLimit: z.coerce.number().int().min(1).max(10).default(3),
});

export type AdminDashboardQueryInput = z.infer<typeof adminDashboardQuerySchema>;
