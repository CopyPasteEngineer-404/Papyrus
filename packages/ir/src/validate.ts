import {
  IRDocument,
  IRBlockNode,
  isIRSection,
  isIRParagraph,
  isIRList,
  isIRTable,
  isIRDiagram,
  isIRCode,
  isIRImage,
  isIRSlide,
  isIRFrontmatter,
  isIRPageBreak,
  isIRToc,
  isIRFootnote,
  isIRReference,
  isIRQuote,
  IR_VERSION,
} from '@papyrus/shared';

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/** Validate an IR document for structural correctness */
export function validateIR(ir: IRDocument): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check document-level fields
  if (ir.type !== 'document') {
    errors.push({ path: '/', message: `Root node type must be 'document', got '${ir.type}'`, severity: 'error' });
  }

  if (ir.version !== IR_VERSION) {
    warnings.push({ path: '/version', message: `IR version ${ir.version} does not match expected ${IR_VERSION}`, severity: 'warning' });
  }

  if (!ir.meta?.title) {
    warnings.push({ path: '/meta/title', message: 'Document has no title', severity: 'warning' });
  }

  if (!ir.id) {
    errors.push({ path: '/id', message: 'Document must have an id', severity: 'error' });
  }

  // Track all node IDs to detect duplicates
  const seenIds = new Set<string>();

  // Recursively validate children
  validateChildren(ir.children, '/', errors, warnings, seenIds);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateChildren(
  children: IRBlockNode[],
  parentPath: string,
  errors: ValidationError[],
  warnings: ValidationError[],
  seenIds: Set<string>
): void {
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    const path = `${parentPath}/children[${i}]`;

    if (!node.id) {
      errors.push({ path, message: `Node at ${path} missing id`, severity: 'error' });
    } else {
      // Check for duplicate IDs
      if (seenIds.has(node.id)) {
        errors.push({ path, message: `Duplicate node id: ${node.id}`, severity: 'error' });
      }
      seenIds.add(node.id);
    }

    if (!node.type) {
      errors.push({ path, message: `Node at ${path} missing type`, severity: 'error' });
      continue;
    }

    // Validate section nodes recursively
    if (isIRSection(node)) {
      if (!node.meta?.heading) {
        warnings.push({ path: `${path}/meta/heading`, message: 'Section missing heading', severity: 'warning' });
      }
      if (typeof node.meta?.level !== 'number' || node.meta.level < 1) {
        errors.push({ path: `${path}/meta/level`, message: 'Section level must be a number >= 1', severity: 'error' });
      }
      if (node.children) {
        validateChildren(node.children, path, errors, warnings, seenIds);
      }
    }

    // Validate table nodes
    if (isIRTable(node)) {
      if (!node.content?.headers || !Array.isArray(node.content.headers)) {
        errors.push({ path: `${path}/content/headers`, message: 'Table must have headers array', severity: 'error' });
      }
      if (!node.content?.rows || !Array.isArray(node.content.rows)) {
        errors.push({ path: `${path}/content/rows`, message: 'Table must have rows array', severity: 'error' });
      }
      // Validate table consistency: each row should have the same length as headers
      if (node.content?.headers && Array.isArray(node.content.headers) && node.content?.rows && Array.isArray(node.content.rows)) {
        const headerCount = node.content.headers.length;
        for (let rowIdx = 0; rowIdx < node.content.rows.length; rowIdx++) {
          const row = node.content.rows[rowIdx];
          if (!Array.isArray(row)) {
            errors.push({ path: `${path}/content/rows[${rowIdx}]`, message: 'Table row must be an array', severity: 'error' });
          } else if (row.length !== headerCount) {
            errors.push({
              path: `${path}/content/rows[${rowIdx}]`,
              message: `Table row has ${row.length} cells but headers has ${headerCount} columns`,
              severity: 'error',
            });
          }
        }
      }
    }

    // Validate code nodes
    if (isIRCode(node)) {
      if (!node.content?.source) {
        warnings.push({ path: `${path}/content/source`, message: 'Code block has no source content', severity: 'warning' });
      }
    }

    // Validate list nodes
    if (isIRList(node)) {
      if (!node.content?.items || !Array.isArray(node.content.items)) {
        errors.push({ path: `${path}/content/items`, message: 'List must have items array', severity: 'error' });
      }
    }

    // Validate diagram nodes
    if (isIRDiagram(node)) {
      if (!node.content?.format) {
        errors.push({ path: `${path}/content/format`, message: 'Diagram must specify a format', severity: 'error' });
      }
      if (!node.content?.source) {
        warnings.push({ path: `${path}/content/source`, message: 'Diagram has no source content', severity: 'warning' });
      }
    }

    // Validate paragraph nodes
    if (isIRParagraph(node)) {
      if (!node.content || typeof node.content !== 'string') {
        errors.push({ path: `${path}/content`, message: 'Paragraph must have string content', severity: 'error' });
      }
    }

    // Validate quote nodes
    if (isIRQuote(node)) {
      if (!node.content || typeof node.content !== 'string') {
        errors.push({ path: `${path}/content`, message: 'Quote must have string content', severity: 'error' });
      }
    }

    // Validate slide nodes recursively
    if (isIRSlide(node)) {
      if (node.children) {
        validateChildren(node.children, path, errors, warnings, seenIds);
      }
    }
  }
}
