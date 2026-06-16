import React, { useState, useCallback } from 'react';
import { FileText, Table2, FileCode, ChevronRight, ChevronDown, FolderOpen, Folder, Download } from 'lucide-react';
import clsx from 'clsx';

/**
 * WorkspaceTree — File explorer tree organized by category.
 *
 * Categories:
 *   Documents  → .md files
 *   Tables     → .csv files
 *   Diagrams   → .mmd / .mermaid files
 *   Exports    → exported files in the exports/ directory
 *
 * Each category is collapsible. Clicking a file selects it
 * for the workflow pipeline.
 */

interface TreeFile {
  id: string;
  name: string;
  path: string;
  format: string;
  size: number;
  modifiedAt: number;
}

interface TreeCategory {
  key: string;
  label: string;
  icon: typeof FileText;
  color: string;
  files: TreeFile[];
}

interface WorkspaceTreeProps {
  files: TreeFile[];
  exportFiles: TreeFile[];
  selectedFileIds: Set<string>;
  onFileSelect: (fileId: string) => void;
}

/** Categorize workspace files by type */
function categorizeFiles(files: TreeFile[]): TreeCategory[] {
  const documents = files.filter(f => f.format === 'md');
  const tables = files.filter(f => f.format === 'csv');
  const diagrams = files.filter(f => f.format === 'mmd');

  return [
    { key: 'documents', label: 'Documents', icon: FileText, color: '#C4A265', files: documents },
    { key: 'tables', label: 'Tables', icon: Table2, color: '#A68B4B', files: tables },
    { key: 'diagrams', label: 'Diagrams', icon: FileCode, color: '#D4B87A', files: diagrams },
  ];
}

const WorkspaceTree: React.FC<WorkspaceTreeProps> = ({
  files,
  exportFiles,
  selectedFileIds,
  onFileSelect,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['documents', 'tables', 'diagrams', 'exports'])
  );

  const toggleCategory = useCallback((key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const categories = categorizeFiles(files);
  const exportCategory: TreeCategory = {
    key: 'exports',
    label: 'Exports',
    icon: Download,
    color: '#10b981',
    files: exportFiles,
  };

  const allCategories = [...categories, exportCategory];

  return (
    <div className="flex flex-col h-full select-none">
      {/* Tree header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border-default, #27272a)' }}>
        <FolderOpen size={14} style={{ color: 'var(--accent-primary, #C4A265)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
          Workspace
        </span>
      </div>

      {/* Category list */}
      <div className="flex-1 overflow-auto py-1">
        {allCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.key);
          const fileCount = category.files.length;
          const hasFiles = fileCount > 0;

          return (
            <div key={category.key}>
              {/* Category header */}
              <button
                className={clsx(
                  'w-full flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
                  'hover:bg-hover'
                )}
                onClick={() => toggleCategory(category.key)}
              >
                {isExpanded ? (
                  <ChevronDown size={12} style={{ color: 'var(--fg-dim, #71717a)', flexShrink: 0 }} />
                ) : (
                  <ChevronRight size={12} style={{ color: 'var(--fg-dim, #71717a)', flexShrink: 0 }} />
                )}
                {isExpanded ? (
                  <FolderOpen size={13} style={{ color: category.color, flexShrink: 0 }} />
                ) : (
                  <Folder size={13} style={{ color: category.color, flexShrink: 0 }} />
                )}
                <span className="font-medium" style={{ color: 'var(--fg-primary)' }}>{category.label}</span>
                <span className="ml-auto" style={{ color: 'var(--fg-dim, #71717a)' }}>{fileCount}</span>
              </button>

              {/* Files in category */}
              {isExpanded && (
                <div className="ml-2">
                  {hasFiles ? (
                    category.files.map((file) => {
                      const isSelected = selectedFileIds.has(file.id);
                      return (
                        <button
                          key={file.id}
                          className={clsx(
                            'w-full flex items-center gap-2 pl-6 pr-3 py-1 text-xs transition-colors',
                            isSelected
                              ? 'bg-accent-muted'
                              : 'hover:bg-hover'
                          )}
                          onClick={() => onFileSelect(file.id)}
                          title={file.path}
                        >
                          <category.icon size={12} style={{ color: category.color, flexShrink: 0 }} />
                          <span
                            className="truncate flex-1 text-left"
                            style={{
                              color: isSelected
                                ? 'var(--accent-primary, #C4A265)'
                                : 'var(--fg-secondary)',
                            }}
                          >
                            {file.name}
                          </span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent-primary, #C4A265)' }} />
                          )}
                          <span style={{ color: 'var(--fg-dim, #71717a)' }}>
                            {file.size > 0 ? `${(file.size / 1024).toFixed(0)}KB` : ''}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="pl-6 pr-3 py-1 text-xs italic" style={{ color: 'var(--fg-dim, #71717a)' }}>
                      No {category.label.toLowerCase()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkspaceTree;
