/**
 * Constraint types for output format generation.
 * Phase 1: Only PDF and Markdown constraints are active.
 */

/** PDF generation constraints */
export interface PDFConstraints {
  paperSize?: 'A4' | 'Letter' | 'Legal';
  margin?: string;
  citationStyle?: 'IEEE' | 'APA' | 'MLA' | 'none';
  fontSize?: number;
  lineHeight?: number;
  headerTemplate?: string;
  footerTemplate?: string;
  includeToc?: boolean;
  darkMode?: boolean;
}

/** Markdown generation constraints */
export interface MarkdownConstraints {
  flavor?: 'gfm' | 'commonmark';
  includeFrontmatter?: boolean;
  diagramFormat?: 'mermaid' | 'link';
}

/** Plain Text generation constraints */
export interface TextConstraints {
  lineWrap?: number;
  preserveFormatting?: boolean;
}

/**
 * Aggregated constraint set.
 * Phase 1: Only pdf and md are active.
 * Future formats will be added as workers are implemented.
 */
export interface ConstraintSet {
  pdf?: PDFConstraints;
  md?: MarkdownConstraints;
  txt?: TextConstraints;
}

export const DEFAULT_PDF_CONSTRAINTS: Required<PDFConstraints> = {
  paperSize: 'A4',
  margin: '1in',
  citationStyle: 'none',
  fontSize: 12,
  lineHeight: 1.6,
  headerTemplate: '',
  footerTemplate: '',
  includeToc: false,
  darkMode: false,
};

export const DEFAULT_MD_CONSTRAINTS: Required<MarkdownConstraints> = {
  flavor: 'gfm',
  includeFrontmatter: true,
  diagramFormat: 'mermaid',
};

export const DEFAULT_TXT_CONSTRAINTS: Required<TextConstraints> = {
  lineWrap: 80,
  preserveFormatting: false,
};

export const DEFAULT_CONSTRAINT_SET: Required<ConstraintSet> = {
  pdf: DEFAULT_PDF_CONSTRAINTS,
  md: DEFAULT_MD_CONSTRAINTS,
  txt: DEFAULT_TXT_CONSTRAINTS,
};
