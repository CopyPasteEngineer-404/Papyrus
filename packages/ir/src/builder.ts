import {
  IRDocument,
  IRBlockNode,
  IRSectionNode,
  IRParagraphNode,
  IRListNode,
  IRTableNode,
  IRDiagramNode,
  IRCodeNode,
  IRImageNode,
  IRFrontmatterNode,
  IRPageBreakNode,
  IRTocNode,
  IRFootnoteNode,
  IRReferenceNode,
  IRQuoteNode,
  IRSlideNode,
  IRSource,
  generateId,
  IR_VERSION,
} from '@papyrus/shared';

/**
 * IRBuilder — fluent builder for constructing IR documents.
 * Used by parsers to build IR from parsed content.
 */
export class IRBuilder {
  private id: string;
  private title: string;
  private sourceFile: string;
  private children: IRBlockNode[] = [];

  constructor(title: string, sourceFile: string) {
    this.id = generateId();
    this.title = title;
    this.sourceFile = sourceFile;
  }

  addSection(heading: string, level: number, source?: IRSource): SectionBuilder {
    const section: IRSectionNode = {
      id: generateId(),
      type: 'section',
      meta: { heading, level },
      children: [],
      ...(source ? { source } : {}),
    };
    this.children.push(section);
    return new SectionBuilder(section);
  }

  addParagraph(content: string, source?: IRSource): this {
    this.children.push({
      id: generateId(),
      type: 'paragraph',
      content,
      ...(source ? { source } : {}),
    });
    return this;
  }

  addList(items: string[], ordered: boolean, source?: IRSource): this {
    this.children.push({
      id: generateId(),
      type: 'list',
      content: { ordered, items },
      ...(source ? { source } : {}),
    });
    return this;
  }

  addTable(headers: string[], rows: string[][], source?: IRSource): this {
    this.children.push({
      id: generateId(),
      type: 'table',
      content: { headers, rows },
      ...(source ? { source } : {}),
    });
    return this;
  }

  addDiagram(source: string, irSource?: IRSource): this {
    this.children.push({
      id: generateId(),
      type: 'diagram',
      content: { format: 'mermaid', source },
      ...(irSource ? { source: irSource } : {}),
    });
    return this;
  }

  addCode(language: string, source: string, irSource?: IRSource): this {
    this.children.push({
      id: generateId(),
      type: 'code',
      content: { language, source },
      ...(irSource ? { source: irSource } : {}),
    });
    return this;
  }

  addImage(assetReference: string, alt?: string, source?: IRSource): this {
    this.children.push({
      id: generateId(),
      type: 'image',
      content: { assetReference, alt },
      ...(source ? { source } : {}),
    });
    return this;
  }

  addFrontmatter(content: Record<string, unknown>, source?: IRSource): this {
    this.children.push({
      id: generateId(),
      type: 'frontmatter',
      content,
      ...(source ? { source } : {}),
    });
    return this;
  }

  addPageBreak(): this {
    this.children.push({
      id: generateId(),
      type: 'page-break',
    });
    return this;
  }

  addToc(): this {
    this.children.push({
      id: generateId(),
      type: 'toc',
    });
    return this;
  }

  addFootnote(content: string, source?: IRSource): this {
    this.children.push({
      id: generateId(),
      type: 'footnote',
      content,
      ...(source ? { source } : {}),
    });
    return this;
  }

  addReference(content: string, source?: IRSource): this {
    this.children.push({
      id: generateId(),
      type: 'reference',
      content,
      ...(source ? { source } : {}),
    });
    return this;
  }

  addQuote(content: string, attribution?: string, source?: IRSource): this {
    this.children.push({
      id: generateId(),
      type: 'quote',
      content,
      ...(attribution ? { meta: { attribution } } : {}),
      ...(source ? { source } : {}),
    });
    return this;
  }

