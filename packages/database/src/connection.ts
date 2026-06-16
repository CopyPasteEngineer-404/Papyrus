import path from 'path';
import fs from 'fs';
import { logger } from '@papyrus/shared';
import { createDatabase, SQLiteDatabaseAdapter, type SQLiteDatabase } from './adapter';

/** Auto-save interval in milliseconds */
const AUTO_SAVE_INTERVAL_MS = 30_000;

export class DatabaseConnection {
  private db: SQLiteDatabase;
  private dbPath: string;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private isDirty: boolean = false;
  private isSaving: boolean = false;

  private constructor(db: SQLiteDatabase, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  /** Async factory — sql.js needs to load WASM before creating a DB */
  static async create(workspacePath: string): Promise<DatabaseConnection> {
    const papyrusDir = path.join(workspacePath, '.papyrus');
    if (!fs.existsSync(papyrusDir)) {
      fs.mkdirSync(papyrusDir, { recursive: true });
    }

    const dbPath = path.join(papyrusDir, 'workspace.db');

    // Clean up any stale .tmp files from crashed saves
    const tmpPath = dbPath + '.tmp';
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
        logger.info('Cleaned up stale database temp file');
      } catch { /* ignore cleanup failure */ }
    }

    // If a saved DB exists, load it; otherwise create fresh
    // Wrap in try/catch to handle corrupted DB files gracefully
    let data: Uint8Array | null = null;
    if (fs.existsSync(dbPath)) {
      try {
        data = fs.readFileSync(dbPath);
      } catch (err) {
        logger.warn('Failed to read existing database, creating fresh:', err);
        data = null;
        try {
          const backupPath = dbPath + '.corrupted.' + Date.now();
          fs.renameSync(dbPath, backupPath);
          logger.info(`Corrupted DB backed up to ${backupPath}`);
        } catch { /* ignore backup failure */ }
      }
    }

    const db = await createDatabase(data);

    // Enable foreign keys (WAL mode is a no-op for in-memory sql.js but harmless)
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    logger.info(`Database opened: ${dbPath}`);
    const conn = new DatabaseConnection(db, dbPath);
    conn.startAutoSave();
    return conn;
  }

  getDb(): SQLiteDatabase {
    return this.db;
  }

  getDbPath(): string {
    return this.dbPath;
  }

  /** Mark database as having unsaved changes */
  markDirty(): void {
    this.isDirty = true;
  }

  /** Save the in-memory DB to disk (guarded against concurrent saves) */
  saveToDisk(): void {
    if (this.isSaving) return; // Prevent overlapping saves
    this.isSaving = true;

    try {
      // Use the proper export method from the adapter
      if (this.db instanceof SQLiteDatabaseAdapter) {
        const data = this.db.export();
        // Write to temp file first, then atomically rename to prevent corruption
        const tmpPath = this.dbPath + '.tmp';
        fs.writeFileSync(tmpPath, data);
        fs.renameSync(tmpPath, this.dbPath);
        this.isDirty = false;
        logger.info(`Database saved to disk: ${this.dbPath}`);
      }
    } catch (err) {
      logger.error('Failed to save database to disk:', err);
      // Clean up temp file if it exists
      try { fs.unlinkSync(this.dbPath + '.tmp'); } catch { /* ignore */ }
    } finally {
      this.isSaving = false;
    }
  }

  /** Start auto-saving every 30 seconds */
  private startAutoSave(): void {
    if (this.autoSaveTimer) return;

    const timer = setInterval(() => {
      if (this.isDirty) {
        this.saveToDisk();
      }
    }, AUTO_SAVE_INTERVAL_MS);
    // Unref the timer so it doesn't prevent the process from exiting
    if (timer.unref) timer.unref();
    this.autoSaveTimer = timer;
  }

  /** Stop the auto-save timer */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /** Save and close the database */
  close(): void {
    this.stopAutoSave();
    try {
      // Always save on close, even if not marked dirty (safety net)
      this.saveToDisk();
    } finally {
      this.db.close();
      logger.info('Database closed');
    }
  }
}
