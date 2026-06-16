/**
 * ConverterWorkerPool
 *
 * Manages a single worker thread for running file conversions off the main
 * Electron process thread. Re-spawns the worker if it crashes.
 *
 * Usage:
 *   const pool = new ConverterWorkerPool();
 *   const result = await pool.convert(sourcePath, sourceFormat, targetFormat, outputDir, htmlOptions);
 *   pool.terminate(); // on app quit
 */

import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';
import { logger } from '@papyrus/shared';
import type { SourceFormat, TargetFormat, HtmlConversionOptions, ConversionResult } from './converter';

interface PendingRequest {
  resolve: (result: ConversionResult) => void;
  reject: (error: Error) => void;
}

interface QueuedItem {
  resolve: (result: ConversionResult) => void;
  reject: (error: Error) => void;
  args: { id: string; sourcePath: string; sourceFormat: SourceFormat; targetFormat: TargetFormat; outputDir: string; htmlOptions?: HtmlConversionOptions; _dispatched?: boolean };
}

interface WorkerSlot {
  worker: Worker;
  busy: boolean;
  respawnScheduled: boolean;
  crashCount: number;
}

function getWorkerScriptPath(): string {
  // Vite bundles electron main into a single JS file, so __dirname is dist/electron/.
  // In dev, the worker source is at packages/workers/src/converter-thread.ts.
  // In prod (electron-builder), it should be at dist/converter-thread.js.
  const candidates = [
    path.join(__dirname, 'converter-thread.js'),
    path.join(__dirname, 'converter-thread.ts'),
    // Dev: __dirname may be dist/electron, worker source is in packages/workers/src
    path.join(__dirname, '..', '..', '..', 'packages', 'workers', 'src', 'converter-thread.ts'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      logger.info(`Using worker script: ${p}`);
      return p;
    }
  }
  // Last resort: return the .js path and let it fail with a clear error
  const fallback = path.join(__dirname, 'converter-thread.js');
  logger.warn(`Worker script not found in any candidate path, falling back to: ${fallback}`);
  return fallback;
}

/**
 * Worker pool for running file conversions off the main Electron thread.
 *
 * Spawns min(4, cpuCount) worker threads and distributes conversions across them.
 * Auto-respawns crashed workers. Queue-based: when all workers are busy, requests
 * are queued and dispatched as workers become available.
 */
export class ConverterWorkerPool {
  private workers: WorkerSlot[] = [];
  private queue: QueuedItem[] = [];
  private isShuttingDown = false;
  private workerScriptPath: string;

  constructor() {
    this.workerScriptPath = getWorkerScriptPath();
    // Scale: 1 worker per 2 CPU cores, min 1, max 2
    const cpuCount = os.cpus().length;
    const poolSize = Math.max(1, Math.min(2, Math.ceil(cpuCount / 2)));
    logger.info(`Spawning ${poolSize} converter worker(s) (${cpuCount} CPUs detected)`);
    for (let i = 0; i < poolSize; i++) {
      this.spawnWorker();
    }
  }

  private spawnWorker(): void {
    if (this.isShuttingDown) return;

    const worker = new Worker(this.workerScriptPath);

    const slot: WorkerSlot = { worker, busy: false, respawnScheduled: false, crashCount: 0 };
    this.workers.push(slot);

    worker.on('message', (msg: { id: string; result: ConversionResult }) => {
      slot.busy = false;
      slot.crashCount = 0; // Reset on successful message

      // Find the pending request by matching the id
      const idx = this.queue.findIndex(r => r.args.id === msg.id);
      if (idx !== -1) {
        const request = this.queue[idx];
        this.queue.splice(idx, 1);
        request.resolve(msg.result);
      }

      // Process next queued item if any
      this.dispatchNext();
    });

    const handleCrash = (error: Error | null, code: number | null) => {
      const reason = error ? error.message : `exit code ${code}`;
      logger.error(`Converter worker crashed: ${reason}`);
      slot.busy = false;
      slot.crashCount++;

      // Reject all pending requests
      for (const r of this.queue) {
        r.reject(new Error(`Worker crashed: ${reason}`));
      }
      this.queue = [];

      // Remove the dead worker
      this.workers = this.workers.filter(w => w.worker !== worker);

      // Stop respawning after 3 consecutive crashes (likely a systemic issue)
      if (slot.crashCount >= 3) {
        logger.error(`Worker crashed ${slot.crashCount} times consecutively, not respawning`);
        return;
      }

      // Prevent double-respawn (both error + exit fire on crash)
      if (!this.isShuttingDown && !slot.respawnScheduled) {
        slot.respawnScheduled = true;
        setTimeout(() => this.spawnWorker(), 2000);
      }
    };

    worker.on('error', (error) => handleCrash(error, null));
    worker.on('exit', (code) => handleCrash(null, code));
  }

  private dispatchNext(): void {
    if (this.queue.length === 0) return;
    const idle = this.workers.find(w => !w.busy);
    if (!idle) return;

    const next = this.queue.find(r => !r.args._dispatched);
    if (!next) return;

    next.args._dispatched = true;
    idle.busy = true;
    idle.worker.postMessage(next.args);
  }

  /**
   * Run a conversion on a worker thread.
   * Returns a promise that resolves when the conversion completes.
   */
  convert(
    sourcePath: string,
    sourceFormat: SourceFormat,
    targetFormat: TargetFormat,
    outputDir: string,
    htmlOptions?: HtmlConversionOptions,
  ): Promise<ConversionResult> {
    if (this.isShuttingDown || this.workers.length === 0) {
      return Promise.reject(new Error('Worker pool is not available'));
    }

    const id = crypto.randomUUID();
    const args = {
      id,
      sourcePath,
      sourceFormat,
      targetFormat,
      outputDir,
      htmlOptions,
    };

    return new Promise<ConversionResult>((resolve, reject) => {
      this.queue.push({ resolve, reject, args });

      // Try to dispatch immediately if a worker is idle
      const idle = this.workers.find(w => !w.busy);
      if (idle) {
        this.dispatchNext();
      }
    });
  }

  /** Terminate all workers (call on app quit) */
  terminate(): void {
    this.isShuttingDown = true;
    for (const r of this.queue) {
      r.reject(new Error('Worker pool terminated'));
    }
    this.queue = [];
    for (const slot of this.workers) {
      try { slot.worker.terminate(); } catch { /* ignore */ }
    }
    this.workers = [];
  }
}
