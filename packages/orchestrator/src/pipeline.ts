import {
  TransformationTask,
  TaskProgress,
  WorkerStatusEntry,
  OutputFormat,
  ConstraintSet,
  WorkerInput,
  IRDocument,
  generateId,
  logger,
  DEFAULT_CONSTRAINT_SET,
} from '@papyrus/shared';
import { parseFile, detectFormat } from '@papyrus/parsers';
import { validateIR } from '@papyrus/ir';
import { scheduleWorkers } from './scheduler';
import fs from 'fs';
import path from 'path';

export type PipelineEventType = 'progress' | 'completed' | 'failed' | 'worker-done';
export type PipelineListener = (event: PipelineEventType, data: any) => void;

/** Execute the full transformation pipeline */
export async function executePipeline(
  sourceFiles: string[],
  outputFormats: OutputFormat[],
  constraints: ConstraintSet,
  outputDir: string,
  listener?: PipelineListener
): Promise<TransformationTask> {
  const taskId = generateId();
  const startTime = Date.now();
  const mergedConstraints: ConstraintSet = {
    pdf: { ...DEFAULT_CONSTRAINT_SET.pdf, ...constraints.pdf },
    md: { ...DEFAULT_CONSTRAINT_SET.md, ...constraints.md },
    txt: { ...DEFAULT_CONSTRAINT_SET.txt, ...constraints.txt },
  };

  const task: TransformationTask = {
    id: taskId,
    sourceFiles,
    outputFormats,
    constraints: mergedConstraints,
    status: 'running',
    results: {},
    createdAt: startTime,
  };

  try {
    // Phase 1: Parsing
    listener?.('progress', { taskId, phase: 'parsing' });
    logger.info(`Pipeline [${taskId}]: Parsing ${sourceFiles.length} files`);

    const irDocuments: IRDocument[] = [];
    for (const filePath of sourceFiles) {
      const format = detectFormat(filePath);
      if (!format) {
        throw new Error(`Unsupported file format: ${filePath}`);
      }

      const content = await fs.promises.readFile(filePath, 'utf-8');
      const ir = await parseFile(filePath, content);
      irDocuments.push(ir);
    }

    // Merge multiple IR documents into one
    const mergedIR = mergeIRDocuments(irDocuments);

    // Phase 2: IR Validation
    listener?.('progress', { taskId, phase: 'ir-building' });
    logger.info(`Pipeline [${taskId}]: Validating IR`);

    const validation = validateIR(mergedIR);
    if (!validation.valid) {
      const errorMessages = validation.errors.map(e => `${e.path}: ${e.message}`).join('; ');
      throw new Error(`IR validation failed: ${errorMessages}`);
    }
    if (validation.warnings.length > 0) {
      logger.warn(`Pipeline [${taskId}]: IR validation warnings: ${validation.warnings.length}`);
    }

    // Phase 3: Worker Execution
    listener?.('progress', { taskId, phase: 'worker-execution' });
    logger.info(`Pipeline [${taskId}]: Running ${outputFormats.length} workers`);

    // Ensure output directory exists
    await fs.promises.mkdir(outputDir, { recursive: true });

    const workerInput: WorkerInput = {
      ir: mergedIR,
      constraints: mergedConstraints,
      outputDir,
    };

    const results = await scheduleWorkers(workerInput, outputFormats, (format, result) => {
      listener?.('worker-done', { taskId, format, result });
    });

    task.results = results;

    // Check if ALL workers failed — if so, the task itself is failed
    const successfulWorkers = Object.values(results).filter(r => r.success).length;
    if (successfulWorkers === 0) {
      task.status = 'failed';
      task.error = 'All workers failed to produce output';
      task.completedAt = Date.now();
      listener?.('failed', { task, error: task.error });
      logger.error(`Pipeline [${taskId}]: All workers failed`);
      return task;
    }

    // Phase 4: Complete
    listener?.('progress', { taskId, phase: 'exporting' });

    task.status = 'completed';
    task.completedAt = Date.now();
    listener?.('completed', { task });

  } catch (error) {
    task.status = 'failed';
    task.error = error instanceof Error ? error.message : String(error);
    task.completedAt = Date.now();
    listener?.('failed', { task, error: task.error });
    logger.error(`Pipeline [${taskId}]: Failed - ${task.error}`);
  }

  return task;
}

function mergeIRDocuments(documents: IRDocument[]): IRDocument {
  if (documents.length === 0) {
    return { id: generateId(), type: 'document', version: 1, meta: { title: 'Empty', createdAt: Date.now() }, children: [] };
  }
  if (documents.length === 1) {
    return documents[0];
  }

  return {
    id: generateId(),
    type: 'document',
    version: 1,
    meta: {
      title: documents.map((d) => d.meta.title).join(' + '),
      createdAt: Date.now(),
    },
    children: documents.flatMap((d) => d.children),
  };
}

export function getTaskProgress(task: TransformationTask): TaskProgress {
  const totalWorkers = task.outputFormats.length;
  const completedWorkers = Object.keys(task.results).length;

  const workerStatuses: WorkerStatusEntry[] = task.outputFormats.map((format) => {
    const result = task.results[format];
    if (!result) {
      return { format, status: task.status === 'running' ? 'running' : 'pending' };
    }
    return {
      format,
      status: result.success ? 'completed' : 'failed',
      duration: result.duration,
      error: result.errors[0]?.message,
    };
  });

  let currentPhase: TaskProgress['currentPhase'] = 'parsing';
  if (task.status === 'completed') currentPhase = 'completed';
  else if (completedWorkers > 0) currentPhase = 'worker-execution';

  return {
    taskId: task.id,
    totalWorkers,
    completedWorkers,
    currentPhase,
    percentComplete: totalWorkers > 0 ? Math.round((completedWorkers / totalWorkers) * 100) : 0,
    workerStatuses,
  };
}
