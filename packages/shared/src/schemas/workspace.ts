import { z } from 'zod';

/**
 * Workspace open schema — validates the payload for workspace:open IPC.
 * An empty path string signals "show folder picker dialog" to the main process.
 */
export const WorkspaceOpenSchema = z.object({
  path: z.string(),  // Empty string = show dialog, non-empty = direct path
});

export const WorkspaceCloseSchema = z.object({});
