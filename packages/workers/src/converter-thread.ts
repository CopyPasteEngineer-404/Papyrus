/**
 * Converter Worker Thread
 *
 * Runs CPU-intensive file conversions off the main Electron process thread.
 * Communicates via parentPort (Node.js worker_threads).
 *
 * Usage from main process:
 *   import { runConverterWorker } from './converter-thread';
 *   const result = await runConverterWorker(sourcePath, sourceFormat, targetFormat, outputDir, htmlOptions);
 */

import { parentPort } from 'worker_threads';
import { convertFile, type SourceFormat, type TargetFormat, type HtmlConversionOptions, type ConversionResult } from './converter';

interface ConverterRequest {
  id: string;
  sourcePath: string;
  sourceFormat: SourceFormat;
  targetFormat: TargetFormat;
  outputDir: string;
  htmlOptions?: HtmlConversionOptions;
}

parentPort?.on('message', async (msg: ConverterRequest) => {
  try {
    const result = await convertFile(
      msg.sourcePath,
      msg.sourceFormat,
      msg.targetFormat,
      msg.outputDir,
      msg.htmlOptions,
    );
    parentPort?.postMessage({ id: msg.id, result });
  } catch (error) {
    const result: ConversionResult = {
      success: false,
      outputPath: '',
      targetFormat: msg.targetFormat,
      fileSize: 0,
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
    };
    parentPort?.postMessage({ id: msg.id, result });
  }
});
