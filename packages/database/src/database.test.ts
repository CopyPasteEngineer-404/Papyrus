import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabase, type SQLiteDatabase } from './adapter';
import { runMigrations, getSchemaVersion } from './migrations';
import { WorkspaceRepository } from './repositories/workspace';
import { FileRepository } from './repositories/file';
import { TraceRepository } from './repositories/trace';
import { ExportRepository } from './repositories/export';

let db: SQLiteDatabase;

beforeEach(async () => {
  db = await createDatabase();
  db.pragma('foreign_keys = ON');
});

afterEach(() => {
  db.close();
});

describe('Database Adapter', () => {
  it('creates an in-memory database', () => {
    expect(db).toBeDefined();
  });

  it('can execute basic SQL', () => {
    db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    db.prepare('INSERT INTO test (name) VALUES (?)').run('hello');
    const row = db.prepare('SELECT name FROM test WHERE id = 1').get() as Record<string, unknown>;
    expect(row?.name).toBe('hello');
  });

  it('handles prepared statements with parameters', () => {
    db.exec('CREATE TABLE nums (id INTEGER PRIMARY KEY, val INTEGER)');
    const stmt = db.prepare('INSERT INTO nums (val) VALUES (?)');
    stmt.run(10);
    stmt.run(20);
    stmt.run(30);
    const rows = db.prepare('SELECT val FROM nums ORDER BY val').all() as Record<string, unknown>[];
    expect(rows).toHaveLength(3);
    expect(rows[0].val).toBe(10);
    expect(rows[2].val).toBe(30);
  });

  it('handles empty query results', () => {
    db.exec('CREATE TABLE empty (id INTEGER)');
    const row = db.prepare('SELECT * FROM empty').get();
    expect(row).toBeUndefined();
    const rows = db.prepare('SELECT * FROM empty').all();
    expect(rows).toHaveLength(0);
  });
});

