import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileCard } from '@papyrus/ui';
import { useWorkspaceStore } from '../stores/workspace';
import { useSearchStore } from '../stores/search';
import { useWorkflowStore } from '../stores/workflow';
import { useTaskStore } from '../stores/task';
import { FolderOpen, FileText, FileSpreadsheet, GitBranch, ArrowRight, CheckCircle, Eye, Columns, RefreshCw, PlusCircle, FileInput, FolderInput, XCircle, BookOpen, Edit3, X, LogOut, FileCode } from 'lucide-react';
import WorkspaceTree from '../components/workspace/WorkspaceTree';
import ExportPreview from '../components/workspace/ExportPreview';
import FileEditor from '../components/workspace/FileEditor';
import { toast } from 'sonner';

/** Supported file types for conversion */
const SUPPORTED_FILE_TYPES = [
  { ext: '.md', name: 'Markdown', icon: FileText, color: '#C4A265' },
  { ext: '.csv', name: 'CSV', icon: FileSpreadsheet, color: '#A68B4B' },
  { ext: '.mmd', name: 'Mermaid', icon: GitBranch, color: '#D4B87A' },
  { ext: '.mermaid', name: 'Mermaid', icon: GitBranch, color: '#D4B87A' },
  { ext: '.txt', name: 'Text', icon: FileText, color: '#71717a' },
  { ext: '.html', name: 'HTML', icon: FileText, color: '#2C7DA0' },
  { ext: '.docx', name: 'Word Document', icon: FileText, color: '#2b5797' },
  { ext: '.tex', name: 'LaTeX', icon: FileCode, color: '#8B5CF6' },
  { ext: '.latex', name: 'LaTeX', icon: FileCode, color: '#8B5CF6' },
];

/** Conversion pipeline stages for live status display */
const CONVERSION_STAGES = [
  { key: 'starting', label: 'Source', desc: 'Reading input file' },
  { key: 'parsing', label: 'Parse & IR', desc: 'Parsing to intermediate representation' },
  { key: 'ir-building', label: 'Pipeline', desc: 'Applying transformations' },
  { key: 'worker-execution', label: 'Workers', desc: 'Executing export workers' },
  { key: 'exporting', label: 'Export', desc: 'Writing output files' },
];

/** Static flow stages for the no-workspace welcome screen */
const FLOW_STAGES = [
  { label: 'Source', desc: 'Input file' },
  { label: 'Parse & IR', desc: 'Parse to intermediate representation' },
  { label: 'Pipeline', desc: 'Apply transformations' },
  { label: 'Export', desc: 'Generate output format' },
];

/** Map progress percentage to pipeline phase index */
function getActiveStageIndex(percentComplete: number): number {
  if (percentComplete <= 0) return 0;
  if (percentComplete <= 15) return 1; // parsing
  if (percentComplete <= 30) return 2; // ir-building
  if (percentComplete <= 60) return 3; // worker-execution
  if (percentComplete <= 90) return 4; // exporting
  return 5; // complete
}

// ─── Live Conversion Flow Panel ───

interface ConversionFlowPanelProps {
  percentComplete: number;
  isDone: boolean;
  isFailed: boolean;
  errorMessage?: string;
  fileName?: string;
  outputFormats?: string[];
  onCancel?: () => void;
  isExecuting: boolean;
}

