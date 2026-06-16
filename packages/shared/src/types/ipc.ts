import { ConstraintSet } from './constraints';
import { OutputFormat } from './worker';

export type RendererToMainChannels =
  | 'workspace:open'
  | 'workspace:close'
  | 'workspace:delete'
  | 'workspace:reindex'
  | 'workspace:getInfo'
  | 'workspace:getRecent'
  | 'workspace:removeRecent'
  | 'workspace:new'
  | 'workspace:importFiles'
  | 'workspace:importFolder'
  | 'workspace:openSample'
  | 'search:query'
  | 'task:create'
  | 'task:cancel'
  | 'task:getHistory'
  | 'convert:file'
  | 'export:open'
  | 'export:getAll'
  | 'export:showInFolder'
  | 'file:readContent'
  | 'file:writeContent'
  | 'settings:get'
  | 'settings:update'
  | 'settings:getKey'
  | 'settings:setKey'
  | 'diagnostics:smokeTest'
  | 'window:minimize'
  | 'window:maximize'
  | 'window:close';

export type MainToRendererChannels =
  | 'task:progress'
  | 'task:completed'
  | 'task:failed'
  | 'task:cancelled'
  | 'export:created'
  | 'workspace:indexed'
  | 'workspace:indexing'
  | 'workspace:deleted'
  | 'file:changed';

export interface WorkspaceOpenPayload {
  path: string;
}

export interface SearchQueryPayload {
  query: string;
  filters?: {
    formats?: string[];
    modifiedAfter?: number;
  };
}

export interface SearchResult {
  fileId: string;
  fileName: string;
  filePath: string;
  format: string;
  size: number;
  modifiedAt: number;
  score: number;
  snippet: string;
}

export interface TaskCreatePayload {
  sourceFiles: string[];
  outputFormats: OutputFormat[];
  constraints: ConstraintSet;
}

export interface ConvertFilePayload {
  sourceFilePath: string;
  targetFormat: string;
}

export interface SettingsPayload {
  aiProvider: 'ollama' | 'openai' | 'none';
  theme: 'light' | 'dark' | 'system';
  themeSkin: 'papyrus' | 'halftone' | 'isometric' | 'minimalart';
  defaultConstraints?: ConstraintSet;
  recentWorkspaces: Array<{ path: string; name: string; lastOpened: number }>;
}
