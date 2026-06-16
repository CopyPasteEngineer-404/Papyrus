import { IWorker, WorkerInput, WorkerResult, OutputFormat, logger } from '@papyrus/shared';
import { PDFWorker, MarkdownWorker, TxtWorker } from '@papyrus/workers';

/** Default timeout for a single worker execution (30 seconds) */
const WORKER_TIMEOUT_MS = 30_000;

/** Maximum number of workers running concurrently */
const MAX_CONCURRENCY = 2;

/**
 * Worker factory — creates a fresh worker instance for each execution.
 * Avoids singleton state issues where one worker's internal state leaks
 * into the next execution.
 */
function createWorker(format: OutputFormat): IWorker {
  switch (format) {
    case 'pdf': return new PDFWorker();
    case 'md': return new MarkdownWorker();
    case 'txt': return new TxtWorker();
    default:
      throw new Error(`No worker registered for format: ${format}. Supported formats: 'pdf', 'md', 'txt'.`);
  }
}

export function isFormatSupported(format: OutputFormat): boolean {
  return ['pdf', 'md', 'txt'].includes(format);
}

/** Simple concurrency limiter */
class ConcurrencyLimiter {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrency: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrency) {
      this.running++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) {
      this.running++;
      next();
    }
  }
}

export async function scheduleWorkers(
  input: WorkerInput,
  formats: OutputFormat[],
  onProgress?: (format: OutputFormat, result: WorkerResult) => void,
  timeoutMs: number = WORKER_TIMEOUT_MS
): Promise<Record<OutputFormat, WorkerResult>> {
  const results: Partial<Record<OutputFormat, WorkerResult>> = {};
  const limiter = new ConcurrencyLimiter(MAX_CONCURRENCY);

  const workerPromises = formats.map(async (format) => {
    await limiter.acquire();
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => { abortController.abort(); }, timeoutMs);

    try {
      const worker = createWorker(format);
      logger.info(`Scheduler: starting ${format} worker (timeout: ${timeoutMs}ms)`);

      const inputWithAbort = { ...input, signal: abortController.signal };
      const result = await worker.execute(inputWithAbort);
      clearTimeout(timeoutId);

      results[format] = result;
      if (onProgress) onProgress(format, result);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error(`Scheduler: ${format} worker failed: ${error}`);
      results[format] = {
        success: false,
        format,
        artifacts: [],
        errors: [{ code: 'SCHEDULER_ERROR', message: error instanceof Error ? error.message : String(error) }],
        warnings: [],
        duration: 0,
      };
      return results[format]!;
    } finally {
      limiter.release();
    }
  });

  await Promise.all(workerPromises);
  return results as Record<OutputFormat, WorkerResult>;
}
