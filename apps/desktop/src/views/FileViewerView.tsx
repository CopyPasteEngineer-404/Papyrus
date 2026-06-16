import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWorkspaceStore } from '../stores/workspace';
import { Eye, Maximize2, Columns, ZoomIn, FileText, Table2, FileCode, File, Loader2, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

/** View mode for the file viewer */
type ViewMode = 'panel' | 'fullscreen' | 'enhanced';

/** File type categories */
type FileCategory = 'csv' | 'pdf' | 'html' | 'docx' | 'mermaid' | 'markdown' | 'text' | 'latex' | 'unknown';

/** Determine file category from extension */
function getFileCategory(fileName: string): FileCategory {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'csv') return 'csv';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'mmd' || ext === 'mermaid') return 'mermaid';
  if (ext === 'md' || ext === 'markdown') return 'markdown';
  if (ext === 'tex' || ext === 'latex') return 'latex';
  if (ext === 'txt' || ext === 'text' || ext === 'json' || ext === 'js' || ext === 'ts' || ext === 'css' || ext === 'xml' || ext === 'yaml' || ext === 'yml') return 'text';
  return 'unknown';
}

/** Get icon for file category */
function getCategoryIcon(cat: FileCategory) {
  switch (cat) {
    case 'csv': return Table2;
    case 'pdf': return File;
    case 'html': return FileCode;
    case 'docx': return File;
    case 'mermaid': return FileCode;
    case 'markdown': return FileText;
    case 'latex': return FileCode;
    case 'text': return FileText;
    default: return FileText;
  }
}

