/** Current IR schema version */
export const IR_VERSION = 1 as const;

/** Source traceability — every IR node knows where it came from */
export interface IRSource {
  file: string;
  lineStart?: number;
  lineEnd?: number;
}

/** Base IR node — all nodes share these fields */
export interface IRNode {
  id: string;
  type: string;
  source?: IRSource;
  meta?: Record<string, unknown>;
}

/** Document root node */
export interface IRDocument extends IRNode {
  type: 'document';
  version: typeof IR_VERSION;
  meta: {
    title: string;
    sourceFile?: string;
    createdAt: number;
    [key: string]: unknown;
  };
  children: IRBlockNode[];
}

/** Section node — heading + child blocks */
export interface IRSectionNode extends IRNode {
  type: 'section';
  meta: { heading: string; level: number };
  children: IRBlockNode[];
}

/** Paragraph node */
export interface IRParagraphNode extends IRNode {
  type: 'paragraph';
  content: string;
}

/** List node — ordered or unordered */
export interface IRListNode extends IRNode {
  type: 'list';
  content: {
    ordered: boolean;
    items: string[];
  };
}

/** Table node */
export interface IRTableNode extends IRNode {
  type: 'table';
  content: {
    headers: string[];
    rows: string[][];
  };
}

/** Diagram node — Mermaid */
export interface IRDiagramNode extends IRNode {
  type: 'diagram';
  content: {
    format: 'mermaid';
    source: string;
  };
}

/** Code block node */
export interface IRCodeNode extends IRNode {
  type: 'code';
  content: {
    language: string;
    source: string;
  };
}

/** Image node */
export interface IRImageNode extends IRNode {
  type: 'image';
  content: {
    assetReference: string;
    alt?: string;
    width?: number;
    height?: number;
  };
}

/** Frontmatter node — YAML metadata */
export interface IRFrontmatterNode extends IRNode {
  type: 'frontmatter';
  content: Record<string, unknown>;
}

/** Page break hint */
export interface IRPageBreakNode extends IRNode {
  type: 'page-break';
  content?: undefined;
}

/** Table of contents placeholder */
export interface IRTocNode extends IRNode {
  type: 'toc';
  content?: undefined;
}

/** Footnote node */
export interface IRFootnoteNode extends IRNode {
  type: 'footnote';
  content: string;
  meta?: { id?: string };
}

/** Reference / citation node */
export interface IRReferenceNode extends IRNode {
  type: 'reference';
  content: string;
  meta?: { key?: string; citationStyle?: string };
}

/** Block quote node */
export interface IRQuoteNode extends IRNode {
  type: 'quote';
  content: string;
  meta?: { attribution?: string };
}

/** Slide node — presentation block */
export interface IRSlideNode extends IRNode {
  type: 'slide';
  meta?: { layout?: 'title-content' | 'section-header' | 'blank'; notes?: string };
  children: IRBlockNode[];
}

/** Union of all block-level IR nodes */
export type IRBlockNode =
  | IRSectionNode
  | IRParagraphNode
  | IRListNode
  | IRTableNode
  | IRDiagramNode
  | IRCodeNode
  | IRImageNode
  | IRFrontmatterNode
  | IRPageBreakNode
  | IRTocNode
  | IRFootnoteNode
  | IRReferenceNode
  | IRQuoteNode
  | IRSlideNode;

/** All possible IR node type strings */
export type IRNodeType = IRBlockNode['type'];

// Type guards
export function isIRSection(node: IRBlockNode): node is IRSectionNode { return node.type === 'section'; }
export function isIRParagraph(node: IRBlockNode): node is IRParagraphNode { return node.type === 'paragraph'; }
export function isIRList(node: IRBlockNode): node is IRListNode { return node.type === 'list'; }
export function isIRTable(node: IRBlockNode): node is IRTableNode { return node.type === 'table'; }
export function isIRDiagram(node: IRBlockNode): node is IRDiagramNode { return node.type === 'diagram'; }
export function isIRCode(node: IRBlockNode): node is IRCodeNode { return node.type === 'code'; }
export function isIRImage(node: IRBlockNode): node is IRImageNode { return node.type === 'image'; }
export function isIRSlide(node: IRBlockNode): node is IRSlideNode { return node.type === 'slide'; }
export function isIRFrontmatter(node: IRBlockNode): node is IRFrontmatterNode { return node.type === 'frontmatter'; }
export function isIRPageBreak(node: IRBlockNode): node is IRPageBreakNode { return node.type === 'page-break'; }
export function isIRToc(node: IRBlockNode): node is IRTocNode { return node.type === 'toc'; }
export function isIRFootnote(node: IRBlockNode): node is IRFootnoteNode { return node.type === 'footnote'; }
export function isIRReference(node: IRBlockNode): node is IRReferenceNode { return node.type === 'reference'; }
export function isIRQuote(node: IRBlockNode): node is IRQuoteNode { return node.type === 'quote'; }

/** Extracted heading for table-of-contents generation */
export interface ExtractedHeading {
  id: string;
  heading: string;
  level: number;
}

/** Recursively extract all section headings from an IR document */
export function extractHeadings(doc: IRDocument): ExtractedHeading[] {
  const headings: ExtractedHeading[] = [];

  function walk(nodes: IRBlockNode[]): void {
    for (const node of nodes) {
      if (isIRSection(node)) {
        headings.push({ id: node.id, heading: node.meta.heading, level: node.meta.level });
        if (node.children) {
          walk(node.children);
        }
      }
    }
  }

  walk(doc.children);
  return headings;
}
