import type { SQLiteDatabase } from '../adapter.js';
import { generateId } from '@papyrus/shared';

export interface TraceRow {
  id: string;
  workspace_id: string;
  task_data: string;
  created_at: number;
}

export class TraceRepository {
  constructor(private db: SQLiteDatabase) {}

  create(workspaceId: string, taskData: string): TraceRow {
    const id = generateId();
    const now = Date.now();
    this.db.prepare(
      'INSERT INTO traces (id, workspace_id, task_data, created_at) VALUES (?, ?, ?, ?)'
    ).run(id, workspaceId, taskData, now);
    return { id, workspace_id: workspaceId, task_data: taskData, created_at: now };
  }

  findByWorkspace(workspaceId: string): TraceRow[] {
    return this.db.prepare('SELECT * FROM traces WHERE workspace_id = ? ORDER BY created_at DESC').all(workspaceId) as unknown as TraceRow[];
  }
}
