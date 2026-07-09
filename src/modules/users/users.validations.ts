import { z } from 'zod';

export const placeholderSchema = z.object({});

export type PlaceholderInput = z.infer<typeof placeholderSchema>;
