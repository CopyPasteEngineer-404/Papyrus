import React, { useState, useEffect, useRef } from 'react';
import { FileText, Table2, FileCode, Eye, X, Loader2, AlertTriangle } from 'lucide-react';

/**
 * ExportPreview — Shows a preview of file content.
 *
 * Features:
 * - Read-only preview panel for text-based files (MD, CSV, Mermaid, TXT, HTML)
 * - Internal vertical-only scrolling confined to the viewer window
 * - Close button in the header
 * - PDF/DOCX files show a message (binary formats not previewable)
 */

interface ExportPreviewFile {
  id: string;
  name: string;
  path: string;
  format: string;
  size: number;
}

interface ExportPreviewProps {
  file: ExportPreviewFile | null;
  onClose: () => void;
}

const ExportPreview: React.FC<ExportPreviewProps> = ({ file, onClose }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load file content when file changes
  useEffect(() => {
    if (!file) {
      setContent(null);
      setError(null);
      return;
    }

    // PDF and DOCX files can't be previewed as text
    if (file.format === 'pdf' || file.format === 'docx') {
      setContent(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Read file content via IPC
    window.papyrus?.readFileContent(file.path)
      .then((result: string) => {
        setContent(result);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to read file');
        setLoading(false);
      });
  }, [file]);

  // No file selected
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Eye size={32} style={{ color: 'var(--fg-dim, #71717a)' }} />
        <p className="text-xs mt-2" style={{ color: 'var(--fg-dim, #71717a)' }}>
          Select a file to preview
        </p>
      </div>
    );
  }

  // Format icon
  const FormatIcon = file.format === 'csv' ? Table2 : file.format === 'mmd' ? FileCode : file.format === 'html' ? FileCode : file.format === 'txt' ? FileText : FileText;

  // Binary formats that can't be previewed as text
  const isBinaryFormat = file.format === 'pdf' || file.format === 'docx';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-default, #27272a)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <FormatIcon size={14} style={{ color: 'var(--accent-primary, #C4A265)', flexShrink: 0 }} />
          <span className="text-xs font-medium truncate" style={{ color: 'var(--fg-primary)' }}>
            {file.name}
          </span>
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--fg-dim, #71717a)' }}>
            {file.size > 0 ? `${(file.size / 1024).toFixed(1)}KB` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1 rounded transition-colors cursor-pointer"
            onClick={onClose}
            title="Close preview"
            style={{ color: 'var(--fg-dim, #71717a)', backgroundColor: 'transparent' }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover, rgba(255,255,255,0.06))'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content — scrollable area with vertical-only scroll, confined to this window */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3"
        style={{ scrollbarGutter: 'stable' }}
      >
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent-primary, #C4A265)' }} />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertTriangle size={20} style={{ color: 'var(--status-error, #ef4444)' }} />
            <p className="text-xs" style={{ color: 'var(--status-error, #ef4444)' }}>{error}</p>
          </div>
        )}

        {isBinaryFormat && !loading && !error && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <FileText size={32} style={{ color: 'var(--fg-dim, #71717a)' }} />
            <p className="text-xs" style={{ color: 'var(--fg-dim, #71717a)' }}>
              {file.format === 'pdf' ? 'PDF' : 'DOCX'} preview is not available. Open the file to view it.
            </p>
          </div>
        )}

        {content && file.format === 'csv' && (
          <CsvTable content={content} />
        )}

        {content && file.format === 'md' && (
          <MarkdownPreview content={content} />
        )}

        {content && (file.format === 'mmd' || file.format === 'mermaid') && (
          <MermaidPreview content={content} />
        )}

        {content && file.format === 'txt' && (
          <pre
            className="text-xs whitespace-pre-wrap font-mono leading-relaxed"
            style={{ color: 'var(--fg-secondary)' }}
          >
            {content}
          </pre>
        )}

        {content && file.format === 'html' && (
          <details className="mt-2" open>
            <summary className="text-xs cursor-pointer" style={{ color: 'var(--fg-dim)' }}>Preview</summary>
            <iframe
              srcDoc={content}
              className="w-full border-0 rounded mt-1"
              style={{ minHeight: '300px', backgroundColor: '#fff' }}
              title="HTML Preview"
              sandbox="allow-scripts"
            />
          </details>
        )}

        {content && (file.format === 'tex' || file.format === 'latex') && (
          <LatexPreview content={content} />
        )}
      </div>
    </div>
  );
};

