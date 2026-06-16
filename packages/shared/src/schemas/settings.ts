import { z } from 'zod';
import { ConstraintSetSchema } from './task';

export const SettingsUpdateSchema = z.object({
  aiProvider: z.enum(['ollama', 'openai', 'none']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  themeSkin: z.enum(['papyrus', 'halftone', 'isometric', 'minimalart']).optional(),
  defaultConstraints: ConstraintSetSchema.optional(),
});
