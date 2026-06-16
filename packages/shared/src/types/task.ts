import { OutputFormat, WorkerResult } from './worker';
import { ConstraintSet } from './constraints';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TransformationTask {
  id: string;
  sourceFiles: string[];
  outputFormats: OutputFormat[];
  constraints: ConstraintSet;
  status: TaskStatus;
  results: Partial<Record<OutputFormat, WorkerResult>>;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface TaskProgress {
  taskId: string;
  totalWorkers: number;
  completedWorkers: number;
  currentPhase: 'parsing' | 'ir-building' | 'worker-execution' | 'exporting' | 'completed';
  percentComplete: number;
  workerStatuses: WorkerStatusEntry[];
}

export interface WorkerStatusEntry {
  format: OutputFormat;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}