/** Simple CSV table renderer */
const CsvTable: React.FC<{ content: string }> = ({ content }) => {
  const rows = content.trim().split('\n').map(row =>
    row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
  );

  if (rows.length === 0) return null;

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return (
    <div className="overflow-x-hidden">
      <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-2 py-1 text-left font-semibold border-b"
                style={{
                  borderColor: 'var(--border-default, #27272a)',
                  color: 'var(--accent-primary, #C4A265)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.slice(0, 50).map((row, rowIdx) => (
            <tr key={rowIdx}>
              {headers.map((_, colIdx) => (
                <td
                  key={colIdx}
                  className="px-2 py-1 border-b"
                  style={{
                    borderColor: 'var(--border-default, #27272a)',
                    color: 'var(--fg-secondary)',
                  }}
                >
                  {row[colIdx] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {dataRows.length > 50 && (
        <p className="text-xs mt-2" style={{ color: 'var(--fg-dim, #71717a)' }}>
          Showing 50 of {dataRows.length} rows
        </p>
      )}
    </div>
  );
};

/** Basic Markdown preview with minimal rendering including tables */
const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-xs font-bold mt-2 mb-1" style={{ color: 'var(--fg-primary)' }}>{trimmed.slice(4)}</h3>);
      i++; continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-sm font-bold mt-3 mb-1" style={{ color: 'var(--fg-primary)' }}>{trimmed.slice(3)}</h2>);
      i++; continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-base font-bold mt-4 mb-1" style={{ color: 'var(--fg-primary)' }}>{trimmed.slice(2)}</h1>);
      i++; continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={i} className="my-2" style={{ borderColor: 'var(--border-default, #27272a)' }} />);
      i++; continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div key={`code-${i}`} className="my-2 p-2 rounded text-xs font-mono overflow-x-auto" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--fg-secondary)', border: '1px solid var(--border-default)' }}>
          {lang && <div className="text-xs mb-1 font-sans" style={{ color: 'var(--fg-dim)' }}>{lang}</div>}
          <pre className="whitespace-pre-wrap">{codeLines.join('\n')}</pre>
        </div>
      );
      continue;
    }

    // Table detection: line contains pipes and next line is separator
    if (trimmed.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+[-|\s:]*$/.test(lines[i + 1].trim())) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      elements.push(<MarkdownTable key={`table-${i}`} rawLines={tableLines} />);
      continue;
    }

    // List items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(<div key={i} className="pl-3 py-0.5">• {trimmed.slice(2)}</div>);
      i++; continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s/);
    if (numMatch) {
      elements.push(<div key={i} className="pl-3 py-0.5">{trimmed}</div>);
      i++; continue;
    }

    // Empty line
    if (trimmed === '') {
      elements.push(<div key={i} className="h-2" />);
      i++; continue;
    }

    // Regular paragraph
    elements.push(<p key={i} className="py-0.5">{trimmed}</p>);
    i++;
  }

  return (
    <div className="text-xs leading-relaxed" style={{ color: 'var(--fg-secondary)' }}>
      {elements}
    </div>
  );
};

