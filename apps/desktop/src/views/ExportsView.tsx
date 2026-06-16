import React, { useEffect, useState, useCallback } from 'react';
import { Download, ExternalLink, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { ScribbleLoader } from '../components/feedback/ScribbleLoader';

interface ExportEntry {
  id: string;
  format: string;
  outputPath: string;
  createdAt: number;
  fileSize: number;
}

/**
 * ExportsView — Shows export history with open-in-system-viewer capability.
 * Surface: 'exports'
 */
export const ExportsView: React.FC = () => {
  const [exports, setExports] = useState<ExportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExports() {
      try {
        const result = await window.papyrus?.getExports() || [];
        setExports(result);
      } catch {
        setExports([]);
      } finally {
        setLoading(false);
      }
    }
    loadExports();
  }, []);

  const handleOpenExport = useCallback(async (outputPath: string) => {
    try {
      await window.papyrus?.openExport(outputPath);
    } catch (error) {
      toast.error('Failed to open export');
    }
  }, []);

  const handleOpenFolder = useCallback(async (outputPath: string) => {
    try {
      await window.papyrus?.showExportInFolder(outputPath);
    } catch (error) {
      toast.error('Failed to open folder');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <ScribbleLoader size="md" />
      </div>
    );
  }

  if (exports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Download size={48} className="text-foreground-dim mb-4" />
        <h3 className="text-lg font-medium text-foreground">No exports yet</h3>
        <p className="text-sm text-foreground-muted mt-1">
          Transform documents to PDF to see them listed here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <Download size={20} className="text-accent" />
        <h1 className="text-xl font-semibold text-foreground">Exports</h1>
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {exports.map((exp) => (
          <div key={exp.id} className="p-3 rounded-lg border border-border bg-card hover:bg-hover transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <span className={
                `format-badge ${exp.format === 'pdf' ? 'format-badge--pdf' : ''} ${exp.format === 'md' ? 'format-badge--md' : ''}`
              }>
                {exp.format}
              </span>
              <span className="text-sm text-foreground-secondary truncate flex-1">
                {exp.outputPath}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-foreground-dim">
                <span>{formatFileSize(exp.fileSize)}</span>
                <span>{new Date(exp.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="flex items-center gap-1 px-2 py-1 text-xs text-foreground-muted hover:text-accent hover:bg-accent-muted rounded transition-colors"
                  onClick={() => handleOpenExport(exp.outputPath)}
                >
                  <ExternalLink size={12} />
                  Open
                </button>
                <button
                  className="flex items-center gap-1 px-2 py-1 text-xs text-foreground-muted hover:text-foreground hover:bg-hover rounded transition-colors"
                  onClick={() => handleOpenFolder(exp.outputPath)}
                >
                  <FolderOpen size={12} />
                  Show in Folder
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
