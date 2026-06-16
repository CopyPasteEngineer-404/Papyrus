import { OutputFormat } from './worker';

export interface ExportRecord {
  id: string;
  traceId: string;
  format: OutputFormat;
  outputPath: string;
  createdAt: number;
  fileSize: number;
}

export interface ExportManifest {
  taskId: string;
  exports: ExportRecord[];
  createdAt: number;
  totalSize: number;
}
