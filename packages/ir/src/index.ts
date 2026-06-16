export { IRBuilder, SectionBuilder } from './builder';
export { validateIR } from './validate';
export type { ValidationResult, ValidationError } from './validate';
export { serializeIR } from './serialize';
export { walkIR, findNodesByType, countNodesByType, extractHeadings } from './traversal';
export type { IRVisitor } from './traversal';