/** Render a Markdown table from raw pipe-delimited lines */
const MarkdownTable: React.FC<{ rawLines: string[] }> = ({ rawLines }) => {
  if (rawLines.length < 2) return null;

  const parseRow = (line: string) =>
    line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());

  const headers = parseRow(rawLines[0]);
  // Skip separator line (rawLines[1])
  const dataRows = rawLines.slice(2).map(parseRow);

  return (
    <div className="my-2 overflow-x-auto">
      <table className="w-full text-xs border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {headers.map((header, ci) => (
              <th
                key={ci}
                className="px-2 py-1 text-left font-semibold border-b"
                style={{
                  borderColor: 'var(--border-default, #27272a)',
                  color: 'var(--accent-primary, #C4A265)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri}>
              {headers.map((_, ci) => (
                <td
                  key={ci}
                  className="px-2 py-1 border-b"
                  style={{
                    borderColor: 'var(--border-default, #27272a)',
                    color: 'var(--fg-secondary)',
                  }}
                >
                  {row[ci] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Mermaid diagram renderer — renders Mermaid code to SVG using the mermaid library */
const MermaidPreview: React.FC<{ content: string }> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      try {
        // Dynamic import — Vite will code-split mermaid into its own chunk
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default || mermaidModule;

        // Initialize mermaid with proper config
        if (typeof mermaid.initialize === 'function') {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'strict',
            fontFamily: 'inherit',
            logLevel: 'error' as any,
          });
        }

        const id = `mermaid-preview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { svg } = await mermaid.render(id, content.trim());

        if (!cancelled) {
          setRendered(svg);
          setRenderError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setRenderError(err?.message || 'Failed to render Mermaid diagram');
          setRendered(null);
        }
      }
    }

    if (content && content.trim()) {
      renderMermaid();
    }

    return () => { cancelled = true; };
  }, [content]);

  return (
    <div className="flex flex-col h-full">
      {renderError && (
        <div className="mb-3 p-3 rounded-md" style={{ backgroundColor: 'var(--status-warning-muted)', border: '1px solid var(--status-warning)' }}>
          <p className="text-xs" style={{ color: 'var(--status-warning)' }}>
            Diagram rendering failed: {renderError}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--fg-dim)' }}>
            Showing raw Mermaid source below.
          </p>
        </div>
      )}
      {rendered && (
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center p-4"
          style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md, 6px)' }}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      )}
      <details className={rendered ? 'mt-2' : ''}>
        <summary className="text-xs cursor-pointer" style={{ color: 'var(--fg-dim)' }}>View Mermaid source</summary>
        <pre
          className="text-xs whitespace-pre-wrap font-mono leading-relaxed mt-1 p-3 rounded-md"
          style={{ color: 'var(--fg-secondary)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
        >
          {content}
        </pre>
      </details>
    </div>
  );
};

/** LaTeX source preview — shows syntax-highlighted LaTeX with structural overview */
const LatexPreview: React.FC<{ content: string }> = ({ content }) => {
  const [showRendered, setShowRendered] = useState(true);

  // Extract a simple structural overview from LaTeX
  const lines = content.split('\n');
  const sections: Array<{ level: number; text: string; line: number }> = [];
  let hasDocumentEnv = false;
  let hasPreamble = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('\\documentclass')) hasPreamble = true;
    if (trimmed.startsWith('\\begin{document}')) hasDocumentEnv = true;
    
    const sectionMatch = trimmed.match(/^\\(section|subsection|subsubsection|paragraph)\*?\{(.+)\}$/);
    if (sectionMatch) {
      const levelMap: Record<string, number> = { section: 1, subsection: 2, subsubsection: 3, paragraph: 4 };
      sections.push({ level: levelMap[sectionMatch[1]] || 1, text: sectionMatch[2], line: i });
    }
  }

  // Simple syntax highlighting for LaTeX
  const highlightLatex = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let keyIdx = 0;

      while (remaining.length > 0) {
        // LaTeX command
        const cmdMatch = remaining.match(/^(\\[a-zA-Z]+)/);
        if (cmdMatch) {
          parts.push(<span key={keyIdx++} style={{ color: '#C4A265' }}>{cmdMatch[1]}</span>);
          remaining = remaining.slice(cmdMatch[1].length);
          // Command argument in braces
          if (remaining.startsWith('{')) {
            let depth = 0;
            let arg = '';
            for (const ch of remaining) {
              if (ch === '{') depth++;
              if (ch === '}') depth--;
              arg += ch;
              if (depth === 0) break;
            }
            parts.push(<span key={keyIdx++} style={{ color: '#71717a' }}>{'{ '}</span>);
            parts.push(<span key={keyIdx++} style={{ color: 'var(--fg-primary, #e4e4e7)' }}>{arg.slice(1, -1)}</span>);
            parts.push(<span key={keyIdx++} style={{ color: '#71717a' }}>{' }'}</span>);
            remaining = remaining.slice(arg.length);
          }
          continue;
        }

        // Comment
        if (remaining.startsWith('%')) {
          parts.push(<span key={keyIdx++} style={{ color: '#6b7280', fontStyle: 'italic' }}>{remaining}</span>);
          remaining = '';
          continue;
        }

        // Math mode $...$
        const mathMatch = remaining.match(/^(\$[^$]+\$)/);
        if (mathMatch) {
          parts.push(<span key={keyIdx++} style={{ color: '#82aaff' }}>{mathMatch[1]}</span>);
          remaining = remaining.slice(mathMatch[1].length);
          continue;
        }

        // Special characters
        if (['{', '}'].includes(remaining[0])) {
          parts.push(<span key={keyIdx++} style={{ color: '#71717a' }}>{remaining[0]}</span>);
          remaining = remaining.slice(1);
          continue;
        }

        if (remaining[0] === '[' || remaining[0] === ']') {
          parts.push(<span key={keyIdx++} style={{ color: '#c084fc' }}>{remaining[0]}</span>);
          remaining = remaining.slice(1);
          continue;
        }

        // Regular text - consume until we hit a special character
        const textMatch = remaining.match(/^[^\\%${}\[\]]+/);
        if (textMatch) {
          parts.push(<span key={keyIdx++}>{textMatch[0]}</span>);
          remaining = remaining.slice(textMatch[0].length);
          continue;
        }

        // Fallback: single character
        parts.push(<span key={keyIdx++}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }

      result.push(<div key={i}>{parts.length > 0 ? parts : ' '}</div>);
    }

    return result;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toggle between rendered view and source */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: 'var(--border-default, #27272a)' }}>
        <button
          type="button"
          className={`text-xs px-2 py-1 rounded transition-colors cursor-pointer ${showRendered ? 'font-semibold' : ''}`}
          style={{
            color: showRendered ? 'var(--accent-primary, #C4A265)' : 'var(--fg-dim, #71717a)',
            backgroundColor: showRendered ? 'var(--bg-secondary)' : 'transparent',
          }}
          onClick={() => setShowRendered(true)}
        >
          Structure
        </button>
        <button
          type="button"
          className={`text-xs px-2 py-1 rounded transition-colors cursor-pointer ${!showRendered ? 'font-semibold' : ''}`}
          style={{
            color: !showRendered ? 'var(--accent-primary, #C4A265)' : 'var(--fg-dim, #71717a)',
            backgroundColor: !showRendered ? 'var(--bg-secondary)' : 'transparent',
          }}
          onClick={() => setShowRendered(false)}
        >
          Source
        </button>
        <span className="text-xs ml-auto" style={{ color: 'var(--fg-dim, #71717a)' }}>
          LaTeX
        </span>
      </div>

      {showRendered ? (
        <div className="space-y-1">
          {/* Document info */}
          {hasPreamble && (
            <div className="text-xs mb-2 px-2 py-1 rounded" style={{ color: 'var(--fg-dim, #71717a)', backgroundColor: 'var(--bg-secondary)' }}>
              Complete LaTeX document with preamble
            </div>
          )}
          {/* Structural outline */}
          {sections.length > 0 ? (
            <div className="space-y-0.5">
              {sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="text-xs py-0.5"
                  style={{
                    paddingLeft: `${(sec.level - 1) * 12 + 4}px`,
                    color: sec.level === 1 ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                    fontWeight: sec.level <= 2 ? 600 : 400,
                  }}
                >
                  {sec.text}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs" style={{ color: 'var(--fg-dim, #71717a)' }}>
              No sections detected — this may be a LaTeX fragment or use custom structure.
            </div>
          )}
          <details className="mt-2">
            <summary className="text-xs cursor-pointer" style={{ color: 'var(--fg-dim)' }}>View full rendered preview</summary>
            <div className="mt-1 p-2 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--fg-secondary)' }}>
              {highlightLatex(content)}
            </div>
          </details>
        </div>
      ) : (
        <div className="text-xs font-mono leading-relaxed p-2 rounded overflow-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {highlightLatex(content)}
        </div>
      )}
    </div>
  );
};

export default ExportPreview;
