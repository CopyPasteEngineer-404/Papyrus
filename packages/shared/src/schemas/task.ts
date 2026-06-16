import { z } from 'zod';

/** PDF constraints schema */
export const PDFConstraintsSchema = z.object({
  paperSize: z.enum(['A4', 'Letter', 'Legal']).optional(),
  margin: z.string().optional(),
  citationStyle: z.enum(['IEEE', 'APA', 'MLA', 'none']).optional(),
  fontSize: z.number().min(8).max(72).optional(),
  lineHeight: z.number().min(1).max(3).optional(),
  headerTemplate: z.string().optional(),
  footerTemplate: z.string().optional(),
  includeToc: z.boolean().optional(),
  darkMode: z.boolean().optional(),
});

/** Markdown constraints schema */
export const MarkdownConstraintsSchema = z.object({
  flavor: z.enum(['gfm', 'commonmark']).optional(),
  includeFrontmatter: z.boolean().optional(),
  diagramFormat: z.enum(['mermaid', 'link']).optional(),
});

/** Plain Text constraints schema */
export const TextConstraintsSchema = z.object({
  lineWrap: z.number().min(40).max(200).optional(),
  preserveFormatting: z.boolean().optional(),
});

/** Aggregated constraint set schema — Phase 1: pdf, md, txt */
export const ConstraintSetSchema = z.object({
  pdf: PDFConstraintsSchema.optional(),
  md: MarkdownConstraintsSchema.optional(),
  txt: TextConstraintsSchema.optional(),
});

/** Task creation payload schema — validates IPC input */
export const TaskCreateSchema = z.object({
  sourceFiles: z.array(z.string()).min(1, 'At least one source file is required'),
  outputFormats: z.array(z.enum(['pdf', 'md', 'txt'])).min(1, 'At least one output format is required'),
  constraints: ConstraintSetSchema,
});

/** Task cancellation schema */
export const TaskCancelSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

/** Convert file payload schema — validates IPC input for convert:file */
export const ConvertFileSchema = z.object({
  sourceFilePath: z.string().min(1, 'Source file path is required'),
  targetFormat: z.enum(['txt', 'html', 'md', 'docx', 'csv', 'pdf', 'latex'], {
    errorMap: () => ({ message: 'Invalid target format. Supported: txt, html, md, docx, csv, pdf, latex' }),
  }),
  sourceFormat: z.enum(['md', 'csv', 'txt', 'mermaid', 'latex', 'docx']).optional(),
  htmlOptions: z.object({
    darkMode: z.boolean().optional(),
    textColor: z.string().optional(),
    headingColor: z.string().optional(),
    bgColor: z.string().optional(),
    fontSize: z.number().min(8).max(72).optional(),
    includeMermaid: z.boolean().optional(),
  }).optional(),
});

/** Worker input validation schema */
export const WorkerInputSchema = z.object({
  ir: z.object({
    id: z.string(),
    type: z.literal('document'),
    version: z.literal(1),
    meta: z.object({
      title: z.string(),
    }).passthrough(),
    children: z.array(z.unknown()),
  }),
  constraints: ConstraintSetSchema,
  outputDir: z.string().min(1, 'Output directory is required'),
});
