import { BaseWorker } from '../base-worker';
import { WorkerInput, WorkerError, WorkerWarning, GeneratedArtifact, IRDocument, IRBlockNode, PDFConstraints, extractHeadings, isIRSection, isIRParagraph, isIRTable, isIRDiagram, isIRCode, isIRList, isIRImage, isIRQuote, isIRFootnote, isIRReference, sanitizeFilename, getUniqueFilename } from '@papyrus/shared';
import fs from 'fs';
import path from 'path';

export class PDFWorker extends BaseWorker {
  readonly format = 'pdf' as const;

  protected async process(
    input: WorkerInput,
    errors: WorkerError[],
    warnings: WorkerWarning[]
  ): Promise<GeneratedArtifact[]> {
    const { ir, constraints, outputDir } = input;
    const pdfConstraints = constraints.pdf || {};

    // Step 1: Generate HTML from IR
    const html = this.renderHTML(ir, pdfConstraints);

    // Step 2: Try to use Electron BrowserWindow for PDF generation
    let pdfBuffer: Buffer;

    try {
      pdfBuffer = await this.htmlToPDF(html, pdfConstraints);
    } catch (error) {
      // Fallback: write HTML file if Electron is not available
      warnings.push({
        code: 'PDF_FALLBACK_HTML',
        message: 'Electron BrowserWindow unavailable, outputting HTML instead. Run inside Electron for PDF.',
      });
      const htmlBuffer = Buffer.from(html, 'utf-8');
      const filename = getUniqueFilename(outputDir, sanitizeFilename(ir.meta.title || 'document'), 'html', (p) => fs.existsSync(p));
      const outputPath = path.join(outputDir, filename);
      await fs.promises.writeFile(outputPath, htmlBuffer);
      return [{ filename, data: htmlBuffer, format: 'html', size: htmlBuffer.length }];
    }

    // Step 3: Write PDF to disk
    const filename = getUniqueFilename(outputDir, sanitizeFilename(ir.meta.title || 'document'), 'pdf', (p) => fs.existsSync(p));
    const outputPath = path.join(outputDir, filename);
    await fs.promises.writeFile(outputPath, pdfBuffer);

    return [{ filename, data: pdfBuffer, format: 'pdf', size: pdfBuffer.length }];
  }

