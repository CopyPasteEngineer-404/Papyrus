import { IWorker, WorkerInput, WorkerResult, WorkerError, WorkerWarning, OutputFormat, logger } from '@papyrus/shared';

export abstract class BaseWorker implements IWorker {
  abstract readonly format: OutputFormat;

  async execute(input: WorkerInput): Promise<WorkerResult> {
    const startTime = Date.now();
    const errors: WorkerError[] = [];
    const warnings: WorkerWarning[] = [];

    try {
      logger.info(`[${this.format}Worker] Starting execution`);
      const artifacts = await this.process(input, errors, warnings);
      const duration = Date.now() - startTime;

      logger.info(`[${this.format}Worker] Completed in ${duration}ms`);
      return {
        success: errors.length === 0,
        format: this.format,
        artifacts,
        errors,
        warnings,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[${this.format}Worker] Failed: ${error}`);

      errors.push({
        code: 'WORKER_FATAL',
        message: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        format: this.format,
        artifacts: [],
        errors,
        warnings,
        duration,
      };
    }
  }

  protected abstract process(
    input: WorkerInput,
    errors: WorkerError[],
    warnings: WorkerWarning[]
  ): Promise<import('@papyrus/shared').GeneratedArtifact[]>;
}
