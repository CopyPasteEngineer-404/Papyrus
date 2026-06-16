/**
 * Supported output formats.
 * Phase 1: PDF, Markdown, and Plain Text are supported.
 * Additional formats will be added in future phases.
 */
export type OutputFormat = 'pdf' | 'md' | 'txt' | 'html';

/**
 * Future output formats — NOT YET IMPLEMENTED.
 * These are listed here for type safety and forward compatibility.
 * Requesting these via the task system will throw in the scheduler.
 */
export type FutureOutputFormat = 'pptx' | 'docx' | 'xlsx' | 'csv' | 'latex';

/** All possible format strings (for reference only) */
export type AnyOutputFormat = OutputFormat | FutureOutputFormat;

/** A generated file artifact from a worker */
export interface GeneratedArtifact {
  filename: string;
  data: Uint8Array; // Uint8Array is isomorphic (works in both Node.js and browser)
  format: OutputFormat;
  size: number;
}

/** Worker error with structured code */
export interface WorkerError {
  code: string;
  message: string;
  details?: unknown;
}

/** Non-fatal worker warning */
export interface WorkerWarning {
  code: string;
  message: string;
}

/** Result returned by every worker after execution */
export interface WorkerResult {
  success: boolean;
  format: OutputFormat;
  artifacts: GeneratedArtifact[];
  errors: WorkerError[];
  warnings: WorkerWarning[];
  duration: number;
}

/** Input provided to every worker */
export interface WorkerInput {
  ir: import('./ir').IRDocument;
  constraints: import('./constraints').ConstraintSet;
  outputDir: string;
}

/** Base worker interface */
export interface IWorker {
  readonly format: OutputFormat;
  execute(input: WorkerInput): Promise<WorkerResult>;
}