  addSlide(layout?: IRSlideNode['meta'], source?: IRSource): SectionBuilder {
    const slide: IRSlideNode = {
      id: generateId(),
      type: 'slide',
      ...(layout ? { meta: layout } : {}),
      children: [],
      ...(source ? { source } : {}),
    };
    this.children.push(slide);
    return new SectionBuilder(slide);
  }

  build(): IRDocument {
    return {
      id: this.id,
      type: 'document',
      version: IR_VERSION,
      meta: {
        title: this.title,
        sourceFile: this.sourceFile,
        createdAt: Date.now(),
      },
      children: this.children,
    };
  }
}

/** Helper builder for section/slide children */
export class SectionBuilder {
  constructor(private section: IRSectionNode | IRSlideNode) {}

  /** Get the heading level of this section (0 for slides) */
  getLevel(): number {
    if ('meta' in this.section && this.section.type === 'section') {
      return (this.section as IRSectionNode).meta.level;
    }
    return 0;
  }

  addParagraph(content: string, source?: IRSource): this {
    this.section.children.push({
      id: generateId(),
      type: 'paragraph',
      content,
      ...(source ? { source } : {}),
    });
    return this;
  }

  addList(items: string[], ordered: boolean, source?: IRSource): this {
    this.section.children.push({
      id: generateId(),
      type: 'list',
      content: { ordered, items },
      ...(source ? { source } : {}),
    });
    return this;
  }

  addTable(headers: string[], rows: string[][], source?: IRSource): this {
    this.section.children.push({
      id: generateId(),
      type: 'table',
      content: { headers, rows },
      ...(source ? { source } : {}),
    });
    return this;
  }

  addCode(language: string, source: string, irSource?: IRSource): this {
    this.section.children.push({
      id: generateId(),
      type: 'code',
      content: { language, source },
      ...(irSource ? { source: irSource } : {}),
    });
    return this;
  }

  addDiagram(source: string, irSource?: IRSource): this {
    this.section.children.push({
      id: generateId(),
      type: 'diagram',
      content: { format: 'mermaid', source },
      ...(irSource ? { source: irSource } : {}),
    });
    return this;
  }

  addImage(assetReference: string, alt?: string, source?: IRSource): this {
    this.section.children.push({
      id: generateId(),
      type: 'image',
      content: { assetReference, alt },
      ...(source ? { source } : {}),
    });
    return this;
  }

  addQuote(content: string, attribution?: string, source?: IRSource): this {
    this.section.children.push({
      id: generateId(),
      type: 'quote',
      content,
      ...(attribution ? { meta: { attribution } } : {}),
      ...(source ? { source } : {}),
    });
    return this;
  }

  addFootnote(content: string, source?: IRSource): this {
    this.section.children.push({
      id: generateId(),
      type: 'footnote',
      content,
      ...(source ? { source } : {}),
    });
    return this;
  }

  addReference(content: string, source?: IRSource): this {
    this.section.children.push({
      id: generateId(),
      type: 'reference',
      content,
      ...(source ? { source } : {}),
    });
    return this;
  }

  addFrontmatter(content: Record<string, unknown>, source?: IRSource): this {
    this.section.children.push({
      id: generateId(),
      type: 'frontmatter',
      content,
      ...(source ? { source } : {}),
    });
    return this;
  }

  addPageBreak(): this {
    this.section.children.push({
      id: generateId(),
      type: 'page-break',
    });
    return this;
  }

  addToc(): this {
    this.section.children.push({
      id: generateId(),
      type: 'toc',
    });
    return this;
  }

  addSection(heading: string, level: number, source?: IRSource): SectionBuilder {
    const section: IRSectionNode = {
      id: generateId(),
      type: 'section',
      meta: { heading, level },
      children: [],
      ...(source ? { source } : {}),
    };
    this.section.children.push(section);
    return new SectionBuilder(section);
  }

  endSection(): void {
    // No-op — section is already added to parent's children array
  }
}
