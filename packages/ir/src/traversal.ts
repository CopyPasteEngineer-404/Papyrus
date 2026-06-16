import { IRDocument, IRBlockNode, IRSectionNode, IRSlideNode, isIRSection, isIRSlide } from '@papyrus/shared';

export type IRVisitor = (node: IRBlockNode, path: string[]) => void;

export function walkIR(doc: IRDocument, visitor: IRVisitor): void {
  walkChildren(doc.children, [], visitor);
}

function walkChildren(nodes: IRBlockNode[], path: string[], visitor: IRVisitor): void {
  for (const node of nodes) {
    const nodePath = [...path, `${node.type}:${node.id?.slice(0, 8) ?? 'unknown'}`];
    visitor(node, nodePath);
    if (isIRSection(node) && node.children) {
      walkChildren(node.children, nodePath, visitor);
    }
    if (isIRSlide(node) && node.children) {
      walkChildren(node.children, nodePath, visitor);
    }
  }
}

export function findNodesByType<T extends IRBlockNode>(doc: IRDocument, type: T['type']): T[] {
  const results: T[] = [];
  walkIR(doc, (node) => {
    if (node.type === type) results.push(node as T);
  });
  return results;
}

export function countNodesByType(doc: IRDocument): Record<string, number> {
  const counts: Record<string, number> = {};
  walkIR(doc, (node) => { counts[node.type] = (counts[node.type] || 0) + 1; });
  return counts;
}

export function extractHeadings(doc: IRDocument): Array<{ heading: string; level: number; id: string }> {
  const headings: Array<{ heading: string; level: number; id: string }> = [];
  walkIR(doc, (node) => {
    if (isIRSection(node)) {
      headings.push({ heading: node.meta.heading, level: node.meta.level, id: node.id });
    }
  });
  return headings;
}