export const FileViewerView: React.FC = () => {
  const workspace = useWorkspaceStore();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('panel');
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const filePickerRef = useRef<HTMLDivElement>(null);

  // All files from workspace
  const files = workspace.files;

  // Currently selected file object
  const selectedFile = useMemo(
    () => files.find(f => f.id === selectedFileId) || null,
    [files, selectedFileId]
  );

  // File category
  const category = selectedFile ? getFileCategory(selectedFile.name) : 'unknown';

  // Load file content when selection changes
  useEffect(() => {
    if (!selectedFile) {
      setContent(null);
      setError(null);
      return;
    }

    // PDF and DOCX: skip text content loading
    if (category === 'pdf' || category === 'docx') {
      setContent(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    window.papyrus?.readFileContent(selectedFile.path)
      .then((result: string) => {
        setContent(result);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to read file');
        setLoading(false);
      });
  }, [selectedFile, category]);

  // Close file picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filePickerRef.current && !filePickerRef.current.contains(e.target as Node)) {
        setFilePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No workspace
  if (!workspace.currentPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <Eye size={48} style={{ color: 'var(--fg-dim, #71717a)' }} />
        <h3 className="text-lg font-medium mt-4" style={{ color: 'var(--fg-primary)' }}>No workspace open</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
          Open a workspace to browse and view files
        </p>
      </div>
    );
  }

  // No files
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <FileText size={48} style={{ color: 'var(--fg-dim, #71717a)' }} />
        <h3 className="text-lg font-medium mt-4" style={{ color: 'var(--fg-primary)' }}>No files in workspace</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
          Import files to start viewing them
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar with file picker and view mode toggles */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border-default, #27272a)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          {/* File picker dropdown */}
          <div className="relative" ref={filePickerRef}>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--bg-hover, #27272a)',
                color: 'var(--fg-primary)',
                border: '1px solid var(--border-default, #27272a)',
              }}
              onClick={() => setFilePickerOpen(prev => !prev)}
            >
              {selectedFile ? (
                <>
                  {React.createElement(getCategoryIcon(category), { size: 14, style: { color: 'var(--accent-primary)' } })}
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                </>
              ) : (
                <>
                  <Eye size={14} style={{ color: 'var(--fg-dim)' }} />
                  <span>Select a file...</span>
                </>
              )}
              <ChevronDown size={12} style={{ color: 'var(--fg-dim)' }} />
            </button>

            {filePickerOpen && (
              <div
                className="absolute top-full left-0 mt-1 z-50 w-64 max-h-64 overflow-y-auto rounded-md shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-card, #1f1f26)',
                  border: '1px solid var(--border-default, #27272a)',
                }}
              >
                {files.map(file => {
                  const cat = getFileCategory(file.name);
                  const IconComp = getCategoryIcon(cat);
                  return (
                    <button
                      key={file.id}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-hover transition-colors"
                      style={{
                        backgroundColor: selectedFileId === file.id ? 'var(--accent-primary-muted)' : 'transparent',
                        color: selectedFileId === file.id ? 'var(--accent-primary)' : 'var(--fg-secondary)',
                      }}
                      onClick={() => {
                        setSelectedFileId(file.id);
                        setFilePickerOpen(false);
                      }}
                    >
                      <IconComp size={14} style={{ flexShrink: 0 }} />
                      <span className="truncate">{file.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* View mode toggles */}
        <div className="flex items-center gap-1">
          <span className="text-xs mr-2" style={{ color: 'var(--fg-dim)' }}>View:</span>
          {([
            { mode: 'panel' as ViewMode, icon: Columns, label: 'Panel' },
            { mode: 'fullscreen' as ViewMode, icon: Maximize2, label: 'Full Screen' },
            { mode: 'enhanced' as ViewMode, icon: ZoomIn, label: 'Enhanced' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors"
              style={{
                backgroundColor: viewMode === mode ? 'var(--accent-primary-muted)' : 'transparent',
                color: viewMode === mode ? 'var(--accent-primary)' : 'var(--fg-dim)',
                border: viewMode === mode ? '1px solid var(--accent-primary)' : '1px solid transparent',
              }}
              onClick={() => setViewMode(mode)}
              title={label}
            >
              <Icon size={12} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File viewer content */}
      <div className="flex-1 min-h-0 overflow-hidden" style={{
        ...(viewMode === 'enhanced' ? { transform: 'scale(1.25)', transformOrigin: 'top left' } : {}),
      }}>
        {!selectedFile && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Eye size={40} style={{ color: 'var(--fg-dim, #71717a)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--fg-dim, #71717a)' }}>
              Select a file to view its contents
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <AlertTriangle size={24} style={{ color: 'var(--status-error, #ef4444)' }} />
            <p className="text-sm" style={{ color: 'var(--status-error, #ef4444)' }}>{error}</p>
          </div>
        )}

        {selectedFile && !loading && !error && (
          <div className={`h-full overflow-y-auto overflow-x-hidden p-4 ${viewMode === 'fullscreen' ? '' : ''}`}>
            {category === 'csv' && content && <CsvViewer content={content} />}
            {category === 'pdf' && <PdfViewer filePath={selectedFile.path} />}
            {category === 'html' && content && <HtmlViewer content={content} />}
            {category === 'docx' && <DocxViewer />}
            {category === 'mermaid' && content && <MermaidViewer content={content} />}
            {category === 'markdown' && content && <MarkdownViewer content={content} />}
            {category === 'latex' && content && <LatexViewer content={content} />}
            {category === 'text' && content && <TextViewer content={content} fileName={selectedFile.name} />}
            {category === 'unknown' && content && <TextViewer content={content} fileName={selectedFile.name} />}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── CSV Viewer ────────────────────────────────────────────────────────────────

const CsvViewer: React.FC<{ content: string }> = ({ content }) => {
  const rows = content.trim().split('\n').map(row =>
    row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
  );
  if (rows.length === 0) return <p style={{ color: 'var(--fg-dim)' }}>Empty CSV file</p>;

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold border-b"
                style={{
                  borderColor: 'var(--border-default)',
                  color: 'var(--accent-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.slice(0, 100).map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-hover transition-colors">
              {headers.map((_, colIdx) => (
                <td
                  key={colIdx}
                  className="px-3 py-2 border-b text-sm"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--fg-secondary)' }}
                >
                  {row[colIdx] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {dataRows.length > 100 && (
        <p className="text-xs mt-2" style={{ color: 'var(--fg-dim)' }}>
          Showing 100 of {dataRows.length} rows
        </p>
      )}
    </div>
  );
};

// ─── PDF Viewer ────────────────────────────────────────────────────────────────

const PdfViewer: React.FC<{ filePath: string }> = ({ filePath }) => {
  // In Electron, we can use an iframe with a file:// URL or object tag
  // Since contextIsolation is on, we use a blob approach or show a message
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <object
          data={`file://${filePath}`}
          type="application/pdf"
          className="w-full h-full"
          style={{ minHeight: '500px' }}
        >
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <File size={48} style={{ color: 'var(--fg-dim)' }} />
            <p className="text-sm mt-4" style={{ color: 'var(--fg-dim)' }}>
              PDF preview requires opening in an external viewer.
            </p>
            <button
              className="mt-3 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
              }}
              onClick={() => {
                window.papyrus?.openExport(filePath).catch(() => {});
              }}
            >
              Open in System Viewer
            </button>
          </div>
        </object>
      </div>
    </div>
  );
};

// ─── HTML Viewer ────────────────────────────────────────────────────────────────

const HtmlViewer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="flex flex-col h-full">
      <iframe
        srcDoc={content}
        className="w-full flex-1 border-0 rounded-md"
        style={{ minHeight: '400px', backgroundColor: '#fff' }}
        title="HTML Preview"
        sandbox="allow-scripts"
      />
      <details className="mt-2">
        <summary className="text-xs cursor-pointer" style={{ color: 'var(--fg-dim)' }}>View HTML source</summary>
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

// ─── DOCX Viewer ────────────────────────────────────────────────────────────────

const DocxViewer: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <File size={48} style={{ color: 'var(--fg-dim)' }} />
      <p className="text-sm mt-4" style={{ color: 'var(--fg-dim)' }}>
        DOC/DOCX files cannot be previewed inline.
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--fg-dim)' }}>
        Open the file externally to view its contents.
      </p>
    </div>
  );
};

// ─── Mermaid Viewer ────────────────────────────────────────────────────────────────

const MermaidViewer: React.FC<{ content: string }> = ({ content }) => {
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

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

// ─── Markdown Viewer ────────────────────────────────────────────────────────────────

const MarkdownViewer: React.FC<{ content: string }> = ({ content }) => {
  const elements = useMemo(() => {
    const lines = content.split('\n');
    const els: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        els.push(<h3 key={i} className="text-sm font-bold mt-3 mb-1" style={{ color: 'var(--fg-primary)' }}>{trimmed.slice(4)}</h3>);
        i++; continue;
      }
      if (trimmed.startsWith('## ')) {
        els.push(<h2 key={i} className="text-base font-bold mt-4 mb-1" style={{ color: 'var(--fg-primary)' }}>{trimmed.slice(3)}</h2>);
        i++; continue;
      }
      if (trimmed.startsWith('# ')) {
        els.push(<h1 key={i} className="text-lg font-bold mt-5 mb-2" style={{ color: 'var(--fg-primary)' }}>{trimmed.slice(2)}</h1>);
        i++; continue;
      }

      if (trimmed === '---' || trimmed === '***') {
        els.push(<hr key={i} className="my-3" style={{ borderColor: 'var(--border-default)' }} />);
        i++; continue;
      }

      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++;
        els.push(
          <div key={`code-${i}`} className="my-2 p-3 rounded-md text-xs font-mono overflow-x-auto" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--fg-secondary)', border: '1px solid var(--border-default)' }}>
            {lang && <div className="text-xs mb-1 font-sans" style={{ color: 'var(--fg-dim)' }}>{lang}</div>}
            <pre className="whitespace-pre-wrap">{codeLines.join('\n')}</pre>
          </div>
        );
        continue;
      }

      if (trimmed.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+[-|\s:]*$/.test(lines[i + 1].trim())) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().includes('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        els.push(<MarkdownTable key={`table-${i}`} rawLines={tableLines} />);
        continue;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        els.push(<div key={i} className="pl-4 py-0.5 text-sm">• {trimmed.slice(2)}</div>);
        i++; continue;
      }

      const numMatch = trimmed.match(/^(\d+)\.\s/);
      if (numMatch) {
        els.push(<div key={i} className="pl-4 py-0.5 text-sm">{trimmed}</div>);
        i++; continue;
      }

      if (trimmed === '') {
        els.push(<div key={i} className="h-2" />);
        i++; continue;
      }

      els.push(<p key={i} className="py-0.5 text-sm leading-relaxed" style={{ color: 'var(--fg-secondary)' }}>{trimmed}</p>);
      i++;
    }

    return els;
  }, [content]);

  return (
    <div className="prose-papyrus">
      {elements}
    </div>
  );
};

/** Markdown table renderer */
const MarkdownTable: React.FC<{ rawLines: string[] }> = ({ rawLines }) => {
  if (rawLines.length < 2) return null;

  const parseRow = (line: string) =>
    line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());

  const headers = parseRow(rawLines[0]);
  const dataRows = rawLines.slice(2).map(parseRow);

  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {headers.map((header, ci) => (
              <th
                key={ci}
                className="px-3 py-2 text-left font-semibold border-b"
                style={{ borderColor: 'var(--border-default)', color: 'var(--accent-primary)', backgroundColor: 'var(--bg-secondary)' }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} className="hover:bg-hover transition-colors">
              {headers.map((_, ci) => (
                <td key={ci} className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)', color: 'var(--fg-secondary)' }}>
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

// ─── LaTeX Viewer ────────────────────────────────────────────────────────────────

const LatexViewer: React.FC<{ content: string }> = ({ content }) => {
  const [viewMode, setViewMode] = useState<'structure' | 'source'>('structure');

  // Extract document structure
  const lines = content.split('\n');
  const sections: Array<{ level: number; text: string }> = [];
  const packages: string[] = [];
  let hasDocumentEnv = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('\\documentclass')) hasDocumentEnv = true;
    if (trimmed.startsWith('\\begin{document}')) hasDocumentEnv = true;

    // Extract packages
    const pkgMatch = trimmed.match(/^\\usepackage(?:\[.*?\])?\{([^}]+)\}/);
    if (pkgMatch) packages.push(pkgMatch[1]);

    // Extract sections
    const secMatch = trimmed.match(/^\\(section|subsection|subsubsection|paragraph)\*?\{(.+)\}$/);
    if (secMatch) {
      const levelMap: Record<string, number> = { section: 1, subsection: 2, subsubsection: 3, paragraph: 4 };
      sections.push({ level: levelMap[secMatch[1]] || 1, text: secMatch[2] });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with view mode toggle */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <button
          className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'structure' ? 'font-semibold' : ''}`}
          style={{
            color: viewMode === 'structure' ? 'var(--accent-primary)' : 'var(--fg-dim)',
            backgroundColor: viewMode === 'structure' ? 'var(--accent-primary-muted)' : 'transparent',
            border: viewMode === 'structure' ? '1px solid var(--accent-primary)' : '1px solid transparent',
          }}
          onClick={() => setViewMode('structure')}
        >
          Document Structure
        </button>
        <button
          className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'source' ? 'font-semibold' : ''}`}
          style={{
            color: viewMode === 'source' ? 'var(--accent-primary)' : 'var(--fg-dim)',
            backgroundColor: viewMode === 'source' ? 'var(--accent-primary-muted)' : 'transparent',
            border: viewMode === 'source' ? '1px solid var(--accent-primary)' : '1px solid transparent',
          }}
          onClick={() => setViewMode('source')}
        >
          Source Code
        </button>
        <span className="text-xs ml-auto" style={{ color: 'var(--fg-dim)' }}>
          {hasDocumentEnv ? 'LaTeX Document' : 'LaTeX Fragment'}
        </span>
      </div>

      {viewMode === 'structure' ? (
        <div className="space-y-3">
          {/* Document metadata */}
          {packages.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--accent-primary)' }}>Packages</h4>
              <div className="flex flex-wrap gap-1">
                {packages.map((pkg, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--fg-secondary)', border: '1px solid var(--border-default)' }}>
                    {pkg}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Document outline */}
          {sections.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>Document Outline</h4>
              <div className="space-y-0.5">
                {sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="text-sm py-0.5 cursor-pointer hover:bg-hover transition-colors rounded px-1"
                    style={{
                      paddingLeft: `${(sec.level - 1) * 16 + 8}px`,
                      color: sec.level === 1 ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                      fontWeight: sec.level <= 2 ? 600 : 400,
                    }}
                  >
                    {sec.text}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--fg-dim)' }}>
              No sections detected. This may be a LaTeX fragment or use custom structure.
            </p>
          )}

          <details>
            <summary className="text-xs cursor-pointer" style={{ color: 'var(--fg-dim)' }}>View LaTeX source</summary>
            <pre
              className="text-xs whitespace-pre-wrap font-mono leading-relaxed mt-2 p-3 rounded-md"
              style={{ color: 'var(--fg-secondary)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)', maxHeight: '400px', overflow: 'auto' }}
            >
              {content}
            </pre>
          </details>
        </div>
      ) : (
        <pre
          className="text-sm whitespace-pre-wrap font-mono leading-relaxed p-4 rounded-md flex-1 overflow-auto"
          style={{
            color: 'var(--fg-secondary)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          {content}
        </pre>
      )}
    </div>
  );
};

// ─── Text Viewer ────────────────────────────────────────────────────────────────

const TextViewer: React.FC<{ content: string; fileName: string }> = ({ content, fileName }) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isCode = ['js', 'ts', 'jsx', 'tsx', 'json', 'css', 'scss', 'xml', 'yaml', 'yml', 'py', 'rb', 'go', 'rs'].includes(ext);

  return (
    <div className="flex flex-col h-full">
      {isCode && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}>
            {ext.toUpperCase()}
          </span>
        </div>
      )}
      <pre
        className="text-sm whitespace-pre-wrap font-mono leading-relaxed p-4 rounded-md flex-1 overflow-auto"
        style={{
          color: 'var(--fg-secondary)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        {content}
      </pre>
    </div>
  );
};
