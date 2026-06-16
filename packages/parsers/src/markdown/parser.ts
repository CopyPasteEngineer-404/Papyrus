import { IRBuilder, SectionBuilder } from '@papyrus/ir';
import { IRDocument, IRSource } from '@papyrus/shared';

/** Parse markdown string into IR document */
export function parseMarkdown(content: string, filePath: string): IRDocument {
  const lines = content.split(/\r?\n/);
  let lineIndex = 0;
  const title = extractTitle(lines) || filePath.split(/[/\\]/).pop() || 'Untitled';
  const builder = new IRBuilder(title, filePath);

  // Frontmatter detection at document start
  if (lines[0]?.trim() === '---') {
    const endIdx = lines.findIndex((line, idx) => idx > 0 && line.trim() === '---');
    if (endIdx > 0) {
      const yamlContent = lines.slice(1, endIdx).join('\n');
      const frontmatter: Record<string, unknown> = {};
      for (const line of yamlContent.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1).trim();
          try { frontmatter[key] = JSON.parse(value); } catch { frontmatter[key] = value; }
        }
      }
      builder.addFrontmatter(frontmatter, { file: filePath, lineStart: 1, lineEnd: endIdx + 1 });
      lineIndex = endIdx + 1;
    }
  }

  // Section stack: maintains nesting hierarchy based on heading levels.
  // Index 0 = the top-level IRBuilder, indices 1+ = SectionBuilders for open sections.
  const sectionStack: Array<IRBuilder | SectionBuilder> = [builder];

  /** Get the current parent (top of stack) to add children to */
  function currentParent(): IRBuilder | SectionBuilder {
    return sectionStack[sectionStack.length - 1];
  }

  /** Close sections whose level is >= the given level, then open a new section */
  function openSection(heading: string, level: number, source?: IRSource): SectionBuilder {
    // Pop sections that are at the same or deeper level
    while (sectionStack.length > 1) {
      const top = sectionStack[sectionStack.length - 1];
      // The top section's level determines when to pop
      // We need to peek at the section's level — SectionBuilder wraps an IRSectionNode
      const topLevel = (top as SectionBuilder).getLevel?.() ?? 0;
      if (topLevel >= level) {
        sectionStack.pop();
      } else {
        break;
      }
    }

    const parent = currentParent();
    const sectionBuilder = parent.addSection(heading, level, source);
    sectionStack.push(sectionBuilder);
    return sectionBuilder;
  }

  let i = lineIndex;
  let inCodeBlock = false;
  while (i < lines.length) {
    const line = lines[i];
    const source: IRSource | undefined = { file: filePath, lineStart: i + 1, lineEnd: i + 1 };

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();
      openSection(heading, level, source);
      i++;
      continue;
    }

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // Closing code block
        inCodeBlock = false;
        i++;
        continue;
      }
      inCodeBlock = true;
      const language = line.slice(3).trim() || 'text';
      const startLine = i + 1;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        i++; // skip closing ```
        inCodeBlock = false;
      }
      // If we reached end of file without closing ```, the code block is unclosed
      // but we still add it to preserve the content
      const codeSource = codeLines.join('\n');
      const codeSourceRef: IRSource = { file: filePath, lineStart: startLine, lineEnd: i };
      if (language === 'mermaid') {
        // Mermaid code blocks produce a diagram node, NOT a code node
        currentParent().addDiagram(codeSource, codeSourceRef);
      } else {
        currentParent().addCode(language, codeSource, codeSourceRef);
      }
      continue;
    }
    // If inside an unclosed code block, accumulate lines
    if (inCodeBlock) {
      i++;
      continue;
    }

    // Block quotes
    if (line.startsWith('> ')) {
      const startLine = i + 1;
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      currentParent().addQuote(quoteLines.join('\n'), undefined, { file: filePath, lineStart: startLine, lineEnd: i });
      continue;
    }

    // Thematic breaks (horizontal rules)
    if (line.match(/^[-*_]{3,}\s*$/)) {
      currentParent().addPageBreak();
      i++;
      continue;
    }

    // Unordered lists
    if (line.match(/^[\s]*[-*+]\s+/)) {
      const startLine = i + 1;
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[\s]*[-*+]\s+/)) {
        items.push(lines[i].replace(/^[\s]*[-*+]\s+/, ''));
        i++;
      }
      currentParent().addList(items, false, { file: filePath, lineStart: startLine, lineEnd: i });
      continue;
    }

    // Ordered lists
    if (line.match(/^[\s]*\d+\.\s+/)) {
      const startLine = i + 1;
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[\s]*\d+\.\s+/)) {
        items.push(lines[i].replace(/^[\s]*\d+\.\s+/, ''));
        i++;
      }
      currentParent().addList(items, true, { file: filePath, lineStart: startLine, lineEnd: i });
      continue;
    }

    // Paragraphs (non-empty lines)
    if (line.trim()) {
      const startLine = i + 1;
      const paraLines: string[] = [];
      while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('> ') && !lines[i].match(/^[\s]*[-*+]\s+/) && !lines[i].match(/^[\s]*\d+\.\s+/) && !lines[i].match(/^[-*_]{3,}\s*$/)) {
        paraLines.push(lines[i]);
        i++;
      }
      currentParent().addParagraph(paraLines.join(' '), { file: filePath, lineStart: startLine, lineEnd: i });
      continue;
    }

    // Empty line
    i++;
  }

  return builder.build();
}

function extractTitle(lines: string[]): string | undefined {
  // Only look at the first line for the title
  if (lines.length > 0) {
    const match = lines[0].match(/^#\s+(.+)$/);
    if (match) return match[1].trim();
  }
  return undefined;
}