const ConversionFlowPanel: React.FC<ConversionFlowPanelProps> = ({
  percentComplete,
  isDone,
  isFailed,
  errorMessage,
  fileName,
  outputFormats,
  onCancel,
  isExecuting,
}) => {
  if (isDone) {
    return (
      <div
        className="flex flex-col items-center gap-3 p-4 rounded-lg"
        style={{ backgroundColor: 'var(--status-success-muted, rgba(16, 185, 129, 0.15))', border: '1px solid var(--status-success, #10b981)' }}
      >
        <CheckCircle size={32} style={{ color: 'var(--status-success, #10b981)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--status-success, #10b981)' }}>
          Done
        </span>
        {outputFormats && outputFormats.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
            Exported as {outputFormats.join(', ').toUpperCase()}
          </span>
        )}
      </div>
    );
  }

  if (isFailed) {
    return (
      <div
        className="flex flex-col items-center gap-3 p-4 rounded-lg"
        style={{ backgroundColor: 'var(--status-error-muted, rgba(239, 68, 68, 0.15))', border: '1px solid var(--status-error, #ef4444)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--status-error, #ef4444)' }}>
          Failed
        </span>
        {errorMessage && (
          <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>{errorMessage}</span>
        )}
      </div>
    );
  }

  const activeIndex = getActiveStageIndex(percentComplete);

  return (
    <div className="flex flex-col gap-2">
      {/* Header with Cancel button */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold" style={{ color: 'var(--fg-muted)' }}>
          Converting{fileName ? `: ${fileName}` : '...'}
        </span>
        <span className="text-xs ml-auto font-mono" style={{ color: 'var(--accent-primary, #C4A265)' }} aria-live="polite" aria-atomic="true">
          {percentComplete}%
        </span>
      </div>

      {/* Pipeline stages */}
      <div className="flex flex-col gap-1">
        {CONVERSION_STAGES.map((stage, i) => {
          const isActive = i === activeIndex;
          const isCompleted = i < activeIndex;

          return (
            <div
              key={stage.key}
              className="flex items-center gap-2 px-3 py-2 rounded-md transition-all"
              style={{
                backgroundColor: isActive
                  ? 'var(--status-success-muted, rgba(16, 185, 129, 0.15))'
                  : isCompleted
                    ? 'var(--status-success-muted, rgba(16, 185, 129, 0.08))'
                    : 'var(--bg-secondary, #18181b)',
                border: isActive
                  ? '1px solid var(--status-success, #10b981)'
                  : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid var(--border-default, #27272a)',
              }}
            >
              {isCompleted ? (
                <CheckCircle size={14} style={{ color: 'var(--status-success, #10b981)', flexShrink: 0 }} />
              ) : isActive ? (
                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--status-success, #10b981)', animation: 'pulse-ring 1.5s ease-out infinite' }} />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--bg-muted, #3f3f46)' }} />
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-semibold truncate" style={{ color: isActive || isCompleted ? 'var(--status-success, #10b981)' : 'var(--fg-dim, #71717a)' }}>
                  {stage.label}
                </span>
                <span className="text-xs truncate" style={{ color: 'var(--fg-dim, #71717a)' }}>
                  {stage.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Export button */}
      {isExecuting && onCancel && (
        <button
          className="mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'var(--status-error-muted, rgba(239, 68, 68, 0.15))',
            color: 'var(--status-error, #ef4444)',
            border: '1px solid var(--status-error, #ef4444)',
          }}
          onClick={onCancel}
        >
          <XCircle size={14} />
          Cancel Export
        </button>
      )}
    </div>
  );
};


export const WorkspaceView: React.FC = () => {
  const workspace = useWorkspaceStore();
  const search = useSearchStore();
  const workflow = useWorkflowStore();
  const taskStore = useTaskStore();

  // Track conversion state
  const [conversionDone, setConversionDone] = useState(false);
  const [conversionFailed, setConversionFailed] = useState(false);
  const [conversionError, setConversionError] = useState<string | undefined>();
  // Track preview state
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [showTree, setShowTree] = useState(false);
  // Resizable preview panel width
  const [previewWidth, setPreviewWidth] = useState(420);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  // File editor state
  const [editingFile, setEditingFile] = useState<{ id: string; path: string; name: string } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = previewWidth;

    const handleDragMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartX.current - moveEvent.clientX;
      const newWidth = Math.min(600, Math.max(280, dragStartWidth.current + delta));
      setPreviewWidth(newWidth);
    };

    const handleDragEnd = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [previewWidth]);

  // Export files from the exports/ directory
  const [exportFiles, setExportFiles] = useState<Array<{ id: string; name: string; path: string; format: string; size: number; modifiedAt: number }>>([]);

  // Load export files when workspace is set
  const loadExportFiles = useCallback(async () => {
    try {
      const exports = await window.papyrus?.getExports() || [];
      setExportFiles(exports.map((exp: any) => ({
        id: exp.id,
        name: exp.outputPath?.split(/[/\\]/).pop() || exp.outputPath || 'Unknown',
        path: exp.outputPath || '',
        format: exp.format || 'unknown',
        size: exp.fileSize || 0,
        modifiedAt: exp.createdAt || Date.now(),
      })));
    } catch {
      setExportFiles([]);
    }
  }, []);

  // Listen for task completion/failure for local UI state
  // Note: We use a dedicated event to avoid duplicate toasts that would
  // otherwise fire from both providers.tsx AND this component.
  useEffect(() => {
    const handleCompleted = () => {
      setConversionDone(true);
      setConversionFailed(false);
      loadExportFiles();
    };

    const handleFailed = (_data: any) => {
      setConversionFailed(true);
      setConversionDone(false);
      setConversionError(_data?.error || 'Conversion failed');
    };

    // Use the listenerMap-based on/off pattern from preload
    window.papyrus?.on('task:completed', handleCompleted);
    window.papyrus?.on('task:failed', handleFailed);

    return () => {
      window.papyrus?.removeListener('task:completed', handleCompleted);
      window.papyrus?.removeListener('task:failed', handleFailed);
    };
  }, [loadExportFiles]);

  // Reset conversion state when a new execution starts
  useEffect(() => {
    if (workflow.isExecuting) {
      setConversionDone(false);
      setConversionFailed(false);
      setConversionError(undefined);
    }
  }, [workflow.isExecuting]);

  // Auto-close conversion flow after completion (3 second delay)
  useEffect(() => {
    if (conversionDone) {
      const timer = setTimeout(() => {
        setConversionDone(false);
        setConversionFailed(false);
        setConversionError(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [conversionDone]);

  // Load exports on workspace change
  useEffect(() => {
    if (workspace.currentPath) {
      loadExportFiles();
    } else {
      // Clear export files when workspace is cleared (bug fix: no ghost data)
      setExportFiles([]);
    }
  }, [workspace.currentPath, loadExportFiles]);

  // Determine if we should show the conversion flow
  const isConverting = workflow.isExecuting || taskStore.isRunning;
  const showConversionFlow = isConverting || conversionDone || conversionFailed;

  // Get preview file object — only from current workspace files
  const previewFile = previewFileId
    ? workspace.files.find(f => f.id === previewFileId) || exportFiles.find(f => f.id === previewFileId) || null
    : null;

  const handleOpenWorkspace = useCallback(async () => {
    try {
      const result = await window.papyrus?.openWorkspace('');
      if (result) {
        workspace.setWorkspace(result.path, result.name);
        if (result.files && Array.isArray(result.files)) {
          workspace.setFiles(result.files.map((f: any) => ({
            id: f.id, name: f.name, path: f.path, format: f.format,
            size: f.size ?? 0, modifiedAt: f.modifiedAt || Date.now(),
          })));
        }
        workspace.setIndexed(true);
        workspace.setIndexing(false);
      }
    } catch (error) {
      console.error('Failed to open workspace:', error);
    }
  }, [workspace]);

  const handleNewWorkspace = useCallback(async () => {
    try {
      const result = await window.papyrus?.newWorkspace();
      if (result) {
        workspace.setWorkspace(result.path, result.name);
        if (result.files && Array.isArray(result.files)) {
          workspace.setFiles(result.files.map((f: any) => ({
            id: f.id, name: f.name, path: f.path, format: f.format,
            size: f.size ?? 0, modifiedAt: f.modifiedAt || Date.now(),
          })));
        }
        workspace.setIndexed(true);
        workspace.setIndexing(false);
        toast.success('New workspace created');
      }
    } catch (error) {
      toast.error('Failed to create workspace');
    }
  }, [workspace]);

  const handleOpenSampleWorkspace = useCallback(async () => {
    try {
      const result = await window.papyrus?.openSampleWorkspace();
      if (result) {
        workspace.setWorkspace(result.path, result.name);
        if (result.files && Array.isArray(result.files)) {
          workspace.setFiles(result.files.map((f: any) => ({
            id: f.id, name: f.name, path: f.path, format: f.format,
            size: f.size ?? 0, modifiedAt: f.modifiedAt || Date.now(),
          })));
        }
        workspace.setIndexed(true);
        workspace.setIndexing(false);
        toast.success('Sample workspace opened');
      }
    } catch (error: any) {
      toast.error('Failed to open sample workspace', { description: error?.message || 'Unknown error' });
    }
  }, [workspace]);

  const handleImportFiles = useCallback(async () => {
    try {
      const results = await window.papyrus?.importFiles() || [];
      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.filter((r: any) => !r.success).length;
      if (successCount > 0) {
        toast.success(`Imported ${successCount} file(s)`);
        // Re-index to pick up new files
        const reindexResult = await window.papyrus?.reindexWorkspace();
        if (reindexResult && reindexResult.files) {
          workspace.setFiles(reindexResult.files.map((f: any) => ({
            id: f.id, name: f.name, path: f.path, format: f.format,
            size: f.size ?? 0, modifiedAt: f.modifiedAt || Date.now(),
          })));
          workspace.setIndexed(true);
        }
      }
      if (failCount > 0) {
        toast.warning(`${failCount} file(s) could not be imported`);
      }
    } catch (error) {
      toast.error('Failed to import files');
    }
  }, [workspace]);

  const handleImportFolder = useCallback(async () => {
    try {
      const results = await window.papyrus?.importFolder() || [];
      const successCount = results.filter((r: any) => r.success).length;
      if (successCount > 0) {
        toast.success(`Imported ${successCount} file(s) from folder`);
        const reindexResult = await window.papyrus?.reindexWorkspace();
        if (reindexResult && reindexResult.files) {
          workspace.setFiles(reindexResult.files.map((f: any) => ({
            id: f.id, name: f.name, path: f.path, format: f.format,
            size: f.size ?? 0, modifiedAt: f.modifiedAt || Date.now(),
          })));
          workspace.setIndexed(true);
        }
      }
    } catch (error) {
      toast.error('Failed to import folder');
    }
  }, [workspace]);

  const handleCancelExport = useCallback(async () => {
    if (taskStore.activeTaskId) {
      try {
        await window.papyrus?.cancelTask(taskStore.activeTaskId);
        workflow.setExecuting(false);
        toast.info('Export cancelled');
      } catch (error) {
        console.error('Cancel failed:', error);
      }
    } else {
      workflow.setExecuting(false);
    }
  }, [taskStore.activeTaskId, workflow]);

  const handleFileSelect = useCallback((fileId: string) => {
    search.toggleFileSelection(fileId);
    if (!workflow.isPanelOpen) {
      workflow.openPanel();
    }
  }, [search, workflow]);

  const handleTreeFileSelect = useCallback((fileId: string) => {
    search.toggleFileSelection(fileId);
    if (!workflow.isPanelOpen) {
      workflow.openPanel();
    }
  }, [search, workflow]);

  const handlePreviewFile = useCallback((fileId: string) => {
    setPreviewFileId(prev => prev === fileId ? null : fileId);
  }, []);

  const handleEditFile = useCallback((fileId: string) => {
    const file = workspace.files.find(f => f.id === fileId);
    if (file) {
      setEditingFile({ id: file.id, path: file.path, name: file.name });
    }
  }, [workspace.files]);

  const handleCloseWorkspace = useCallback(async () => {
    try {
      const wsPath = workspace.currentPath;
      if (wsPath) {
        await window.papyrus?.deleteWorkspace(wsPath);
        workspace.removeWorkspace(wsPath);
        toast.success('Workspace closed');
      }
    } catch (error: any) {
      toast.error('Failed to close workspace', { description: error?.message || 'Unknown error' });
    }
  }, [workspace]);

  // ─── Bug Fix: When no workspace and no recent workspaces, show welcome ───
  // When currentPath is null, ALWAYS show the welcome screen (no ghost files)
  if (!workspace.currentPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <FolderOpen size={48} className="text-foreground-dim mb-4" />
        <h3 className="text-lg font-medium text-foreground">No workspace open</h3>
        <p className="text-sm text-foreground-muted mt-1 mb-6">
          Open a directory to browse and transform your documents
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-4">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
            onClick={handleOpenWorkspace}
          >
            <FolderOpen size={16} />
            Open Workspace
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-accent text-accent hover:bg-accent-muted rounded-lg text-sm font-medium transition-colors"
            onClick={handleNewWorkspace}
          >
            <PlusCircle size={16} />
            New Workspace
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-border hover:bg-hover rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--fg-muted)' }}
            onClick={handleOpenSampleWorkspace}
          >
            <BookOpen size={16} />
            Sample Workspace
          </button>
        </div>

        {/* Supported File Types */}
        <div className="mt-6 w-full max-w-md">
          <h4 className="text-sm font-semibold text-foreground mb-3">Supported File Types</h4>
          <div className="flex gap-4 justify-center">
            {SUPPORTED_FILE_TYPES.map((ft) => (
              <div
                key={ft.ext}
                className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <ft.icon size={20} style={{ color: ft.color }} />
                <span className="text-xs font-medium text-foreground">{ft.name}</span>
                <span className="text-xs text-foreground-muted">{ft.ext}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Flow Diagram */}
        <div className="mt-6 w-full max-w-lg">
          <h4 className="text-sm font-semibold text-foreground mb-3">Conversion Flow</h4>
          <div className="flex items-center justify-center gap-1">
            {FLOW_STAGES.map((stage, i) => (
              <React.Fragment key={stage.label}>
                <div
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[80px]"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <span className="text-xs font-semibold" style={{ color: '#C4A265' }}>{stage.label}</span>
                  <span className="text-xs text-foreground-muted text-center leading-tight">{stage.desc}</span>
                </div>
                {i < FLOW_STAGES.length - 1 && (
                  <ArrowRight size={14} className="text-foreground-dim flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Indexing in progress ───
  if (workspace.isIndexing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FolderOpen size={48} className="text-accent mb-4 animate-pulse" />
        <h3 className="text-lg font-medium text-foreground">Indexing workspace...</h3>
        <p className="text-sm text-foreground-muted mt-1">
          Scanning {workspace.name} for supported files
        </p>
        <p className="text-xs text-foreground-dim mt-2 font-mono">
          ({workspace.currentPath})
        </p>
      </div>
    );
  }

  // ─── No supported files found ───
  if (workspace.files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FileText size={48} className="text-foreground-dim mb-4" />
        <h3 className="text-lg font-medium text-foreground">No supported files found</h3>
        <p className="text-sm text-foreground-muted mt-1 mb-4">
          Import files or add supported documents to this workspace
        </p>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
            onClick={handleImportFiles}
          >
            <FileInput size={14} />
            Import Files
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 border border-border hover:bg-hover rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--fg-muted)' }}
            onClick={handleImportFolder}
          >
            <FolderInput size={14} />
            Import Folder
          </button>
        </div>
        <p className="text-xs text-foreground-dim mt-4 font-mono">
          ({workspace.currentPath})
        </p>
      </div>
    );
  }

  // ─── File Editor mode ───
  if (editingFile) {
    return (
      <div className="h-full">
        <FileEditor
          filePath={editingFile.path}
          fileName={editingFile.name}
          onClose={() => setEditingFile(null)}
        />
      </div>
    );
  }

  // ─── Workspace with files — tree + file grid + preview + conversion flow ───
  return (
    <div className="flex flex-col h-full">
      {/* Header with workspace name, path, action buttons */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <FolderOpen size={20} className="text-accent" />
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-foreground">{workspace.name}</h1>
            <span className="text-xs text-foreground-dim font-mono">
              ({workspace.currentPath})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground-muted bg-hover px-2 py-1 rounded-md">
            {workspace.files.length} files
          </span>
          {/* Import buttons */}
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-hover transition-colors"
            style={{ color: 'var(--accent-primary)' }}
            onClick={handleImportFiles}
            title="Import files into workspace"
          >
            <FileInput size={14} />
            Import
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-hover transition-colors"
            style={{ color: 'var(--fg-dim, #71717a)' }}
            onClick={handleImportFolder}
            title="Import folder into workspace"
          >
            <FolderInput size={14} />
            Folder
          </button>
          {/* Reindex button */}
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-hover transition-colors"
            onClick={async () => {
              try {
                const result = await window.papyrus?.reindexWorkspace();
                if (result && result.files) {
                  workspace.setFiles(result.files.map((f: any) => ({
                    id: f.id, name: f.name, path: f.path, format: f.format,
                    size: f.size ?? 0, modifiedAt: f.modifiedAt || Date.now(),
                  })));
                  workspace.setIndexed(true);
                }
              } catch (e) {
                console.error('Reindex failed:', e);
              }
            }}
            title="Refresh file list"
            aria-label="Refresh file list"
          >
            <RefreshCw size={14} style={{ color: 'var(--fg-dim, #71717a)' }} />
          </button>
          {/* Close workspace button */}
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-hover transition-colors"
            style={{ color: 'var(--status-error, #ef4444)' }}
            onClick={handleCloseWorkspace}
            title="Close workspace and remove from recent"
          >
            <LogOut size={14} />
            Close
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-hover transition-colors"
            style={{ color: showTree ? 'var(--accent-primary, #C4A265)' : 'var(--fg-dim, #71717a)' }}
            onClick={() => setShowTree(prev => !prev)}
            title={showTree ? 'Hide tree' : 'Show tree'}
          >
            <Columns size={14} />
            Tree
          </button>
        </div>
      </div>

      {/* Main content area — 3-column layout: tree | file grid | right panel */}
      <div className="flex flex-1 min-h-0 gap-0 relative">
        {/* Workspace Tree (left) */}
        <div
          className={`flex-shrink-0 border-r overflow-y-auto overflow-x-hidden transition-all duration-300 ${showTree ? 'w-56' : 'w-0'}`}
          style={{ borderColor: 'var(--border-default, #27272a)', overflow: showTree ? 'auto' : 'hidden' }}
        >
          {showTree && (
            <WorkspaceTree
              files={workspace.files}
              exportFiles={exportFiles}
              selectedFileIds={new Set(search.selectedFiles)}
              onFileSelect={handleTreeFileSelect}
            />
          )}
        </div>

        {/* File Grid (center) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2">
          <div className="grid grid-cols-1 gap-2">
            {workspace.files.map((file) => (
              <div key={file.id} className="relative group">
                <FileCard
                  file={{
                    id: file.id,
                    name: file.name,
                    path: file.path,
                    format: file.format,
                    size: file.size,
                    modifiedAt: file.modifiedAt,
                    snippet: '',
                  }}
                  selected={search.selectedFiles.includes(file.id)}
                  onSelect={handleFileSelect}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1 rounded bg-hover"
                    onClick={(e) => { e.stopPropagation(); handlePreviewFile(file.id); }}
                    aria-label="Preview file"
                  >
                    <Eye size={12} style={{ color: 'var(--fg-dim, #71717a)' }} />
                  </button>
                  <button
                    className="p-1 rounded bg-hover"
                    onClick={(e) => { e.stopPropagation(); handleEditFile(file.id); }}
                    aria-label="Edit file"
                  >
                    <Edit3 size={12} style={{ color: 'var(--fg-dim, #71717a)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Document Viewer + Conversion Flow */}
        {(previewFile || showConversionFlow) && (
          <div
            className="flex-shrink-0 border-l flex flex-col h-full relative"
            style={{
              width: previewWidth,
              borderColor: 'var(--border-default, #27272a)',
              overflow: 'hidden',
            }}
          >
            {/* Horizontal drag handle on the left edge — clearly visible, themed */}
            <div
              className="absolute left-0 top-0 bottom-0 z-10 cursor-col-resize group"
              style={{ width: 6 }}
              onMouseDown={handleDragStart}
              title="Drag to resize"
            >
              {/* Visible drag indicator line */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-150"
                style={{
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary, #C4A265)';
                  e.currentTarget.style.opacity = '0.6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              />
              {/* Center grip dots */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--accent-primary)' }}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                </div>
              </div>
            </div>

            {/* Document Viewer — own independent scrolling window */}
            {previewFile && (
              <div
                className="flex-1 min-h-0 flex flex-col"
                style={{
                  borderRight: 'none',
                  overflow: 'hidden',
                }}
              >
                {/* Document viewer with own vertical scrollbar */}
                <div
                  className="flex-1 min-h-0"
                  style={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    scrollbarGutter: 'stable',
                    scrollBehavior: 'smooth',
                  }}
                >
                  <ExportPreview
                    file={previewFile}
                    onClose={() => setPreviewFileId(null)}
                  />
                </div>
              </div>
            )}

            {/* Conversion Flow Panel */}
            {showConversionFlow && (
              <div className={`flex-shrink-0 p-3 ${previewFile ? 'border-t' : 'flex-1 overflow-auto'}`} style={{ borderColor: 'var(--border-default, #27272a)' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--fg-muted)' }}>
                  Conversion
                </h3>
                <ConversionFlowPanel
                  percentComplete={workflow.percentComplete}
                  isDone={conversionDone}
                  isFailed={conversionFailed}
                  errorMessage={conversionError}
                  fileName={taskStore.activeTaskId ? taskStore.tasks.find(t => t.id === taskStore.activeTaskId)?.sourceFiles?.[0]?.split(/[/\\]/).pop() : undefined}
                  outputFormats={workflow.selectedFormats}
                  onCancel={handleCancelExport}
                  isExecuting={isConverting}
                />
                {conversionDone && (
                  <button
                    className="mt-2 w-full px-3 py-1.5 text-xs rounded-md transition-colors"
                    style={{ backgroundColor: 'var(--status-success, #10b981)', color: 'white' }}
                    onClick={() => {
                      setConversionDone(false);
                      setConversionFailed(false);
                      setConversionError(undefined);
                    }}
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
