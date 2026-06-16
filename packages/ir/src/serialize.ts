import {
  IRDocument, IRBlockNode,
  isIRSection, isIRParagraph, isIRList, isIRTable, isIRDiagram,
  isIRCode, isIRQuote, isIRImage, isIRFrontmatter, isIRPageBreak,
  isIRToc, isIRFootnote, isIRReference, isIRSlide,
} from '@papyrus/shared';

/** Serialize an IR document back to a simple markdown-like string */
export function serializeIR(ir: IRDocument): string {
  let output = `# ${ir.meta.title || 'Untitled'}\n\n`;

  for (const child of ir.children) {
    output += serializeNode(child, 0);
  }

  return output;
}

function serializeNode(node: IRBlockNode, indent: number): string {
  const prefix = '  '.repeat(indent);

  if (isIRSection(node)) {
    const hashes = '#'.repeat(Math.min(node.meta.level, 6));
    let section = `${prefix}${hashes} ${node.meta.heading}\n\n`;
    if (node.children) {
      for (const child of node.children) {
        section += serializeNode(child, indent);
      }
    }
    return section;
  }

  if (isIRParagraph(node)) {
    return `${prefix}${node.content}\n\n`;
  }

  if (isIRList(node)) {
    const items = node.content.items.map((item, i) =>
      node.content.ordered ? `${prefix}${i + 1}. ${item}\n` : `${prefix}- ${item}\n`
    ).join('');
    return items + '\n';
  }

  if (isIRTable(node)) {
    let table = `${prefix}| ${node.content.headers.map(cell => cell.replace(/\|/g, '\\|')).join(' | ')} |\n`;
    table += `${prefix}| ${node.content.headers.map(() => '---').join(' | ')} |\n`;
    for (const row of node.content.rows) {
      table += `${prefix}| ${row.map(cell => cell.replace(/\|/g, '\\|')).join(' | ')} |\n`;
    }
    return table + '\n';
  }

  if (isIRCode(node)) {
    return `${prefix}\`\`\`${node.content.language}\n${node.content.source}\n\`\`\`\n\n`;
  }

  if (isIRDiagram(node)) {
    return `${prefix}\`\`\`mermaid\n${node.content.source}\n\`\`\`\n\n`;
  }

  if (isIRQuote(node)) {
    const attribution = node.meta?.attribution ? ` -- ${node.meta.attribution}` : '';
    // Multi-line quotes need > prefix on each line
    const quotedContent = node.content.split('\n').map(line => `${prefix}> ${line}`).join('\n');
    return `${quotedContent}${attribution}\n\n`;
  }

  if (isIRImage(node)) {
    const alt = node.content.alt || 'image';
    return `${prefix}![${alt}](${node.content.assetReference})\n\n`;
  }

  if (isIRFrontmatter(node)) {
    const yaml = Object.entries(node.content)
      .map(([key, value]) => `${prefix}${key}: ${JSON.stringify(value)}`)
      .join('\n');
    return `${prefix}---\n${yaml}\n---\n\n`;
  }

  if (isIRPageBreak(node)) {
    return `${prefix}---\n\n`;
  }

  if (isIRToc(node)) {
    return `${prefix}[TOC]\n\n`;
  }

  if (isIRFootnote(node)) {
    const id = node.meta?.id || node.id.slice(0, 8);
    return `${prefix}[^${id}]: ${node.content}\n\n`;
  }

  if (isIRReference(node)) {
    return `${prefix}[ref]: ${node.content}\n\n`;
  }

  if (isIRSlide(node)) {
    let slide = `${prefix}--- slide ---\n\n`;
    if (node.children) {
      for (const child of node.children) {
        slide += serializeNode(child, indent);
      }
    }
    return slide;
  }

  // Unknown node type — skip gracefully
  return '';
}