describe('Migrations', () => {
  it('starts at version 0 for fresh database', () => {
    expect(getSchemaVersion(db)).toBe(0);
  });

  it('runs all pending migrations', () => {
    runMigrations(db);
    expect(getSchemaVersion(db)).toBe(4);
  });

  it('is idempotent — running twice does not error', () => {
    runMigrations(db);
    runMigrations(db);
    expect(getSchemaVersion(db)).toBe(4);
  });

  it('creates expected tables after migration', () => {
    runMigrations(db);
    // Verify tables exist by querying them
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as Record<string, unknown>[];
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('workspaces');
    expect(tableNames).toContain('files');
    expect(tableNames).toContain('embeddings');
    expect(tableNames).toContain('traces');
    expect(tableNames).toContain('exports');
    expect(tableNames).toContain('_migrations');
  });

  it('creates expected indexes', () => {
    runMigrations(db);
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'").all() as Record<string, unknown>[];
    const indexNames = indexes.map(i => i.name);
    expect(indexNames).toContain('idx_files_workspace');
    expect(indexNames).toContain('idx_files_format');
    expect(indexNames).toContain('idx_embeddings_file');
    expect(indexNames).toContain('idx_traces_workspace');
    expect(indexNames).toContain('idx_exports_trace');
  });

  it('v3 adds name, size, modified_at columns to files', () => {
    runMigrations(db);
    // Create a workspace first for FK constraint
    const wsRepo = new WorkspaceRepository(db);
    const ws = wsRepo.create('/test', 'Test');
    // Insert a file with the new columns
    db.prepare(
      `INSERT INTO files (id, workspace_id, path, name, format, hash, size, modified_at, indexed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run('f1', ws.id, '/test/file.md', 'file.md', 'md', 'abc123', 1024, Date.now(), Date.now());

    const row = db.prepare('SELECT * FROM files WHERE id = ?').get('f1') as Record<string, unknown>;
    expect(row.name).toBe('file.md');
    expect(row.size).toBe(1024);
    expect(typeof row.modified_at).toBe('number');
  });
});

describe('WorkspaceRepository', () => {
  let wsRepo: WorkspaceRepository;

  beforeEach(() => {
    runMigrations(db);
    wsRepo = new WorkspaceRepository(db);
  });

  it('creates and retrieves a workspace', () => {
    const ws = wsRepo.create('/test/workspace', 'Test Workspace');
    expect(ws.id).toBeTruthy();
    expect(ws.path).toBe('/test/workspace');
    expect(ws.name).toBe('Test Workspace');

    const found = wsRepo.findByPath('/test/workspace');
    expect(found).toBeDefined();
    expect(found?.id).toBe(ws.id);
  });

  it('returns undefined for non-existent path', () => {
    expect(wsRepo.findByPath('/nonexistent')).toBeUndefined();
  });

  it('lists all workspaces sorted by last_opened', () => {
    wsRepo.create('/ws1', 'Workspace 1');
    wsRepo.create('/ws2', 'Workspace 2');
    const all = wsRepo.getAll();
    expect(all).toHaveLength(2);
    // Most recently created should be first (both have same last_opened)
    expect(all[0].path).toBeTruthy();
  });

  it('updates last_opened', () => {
    const ws = wsRepo.create('/ws', 'WS');
    const original = wsRepo.findByPath('/ws')?.last_opened;
    // Small delay to ensure different timestamp
    wsRepo.updateLastOpened(ws.id);
    const updated = wsRepo.findByPath('/ws')?.last_opened;
    expect(updated).toBeGreaterThanOrEqual(original!);
  });

  it('deletes workspace by id', () => {
    const ws = wsRepo.create('/ws', 'WS');
    wsRepo.deleteById(ws.id);
    expect(wsRepo.findByPath('/ws')).toBeUndefined();
  });
});

describe('FileRepository', () => {
  let wsRepo: WorkspaceRepository;
  let fileRepo: FileRepository;
  let wsId: string;

  beforeEach(() => {
    runMigrations(db);
    wsRepo = new WorkspaceRepository(db);
    fileRepo = new FileRepository(db);
    const ws = wsRepo.create('/test', 'Test');
    wsId = ws.id;
  });

  it('upserts and retrieves files', () => {
    fileRepo.upsert(wsId, '/test/file.md', 'md', 'hash1', 'file.md', 100, Date.now());
    const files = fileRepo.findByWorkspace(wsId);
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('file.md');
    expect(files[0].size).toBe(100);
  });

  it('upserts with same id updates existing row', () => {
    // Manually insert with explicit id to test ON CONFLICT behavior
    db.prepare(
      `INSERT INTO files (id, workspace_id, path, name, format, hash, size, modified_at, indexed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run('file-1', wsId, '/test/file.md', 'file.md', 'md', 'hash1', 100, Date.now(), Date.now());

    // Second insert with same id should update
    db.prepare(
      `INSERT INTO files (id, workspace_id, path, name, format, hash, size, modified_at, indexed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET hash = excluded.hash, size = excluded.size`
    ).run('file-1', wsId, '/test/file.md', 'file.md', 'md', 'hash2', 200, Date.now(), Date.now());

    const files = fileRepo.findByWorkspace(wsId);
    expect(files).toHaveLength(1);
    expect(files[0].hash).toBe('hash2');
    expect(files[0].size).toBe(200);
  });

  it('deletes file by path', () => {
    fileRepo.upsert(wsId, '/test/file.md', 'md', 'hash1');
    fileRepo.deleteByPath(wsId, '/test/file.md');
    expect(fileRepo.findByWorkspace(wsId)).toHaveLength(0);
  });

  it('deletes file by id', () => {
    fileRepo.upsert(wsId, '/test/file.md', 'md', 'hash1');
    const files = fileRepo.findByWorkspace(wsId);
    fileRepo.deleteById(files[0].id);
    expect(fileRepo.findByWorkspace(wsId)).toHaveLength(0);
  });

  it('finds file by id', () => {
    fileRepo.upsert(wsId, '/test/file.md', 'md', 'hash1');
    const files = fileRepo.findByWorkspace(wsId);
    const found = fileRepo.findById(files[0].id);
    expect(found).toBeDefined();
    expect(found?.path).toBe('/test/file.md');
  });

  it('returns undefined for non-existent id', () => {
    expect(fileRepo.findById('nonexistent')).toBeUndefined();
  });
});

describe('TraceRepository', () => {
  let wsRepo: WorkspaceRepository;
  let traceRepo: TraceRepository;
  let wsId: string;

  beforeEach(() => {
    runMigrations(db);
    wsRepo = new WorkspaceRepository(db);
    traceRepo = new TraceRepository(db);
    const ws = wsRepo.create('/test', 'Test');
    wsId = ws.id;
  });

  it('creates and retrieves traces', () => {
    const trace = traceRepo.create(wsId, JSON.stringify({ task: 'convert' }));
    expect(trace.id).toBeTruthy();
    expect(trace.workspace_id).toBe(wsId);

    const traces = traceRepo.findByWorkspace(wsId);
    expect(traces).toHaveLength(1);
  });

  it('returns empty array for workspace with no traces', () => {
    expect(traceRepo.findByWorkspace('nonexistent')).toHaveLength(0);
  });
});

describe('ExportRepository', () => {
  let wsRepo: WorkspaceRepository;
  let traceRepo: TraceRepository;
  let exportRepo: ExportRepository;
  let wsId: string;
  let traceId: string;

  beforeEach(() => {
    runMigrations(db);
    wsRepo = new WorkspaceRepository(db);
    traceRepo = new TraceRepository(db);
    exportRepo = new ExportRepository(db);
    const ws = wsRepo.create('/test', 'Test');
    wsId = ws.id;
    const trace = traceRepo.create(wsId, '{}');
    traceId = trace.id;
  });

  it('creates and retrieves exports', () => {
    const exp = exportRepo.create('exp1', traceId, 'html', '/output/file.html', 1024, '/source/file.md', 'md-worker', 500);
    expect(exp.id).toBeTruthy();
    expect(exp.format).toBe('html');

    const all = exportRepo.getRecent();
    expect(all).toHaveLength(1);
    expect(all[0].output_path).toBe('/output/file.html');
  });
});
