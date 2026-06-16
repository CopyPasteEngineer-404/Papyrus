/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/** Shared workspace file entry returned by most workspace operations */
interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  format: string;
  size: number;
  modifiedAt: number;
}

/** Workspace result from open/new/import operations */
interface WorkspaceResult {
  path: string;
  name: string;
  files: WorkspaceFile[];
}

/** Search result entry */
interface SearchResult {
  fileId: string;
  fileName: string;
  filePath: string;
  format: string;
  size: number;
  modifiedAt: number;
  score: number;
  snippet: string;
}

/** Task status union */
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Export record from database */
interface ExportRecord {
  id: string;
  traceId: string;
  format: string;
  outputPath: string;
  createdAt: number;
  fileSize: number;
}

/** Smoke test result */
interface SmokeTestResult {
  passed: boolean;
  results: Array<{ name: string; status: 'pass' | 'fail'; message: string }>;
}

/** Main-to-renderer event channel names */
type MainToRendererChannel =
  | 'task:progress'
  | 'task:completed'
  | 'task:failed'
  | 'task:cancelled'
  | 'export:created'
  | 'workspace:indexed'
  | 'workspace:indexing'
  | 'workspace:deleted'
  | 'file:changed';

/** Callback payload types for each main-to-renderer channel */
interface MainToRendererPayloads {
  'task:progress': {
    taskId: string;
    totalWorkers: number;
    completedWorkers: number;
    currentPhase: string;
    percentComplete: number;
    workerStatuses: Array<{ format: string; status: string; duration?: number; error?: string }>;
  };
  'task:completed': { task: any };
  'task:failed': { task: any; error?: string };
  'task:cancelled': { taskId: string; status: string; error?: string };
  'export:created': any;
  'workspace:indexed': { workspace: string; files: WorkspaceFile[] };
  'workspace:indexing': any;
  'workspace:deleted': { path: string };
  'file:changed': { type: 'add' | 'change' | 'unlink'; path: string };
}

/** App settings shape */
interface AppSettings {
  aiProvider: 'ollama' | 'openai' | 'none';
  theme: 'light' | 'dark' | 'system';
  themeSkin: 'papyrus' | 'halftone' | 'isometric' | 'minimalart' | 'threejs';
  defaultConstraints?: {
    pdf?: any;
    md?: any;
    txt?: any;
  };
  recentWorkspaces: Array<{
    path: string;
    name: string;
    lastOpened: number;
  }>;
}

/** HTML conversion options for convertFile */
interface HtmlConversionOptions {
  darkMode?: boolean;
  textColor?: string;
  headingColor?: string;
  bgColor?: string;
  fontSize?: number;
  includeMermaid?: boolean;
}

/** Convert file result */
interface ConvertFileResult {
  success: boolean;
  outputPath: string;
  targetFormat: string;
  fileSize: number;
  duration: number;
  error?: string;
}

declare global {
  interface Window {
    papyrus?: {
      /* ── Workspace ── */
      openWorkspace: (path: string) => Promise<WorkspaceResult>;
      closeWorkspace: () => Promise<void>;
      deleteWorkspace: (path: string) => Promise<{ success: boolean; path: string }>;
      reindexWorkspace: () => Promise<WorkspaceResult>;
      getWorkspaceInfo: () => Promise<Array<{ path: string; name: string }>>;
      getRecentWorkspaces: () => Promise<Array<{ path: string; name: string; lastOpened: number }>>;
      removeRecentWorkspace: (path: string) => Promise<boolean>;
      newWorkspace: () => Promise<WorkspaceResult>;
      openSampleWorkspace: () => Promise<WorkspaceResult>;

      /* ── Import ── */
      importFiles: () => Promise<Array<{ name: string; path: string; success: boolean; error?: string }>>;
      importFolder: () => Promise<Array<{ name: string; path: string; success: boolean; error?: string }>>;

      /* ── Search ── */
      search: (query: string, filters?: { formats?: string[]; modifiedAfter?: number }) => Promise<SearchResult[]>;

      /* ── Tasks ── */
      createTask: (
        sourceFiles: string[],
        outputFormats: Array<'pdf' | 'md' | 'txt'>,
        constraints: {
          pdf?: {
            paperSize?: 'A4' | 'Letter' | 'Legal';
            margin?: string;
            citationStyle?: 'IEEE' | 'APA' | 'MLA' | 'none';
            fontSize?: number;
            lineHeight?: number;
            headerTemplate?: string;
            footerTemplate?: string;
            includeToc?: boolean;
            darkMode?: boolean;
          };
          md?: {
            flavor?: 'gfm' | 'commonmark';
            includeFrontmatter?: boolean;
            diagramFormat?: 'mermaid' | 'link';
          };
          txt?: {
            lineWrap?: number;
            preserveFormatting?: boolean;
          };
        }
      ) => Promise<any>;
      cancelTask: (taskId: string) => Promise<void>;
      getTaskHistory: () => Promise<any[]>;

      /* ── Convert ── */
      convertFile: (
        sourceFilePath: string,
        targetFormat: string,
        htmlOptions?: HtmlConversionOptions
      ) => Promise<ConvertFileResult>;

      convertBatch: (
        files: Array<{ sourceFilePath: string; targetFormat: string }>,
        htmlOptions?: HtmlConversionOptions,
        taskId?: string
      ) => Promise<{
        total: number;
        succeeded: number;
        failed: number;
        results: Array<{ sourceFilePath: string; result: ConvertFileResult }>;
      }>;

      /* ── Exports ── */
      getExports: () => Promise<ExportRecord[]>;
      openExport: (path: string) => Promise<void>;
      showExportInFolder: (path: string) => Promise<void>;

      /* ── File Content ── */
      readFileContent: (filePath: string) => Promise<string>;
      writeFileContent: (filePath: string, content: string) => Promise<void>;

      /* ── Settings ── */
      getSettings: () => Promise<AppSettings>;
      updateSettings: (settings: Partial<Omit<AppSettings, 'recentWorkspaces'>>) => Promise<void>;

      /* ── IPC Events ── */
      on: <T extends MainToRendererChannel>(
        channel: T,
        callback: (data: MainToRendererPayloads[T]) => void
      ) => void;
      removeListener: <T extends MainToRendererChannel>(
        channel: T,
        callback: (data: MainToRendererPayloads[T]) => void
      ) => void;

      /* ── File Watcher ── */
      onFileChanged: (callback: (event: { type: 'add' | 'change' | 'unlink'; path: string }) => void) => () => void;

      /* ── Window Controls ── */
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;

      /* ── Key-Value Settings ── */
      getStoredSetting: (key: string) => Promise<any>;
      setStoredSetting: (key: string, value: any) => Promise<void>;

      /* ── Diagnostics ── */
      runSmokeTest: () => Promise<SmokeTestResult>;

      /* ── Crash Logs & App Info ── */
      getCrashLogs: () => Promise<Array<{
        name: string;
        path: string;
        size: number;
        createdAt: number;
      }>>;
      getAppInfo: () => Promise<{
        version: string;
        platform: string;
        arch: string;
        electron: string;
        chrome: string;
        node: string;
      }>;
    };
  }
}
