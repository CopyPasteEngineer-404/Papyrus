/**
 * SQLiteDatabase — Thin adapter wrapping sql.js (WASM-based SQLite)
 * to provide a better-sqlite3-compatible API.
 *
 * Why sql.js?
 * - Pure WASM, no native compilation needed (no Visual Studio Build Tools on Windows)
 * - Works on any OS/Node version without prebuilt binaries
 * - Identical SQL semantics to native SQLite
 */

import type initSqlJs from 'sql.js';

/* ── Public types ── */

export interface DatabaseStatement {
  run(...params: unknown[]): DatabaseStatement;
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
}

export interface SQLiteDatabase {
  prepare(sql: string): DatabaseStatement;
  exec(sql: string): void;
  pragma(pragma: string): void;
  close(): void;
  getRowsModified(): number;
}

/* ── Implementation ── */

class SqlJsStatementAdapter implements DatabaseStatement {
  private stmt: initSqlJs.Statement;
  private columnNames: string[];

  constructor(stmt: initSqlJs.Statement) {
    this.stmt = stmt;
    this.columnNames = stmt.getColumnNames();
  }

  private rowToObject(row: unknown[]): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < this.columnNames.length; i++) {
      obj[this.columnNames[i]] = row[i];
    }
    return obj;
  }

  run(...params: unknown[]): DatabaseStatement {
    this.stmt.run(params as initSqlJs.SqlValue[]);
    return this;
  }

  get(...params: unknown[]): Record<string, unknown> | undefined {
    if (params.length > 0) {
      this.stmt.bind(params as initSqlJs.SqlValue[]);
    }
    const hasRow = this.stmt.step();
    if (!hasRow) {
      this.stmt.reset();
      return undefined;
    }
    const row = this.stmt.get();
    this.stmt.reset();
    if (!row) return undefined;
    return this.rowToObject(row);
  }

  all(...params: unknown[]): Record<string, unknown>[] {
    if (params.length > 0) {
      this.stmt.bind(params as initSqlJs.SqlValue[]);
    }
    const results: Record<string, unknown>[] = [];
    while (this.stmt.step()) {
      const row = this.stmt.get();
      if (row) {
        results.push(this.rowToObject(row));
      }
    }
    this.stmt.reset();
    return results;
  }
}

export class SQLiteDatabaseAdapter implements SQLiteDatabase {
  private db: initSqlJs.Database;

  constructor(db: initSqlJs.Database) {
    this.db = db;
  }

  prepare(sql: string): DatabaseStatement {
    const stmt = this.db.prepare(sql);
    return new SqlJsStatementAdapter(stmt);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  private static ALLOWED_PRAGMAS = new Set([
    'journal_mode = WAL',
    'foreign_keys = ON',
  ]);

  pragma(pragma: string): void {
    if (!SQLiteDatabaseAdapter.ALLOWED_PRAGMAS.has(pragma)) {
      throw new Error(`Disallowed PRAGMA: ${pragma}`);
    }
    this.db.exec(`PRAGMA ${pragma}`);
  }

  close(): void {
    this.db.close();
  }

  getRowsModified(): number {
    return this.db.getRowsModified();
  }

  /** Export the database as a Uint8Array for saving to disk */
  export(): Uint8Array {
    return this.db.export();
  }
}

/* ── Factory ── */

let sqlJsModule: any = null;

/**
 * Safely resolve a path from node_modules using createRequire (ESM-safe).
 * Falls back to CDN if resolution fails.
 *
 * In packaged Electron apps (app.isPackaged), resolves relative to
 * process.resourcesPath to handle ASAR unpacking correctly.
 */
function locateWasmFile(file: string): string {
  // In packaged Electron app, WASM should be in resources
  try {
    const electron = require('electron');
    if (electron?.app?.isPackaged) {
      const resourcePath = require('path').join((process as any).resourcesPath, file);
      const fs = require('fs');
      if (fs.existsSync(resourcePath)) {
        return resourcePath;
      }
    }
  } catch {
    // Not running in Electron or electron not available
  }

  try {
    // ESM-safe: createRequire gives us require.resolve in module scope
    const { createRequire } = require('node:module') as typeof import('node:module');
    const nodeRequire = createRequire(import.meta.url ?? `file://${__filename}`);
    const resolved = nodeRequire.resolve(`sql.js/dist/${file}`);
    return resolved;
  } catch {
    // CJS fallback: try global require.resolve
    try {
      const resolved = require.resolve(`sql.js/dist/${file}`);
      return resolved;
    } catch {
      // Last resort: CDN (requires internet)
      return `https://sql.js.org/dist/${file}`;
    }
  }
}

/**
 * Load sql.js using createRequire() for CJS-safe loading.
 *
 * Problem: sql.js is a CommonJS module that expects `module.exports` to exist.
 * When Vite bundles the Electron main process as ESM, `module` is undefined,
 * causing: "TypeError: Cannot set properties of undefined (setting 'exports')"
 *
 * Solution: Use createRequire() from 'node:module' to create a CJS-compatible
 * require() function in ESM context. This ensures sql.js can set module.exports.
 *
 * Fallback chain: createRequire() → direct require() → dynamic import with shim
 */
async function loadSqlJs(): Promise<any> {
  // Attempt 1: createRequire() — the proper ESM→CJS bridge
  try {
    const { createRequire } = require('node:module') as typeof import('node:module');
    const nodeRequire = createRequire(import.meta.url ?? `file://${__filename}`);
    const sqlJs = nodeRequire('sql.js');
    // sql.js default export is the initSqlJs function
    const init = (sqlJs as any).default || sqlJs;
    if (typeof init === 'function') {
      return init;
    }
  } catch (err) {
    // createRequire failed, try next method
  }

  // Attempt 2: Direct require() (works in CJS-bundled contexts)
  try {
    const sqlJs = require('sql.js');
    const init = (sqlJs as any).default || sqlJs;
    if (typeof init === 'function') {
      return init;
    }
  } catch (err) {
    // Direct require failed, try next method
  }

  // Attempt 3 removed — the globalThis shim approach was a race-condition risk.
  // Attempts 1 and 2 (createRequire + direct require) cover the vast majority
  // of environments. If both fail, the user needs to fix their sql.js install.

  throw new Error(
    'Failed to load sql.js. All loading methods (createRequire, require, dynamic import) failed. ' +
    'Ensure sql.js is installed: npm install sql.js'
  );
}

export async function createDatabase(data?: ArrayLike<number> | Buffer | null): Promise<SQLiteDatabase> {
  // Lazy-load sql.js only when needed
  if (!sqlJsModule) {
    const initSqlJsFn = await loadSqlJs();
    sqlJsModule = await initSqlJsFn({
      locateFile: locateWasmFile,
    });
  }

  if (!sqlJsModule) {
    throw new Error('sql.js module failed to initialize');
  }

  const db = new sqlJsModule.Database(data ?? null);
  return new SQLiteDatabaseAdapter(db);
}