  /** Convert HTML to PDF using Electron's hidden BrowserWindow */
  private async htmlToPDF(html: string, constraints: Partial<PDFConstraints>): Promise<Buffer> {
    let BrowserWindow: any;
    try {
      const electron = require('electron');
      BrowserWindow = electron.BrowserWindow;
    } catch {
      throw new Error('Electron not available for PDF generation');
    }

    if (!BrowserWindow) {
      throw new Error('Electron BrowserWindow not available');
    }

    const win = new BrowserWindow({
      width: 800,
      height: 1100,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    try {
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      // Wait for rendering to complete (including Mermaid diagrams).
      // Instead of a fixed 5s sleep, poll for the document ready signal
      // with a maximum timeout of 10 seconds.
      const RENDER_TIMEOUT_MS = 10_000;
      const POLL_INTERVAL_MS = 200;
      const startTime = Date.now();
      let isReady = false;

      while (!isReady && (Date.now() - startTime) < RENDER_TIMEOUT_MS) {
        try {
          // Check if mermaid has finished rendering (if present) or if DOM is ready
          isReady = await win.webContents.executeJavaScript(
            `document.readyState === 'complete' && ` +
            `(typeof window.mermaid === 'undefined' || document.querySelectorAll('.mermaid[data-processed]').length === document.querySelectorAll('.mermaid').length)`
          );
        } catch {
          // executeJavaScript may fail if the page hasn't loaded yet
        }
        if (!isReady) {
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      }

      // Use Electron's printToPDF — pageSize accepts string names
      const pdfData = await win.webContents.printToPDF({
        pageSize: constraints.paperSize || 'A4',
        printBackground: true,
        margins: {
          marginType: 'default',
        },
      });

      return Buffer.from(pdfData);
    } finally {
      // Ensure the window is always closed, even if an error occurs
      try { win.close(); } catch { /* ignore if already destroyed */ }
    }
  }

  /** Render IR document to styled HTML */
  private renderHTML(ir: IRDocument, constraints: Partial<PDFConstraints>): string {
    const paperSize = constraints.paperSize || 'A4';
    const fontSize = constraints.fontSize || 12;
    const lineHeight = constraints.lineHeight || 1.6;
    const margin = constraints.margin || '1in';
    const darkMode = constraints.darkMode || false;

    const bgColor = darkMode ? '#1a1a2e' : '#ffffff';
    const textColor = darkMode ? '#e0e0e0' : '#1a1a1a';
    const headingColor = darkMode ? '#D4B87A' : '#A68B4B';

    let body = '';

    // Title
    body += `<h1 class="title">${this.escapeHtml(ir.meta.title || 'Untitled')}</h1>\n`;

    // Table of contents
    if (constraints.includeToc) {
      const headings = extractHeadings(ir);
      if (headings.length > 0) {
        body += '<nav class="toc"><h2>Table of Contents</h2><ul>\n';
        for (const h of headings) {
          body += `<li class="toc-level-${h.level}"><a href="#${h.id}">${this.escapeHtml(h.heading)}</a></li>\n`;
        }
        body += '</ul></nav>\n';
      }
    }

    // Render children
    body += this.renderChildren(ir.children);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${this.escapeHtml(ir.meta.title || 'Document')}</title>
  <style>
    @page { size: ${paperSize}; margin: ${margin}; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      color: ${textColor};
      background: ${bgColor};
      padding: 0 2cm;
    }
    .title { font-size: 2em; margin-bottom: 0.5em; color: ${headingColor}; border-bottom: 2px solid ${headingColor}; padding-bottom: 0.3em; }
    h1 { font-size: 1.8em; margin-top: 1.5em; color: ${headingColor}; }
    h2 { font-size: 1.5em; margin-top: 1.3em; color: ${headingColor}; }
    h3 { font-size: 1.3em; margin-top: 1.1em; color: ${headingColor}; }
    h4 { font-size: 1.1em; margin-top: 1em; color: ${headingColor}; }
    p { margin: 0.8em 0; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid ${darkMode ? '#444' : '#ddd'}; padding: 0.5em 0.8em; text-align: left; }
    th { background: ${darkMode ? '#2a2a1e' : '#f5f0e0'}; font-weight: 600; }
    pre { background: ${darkMode ? '#2a2a1e' : '#f5f0e5'}; padding: 1em; border-radius: 4px; overflow-x: auto; margin: 1em 0; }
    code { font-family: 'Fira Code', monospace; font-size: 0.9em; }
    blockquote { border-left: 4px solid ${headingColor}; padding-left: 1em; margin: 1em 0; color: ${darkMode ? '#aaa' : '#666'}; font-style: italic; }
    .diagram { text-align: center; margin: 1em 0; }
    .toc { background: ${darkMode ? '#2a2a1e' : '#f5f0e0'}; padding: 1em; border-radius: 4px; margin-bottom: 2em; }
    .toc ul { list-style: none; padding-left: 1em; }
    .toc-level-1 { font-weight: bold; }
    .toc-level-2 { padding-left: 1.5em; }
    .toc-level-3 { padding-left: 3em; }
    ul, ol { padding-left: 2em; margin: 0.5em 0; }
    li { margin: 0.3em 0; }
    .footnote { font-size: 0.85em; color: ${darkMode ? '#888' : '#666'}; }
    .reference { font-size: 0.9em; }
    img { max-width: 100%; height: auto; }
    .mermaid { text-align: center; margin: 1em 0; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad:true,theme:'${darkMode ? 'dark' : 'default'}'});</script>
</head>
<body>
${body}
</body>
</html>`;
  }

  private renderChildren(children: IRBlockNode[]): string {
    let html = '';
    for (const node of children) {
      if (isIRSection(node)) {
        const tag = `h${Math.min(node.meta.level, 6)}`;
        html += `<${tag} id="${node.id}">${this.escapeHtml(node.meta.heading)}</${tag}>\n`;
        if (node.children) {
          html += this.renderChildren(node.children);
        }
      } else if (isIRParagraph(node)) {
        html += `<p>${this.escapeHtml(node.content)}</p>\n`;
      } else if (isIRTable(node)) {
        html += '<table><thead><tr>';
        for (const h of node.content.headers) {
          html += `<th>${this.escapeHtml(h)}</th>`;
        }
        html += '</tr></thead><tbody>';
        for (const row of node.content.rows) {
          html += '<tr>';
          for (const cell of row) {
            html += `<td>${this.escapeHtml(cell)}</td>`;
          }
          html += '</tr>';
        }
        html += '</tbody></table>\n';
      } else if (isIRDiagram(node)) {
        html += `<div class="mermaid">${this.escapeHtml(node.content.source)}</div>\n`;
      } else if (isIRCode(node)) {
        html += `<pre><code class="language-${this.escapeHtml(node.content.language)}">${this.escapeHtml(node.content.source)}</code></pre>\n`;
      } else if (isIRList(node)) {
        const tag = node.content.ordered ? 'ol' : 'ul';
        html += `<${tag}>`;
        for (const item of node.content.items) {
          html += `<li>${this.escapeHtml(item)}</li>`;
        }
        html += `</${tag}>\n`;
      } else if (isIRImage(node)) {
        html += `<figure><img src="${this.escapeHtml(node.content.assetReference)}" alt="${this.escapeHtml(node.content.alt || '')}" /></figure>\n`;
      } else if (isIRQuote(node)) {
        html += `<blockquote>${this.escapeHtml(node.content)}${node.meta?.attribution ? ` — ${this.escapeHtml(node.meta.attribution as string)}` : ''}</blockquote>\n`;
      } else if (isIRFootnote(node)) {
        html += `<p class="footnote">${this.escapeHtml(node.content)}</p>\n`;
      } else if (isIRReference(node)) {
        html += `<p class="reference">${this.escapeHtml(node.content)}</p>\n`;
      }
    }
    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
