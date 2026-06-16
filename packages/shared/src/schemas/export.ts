import { z } from 'zod';

export const ExportOpenSchema = z.object({
  outputPath: z.string().min(1, 'Export path is required'),
});
