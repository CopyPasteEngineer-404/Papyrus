import { BaseWorker } from '../base-worker';
import { WorkerInput, WorkerError, WorkerWarning, GeneratedArtifact, sanitizeFilename, getUniqueFilename } from '@papyrus/shared';
import { serializeIR } from '@papyrus/ir';
import fs from 'fs';
import path from 'path';

export class MarkdownWorker extends BaseWorker {
  readonly format = 'md' as const;

  protected async process(
    input: WorkerInput,
    errors: WorkerError[],
    warnings: WorkerWarning[]
  ): Promise<GeneratedArtifact[]> {
    const { ir, outputDir } = input;

    // Use the IR serializer to produce markdown
    const md = serializeIR(ir);

    const buffer = Buffer.from(md, 'utf-8');
    const filename = getUniqueFilename(outputDir, sanitizeFilename(ir.meta.title || 'document'), 'md', (p) => fs.existsSync(p));
    const outputPath = path.join(outputDir, filename);
    await fs.promises.writeFile(outputPath, buffer);

    return [{ filename, data: buffer, format: 'md', size: buffer.length }];
  }
}
