import type { SQLiteDatabase } from '../adapter.js';
import { generateId } from '@papyrus/shared';

export interface WorkspaceRow {
  id: string;
  path: string;
  name: string;
  created_at: number;
  last_opened: number;
}

export class WorkspaceRepository {
  constructor(private db: SQLiteDatabase) {}

  create(path: string, name: string): WorkspaceRow {
    const id = generateId();
    const now = Date.now();
    this.db.prepare(
      'INSERT INTO workspaces (id, path, name, created_at, last_opened) VALUES (?, ?, ?, ?, ?)'
    ).run(id, path, name, now, now);
    return { id, path, name, created_at: now, last_opened: now };
  }

  findByPath(path: string): WorkspaceRow | undefined {
    return this.db.prepare('SELECT * FROM workspaces WHERE path = ?').get(path) as unknown as WorkspaceRow | undefined;
  }

  getAll(): WorkspaceRow[] {
    return this.db.prepare('SELECT * FROM workspaces ORDER BY last_opened DESC').all() as unknown as WorkspaceRow[];
  }

  updateLastOpened(id: string): void {
    this.db.prepare('UPDATE workspaces SET last_opened = ? WHERE id = ?').run(Date.now(), id);
  }

  deleteById(id: string): void {
    this.db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
  }
}
