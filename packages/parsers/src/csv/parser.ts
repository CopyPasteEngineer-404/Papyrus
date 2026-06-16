import { IRBuilder } from '@papyrus/ir';
import { IRDocument } from '@papyrus/shared';

/** Parse CSV content into IR document */
export function parseCSV(content: string, filePath: string): IRDocument {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) {
    return new IRBuilder('Empty CSV', filePath).build();
  }

  const builder = new IRBuilder(filePath.split(/[/\\]/).pop() || 'CSV', filePath);

  const rows = parseCSVRows(content);
  if (rows.length === 0) {
    return builder.build();
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  if (headers.length > 0) {
    builder.addTable(headers, dataRows, { file: filePath, lineStart: 1, lineEnd: lines.length });
  }

  return builder.build();
}

/**
 * Parse all CSV rows, handling:
 * - Multi-line quoted fields (fields containing newlines)
 * - Escaped quotes ("") inside quoted fields
 * - Trailing newlines / empty lines at end of file
 */
export function parseCSVRows(content: string): string[][] {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote
        if (i + 1 < content.length && content[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      // Any character inside quotes (including newlines) is part of the field
      current += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        currentRow.push(current);
        current = '';
        i++;
      } else if (char === '\r') {
        // Skip carriage return
        i++;
      } else if (char === '\n') {
        currentRow.push(current);
        current = '';
        // Only push non-empty rows (skip trailing blank lines)
        if (currentRow.some(cell => cell.length > 0)) {
          result.push(currentRow);
        }
        currentRow = [];
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  // Handle last field/row (file may not end with newline)
  if (current.length > 0 || currentRow.length > 0) {
    currentRow.push(current);
    if (currentRow.some(cell => cell.length > 0)) {
      result.push(currentRow);
    }
  }

  return result;
}
