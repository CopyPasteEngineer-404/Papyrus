import type { SQLiteDatabase } from '../adapter.js';
import { generateId } from '@papyrus/shared';

export interface ExportRow {
  id: string;
  trace_id: string;
  format: string;
  output_path: string;
  created_at: number;
  file_size: number;
  source_path: string;
  worker_name: string;
  duration_ms: number;
}

export class ExportRepository {
  constructor(private db: SQLiteDatabase) {}

  create(
    id: string,
    traceId: string,
    format: string,
    outputPath: string,
    fileSize: number,
    sourcePath: string = '',
    workerName: string = '',
    durationMs: number = 0,
  ): ExportRow {
    const now = Date.now();
    this.db.prepare(
      'INSERT INTO exports (id, trace_id, format, output_path, created_at, file_size, source_path, worker_name, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, traceId, format, outputPath, now, fileSize, sourcePath, workerName, durationMs);
    return { id, trace_id: traceId, format, output_path: outputPath, created_at: now, file_size: fileSize, source_path: sourcePath, worker_name: workerName, duration_ms: durationMs };
  }

  getRecent(limit = 50): ExportRow[] {
    return this.db.prepare('SELECT * FROM exports ORDER BY created_at DESC LIMIT ?').all(limit) as unknown as ExportRow[];
  }

  deleteByTraceId(traceId: string): void {
    this.db.prepare('DELETE FROM exports WHERE trace_id = ?').run(traceId);
  }
}
