import { z } from 'zod';

export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.object({
    formats: z.array(z.string()).optional(),
    modifiedAfter: z.number().optional(),
  }).optional(),
});
