import type { SQLiteDatabase } from '../adapter.js';
import { generateId, logger } from '@papyrus/shared';

export interface EmbeddingRow {
  id: string;
  file_id: string;
  chunk: string;
  vector: Buffer;
  created_at: number;
}

/**
 * EmbeddingRepository — Phase 1 placeholder.
 *
 * The table schema exists in migrations for future use,
 * but vector search is NOT implemented in Phase 1.
 * Only basic CRUD operations are available.
 */
export class EmbeddingRepository {
  constructor(private db: SQLiteDatabase) {}

  create(fileId: string, chunk: string, vector: Float32Array): void {
    this.db.prepare(
      'INSERT INTO embeddings (id, file_id, chunk, vector, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(generateId(), fileId, chunk, Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength), Date.now());
  }

  /**
   * Vector search is NOT available in Phase 1.
   * Use keyword search (FileRepository) instead.
   */
  search(_queryVector: Float32Array, _limit: number, _threshold: number): EmbeddingRow[] {
    logger.warn('Embedding search is not available in Phase 1. Use keyword search instead.');
    return [];
  }
}
