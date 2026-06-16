import { BaseWorker } from '../base-worker';
import { WorkerInput, WorkerError, WorkerWarning, GeneratedArtifact, isIRSection, isIRParagraph, isIRList, isIRCode, isIRTable, isIRQuote, isIRDiagram, isIRImage, isIRPageBreak, IRBlockNode, sanitizeFilename, getUniqueFilename } from '@papyrus/shared';
import { walkIR } from '@papyrus/ir';
import fs from 'fs';
import path from 'path';

/**
 * TxtWorker — Converts IR to plain text format.
 *
 * Strips all formatting (headings become uppercase lines, lists use dashes/numbers,
 * tables use tab-separated values, code blocks preserve content, etc.).
 * This is the simplest possible conversion — ideal for MD→TXT and CSV→TXT.
 */
export class TxtWorker extends BaseWorker {
  readonly format = 'txt' as const;

  protected async process(
    input: WorkerInput,
    errors: WorkerError[],
    warnings: WorkerWarning[]
  ): Promise<GeneratedArtifact[]> {
    const { ir, outputDir } = input;
    const txtConstraints = (input.constraints as any)?.txt || {};
    const lineWrap = txtConstraints.lineWrap || 80;

    const lines: string[] = [];

    // Title
    if (ir.meta.title) {
      lines.push(ir.meta.title.toUpperCase());
      lines.push('='.repeat(ir.meta.title.length));
      lines.push('');
    }

    // Walk all nodes using the simple visitor pattern
    walkIR(ir, (node: IRBlockNode) => {
      if (isIRSection(node)) {
        const level = node.meta.level || 1;
        const heading = node.meta.heading;
        if (heading) {
          if (level === 1) {
            lines.push('');
            lines.push(heading.toUpperCase());
            lines.push('='.repeat(heading.length));
            lines.push('');
          } else if (level === 2) {
            lines.push('');
            lines.push(heading.toUpperCase());
            lines.push('-'.repeat(heading.length));
            lines.push('');
          } else {
            lines.push('');
            lines.push(`### ${heading}`);
            lines.push('');
          }
        }
      }

      if (isIRParagraph(node)) {
        const text = stripInlineFormatting(node.content);
        if (text) {
          lines.push(wrapText(text, lineWrap));
          lines.push('');
        }
      }

      if (isIRList(node)) {
        const items = node.content.items || [];
        const ordered = node.content.ordered || false;
        items.forEach((item: string, i: number) => {
          const prefix = ordered ? `${i + 1}. ` : '  - ';
          const text = stripInlineFormatting(item);
          lines.push(`${prefix}${text}`);
        });
        lines.push('');
      }

      if (isIRCode(node)) {
        lines.push(`--- Code (${node.content.language || 'text'}) ---`);
        if (node.content.source) lines.push(node.content.source);
        lines.push('--- End Code ---');
        lines.push('');
      }

      if (isIRTable(node)) {
        const headers = node.content.headers || [];
        const rows = node.content.rows || [];
        if (headers.length > 0) {
          lines.push(headers.map((h: string) => String(h).padEnd(16)).join('\t'));
          lines.push(headers.map(() => '-'.repeat(16)).join('\t'));
        }
        rows.forEach((row: string[]) => {
          if (Array.isArray(row)) {
            lines.push(row.map((cell: string) => String(cell).padEnd(16)).join('\t'));
          }
        });
        lines.push('');
      }

      if (isIRQuote(node)) {
        const text = stripInlineFormatting(node.content);
        text.split('\n').forEach((line: string) => {
          lines.push(`  | ${line}`);
        });
        lines.push('');
      }

      if (isIRDiagram(node)) {
        lines.push(`[Diagram (${node.content.format})]`);
        if (node.content.source) lines.push(node.content.source);
        lines.push('');
      }

      if (isIRImage(node)) {
        const alt = node.content.alt || 'image';
        const src = node.content.assetReference || '';
        lines.push(`[Image: ${alt}${src ? ` — ${src}` : ''}]`);
        lines.push('');
      }

      if (isIRPageBreak(node)) {
        lines.push('');
        lines.push('—'.repeat(40));
        lines.push('');
      }
    });

    const text = lines.join('\n').trim() + '\n';
    const buffer = Buffer.from(text, 'utf-8');
    const filename = getUniqueFilename(outputDir, sanitizeFilename(ir.meta.title || 'document'), 'txt', (p) => fs.existsSync(p));
    const outputPath = path.join(outputDir, filename);
    await fs.promises.writeFile(outputPath, buffer);

    return [{ filename, data: buffer, format: 'txt', size: buffer.length }];
  }
}

/** Strip inline markdown formatting */
function stripInlineFormatting(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\[(.+?)\]\[(.+?)\]/g, '$1')
    .replace(/~~(.+?)~~/g, '$1');
}

/** Wrap text to a given line length */
function wrapText(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  const words = text.split(/\s+/);
  const result: string[] = [];
  let currentLine = '';
  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxLen && currentLine.length > 0) {
      result.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) result.push(currentLine);
  return result.join('\n');
}
