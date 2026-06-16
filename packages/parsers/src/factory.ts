import path from 'path';
import { IRDocument } from '@papyrus/shared';
import { parseMarkdown } from './markdown';
import { parseCSV } from './csv';
import { logger } from '@papyrus/shared';

export type InputFormat = 'md' | 'csv' | 'mermaid' | 'txt' | 'latex';

/** Detect file format from extension */
export function detectFormat(filePath: string): InputFormat | null {
  const ext = filePath.split(/[/\\]/).pop()?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md':
    case 'markdown':
      return 'md';
    case 'csv':
      return 'csv';
    case 'mmd':
    case 'mermaid':
      return 'mermaid';
    case 'txt':
    case 'text':
      return 'txt';
    case 'tex':
    case 'latex':
      return 'latex';
    default:
      return null;
  }
}

/** Parse a file into IR using the appropriate parser */
export async function parseFile(filePath: string, content?: string): Promise<IRDocument> {
  const format = detectFormat(filePath);

  if (!format) {
    throw new Error(`Unsupported file format: ${filePath}`);
  }

  logger.info(`Parsing ${filePath} as ${format}`);

  switch (format) {
    case 'md':
      return parseMarkdown(content || '', filePath);
    case 'csv':
      return parseCSV(content || '', filePath);
    case 'txt': {
      // Plain text: each paragraph becomes a paragraph node
      const { IRBuilder } = await import('@papyrus/ir').catch(() => {
        throw new Error('Failed to load IR module for text parsing. Ensure @papyrus/ir is installed.');
      });
      const builder = new IRBuilder(path.basename(filePath, path.extname(filePath)), filePath);
      const lines = (content || '').split('\n');
      let currentParagraph: string[] = [];
      for (const line of lines) {
        if (line.trim() === '') {
          if (currentParagraph.length > 0) {
            builder.addParagraph(currentParagraph.join(' '));
            currentParagraph = [];
          }
        } else {
          currentParagraph.push(line.trim());
        }
      }
      if (currentParagraph.length > 0) {
        builder.addParagraph(currentParagraph.join(' '));
      }
      return builder.build();
    }
    case 'mermaid': {
      const { IRBuilder } = await import('@papyrus/ir').catch(() => {
        throw new Error('Failed to load IR module for Mermaid parsing. Ensure @papyrus/ir is installed.');
      });
      const builder = new IRBuilder('Mermaid Diagram', filePath);
      builder.addDiagram(content || '', { file: filePath });
      return builder.build();
    }
    case 'latex': {
      const { IRBuilder } = await import('@papyrus/ir').catch(() => {
        throw new Error('Failed to load IR module for LaTeX parsing. Ensure @papyrus/ir is installed.');
      });
      const builder = new IRBuilder(path.basename(filePath, path.extname(filePath)), filePath);
      const lines = (content || '').split('\n');
      let currentParagraph: string[] = [];
      let inDocument = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('\\begin{document}')) { inDocument = true; continue; }
        if (trimmed.startsWith('\\end{document}')) break;
        if (!inDocument) continue;
        // Sections
        const sectionMatch = trimmed.match(/^\\(section|subsection|subsubsection|paragraph)\*?\{(.+)\}$/);
        if (sectionMatch) {
          if (currentParagraph.length > 0) {
            builder.addParagraph(currentParagraph.join(' '));
            currentParagraph = [];
          }
          const levelMap: Record<string, number> = { section: 1, subsection: 2, subsubsection: 3, paragraph: 4 };
          builder.addSection(sectionMatch[2], levelMap[sectionMatch[1]] || 1);
          continue;
        }
        // Skip LaTeX commands
        if (trimmed.startsWith('\\') && !trimmed.startsWith('\\item')) continue;
        if (trimmed === '') {
          if (currentParagraph.length > 0) {
            builder.addParagraph(currentParagraph.join(' '));
            currentParagraph = [];
          }
        } else {
          currentParagraph.push(trimmed);
        }
      }
      if (currentParagraph.length > 0) {
        builder.addParagraph(currentParagraph.join(' '));
      }
      return builder.build();
    }
  }
}
