import React from 'react';
import { FileText, Table2, FileCode, Check } from 'lucide-react';
import clsx from 'clsx';

interface FileCardProps {
  file: {
    id: string;
    name: string;
    path: string;
    format: string;
    size: number;
    modifiedAt: number;
    snippet?: string;
    unsupported?: boolean;
  };
  selected: boolean;
  onSelect: (id: string) => void;
}

/** Map format to Lucide icon */
const formatIcons: Record<string, typeof FileText> = {
  md: FileText,
  csv: Table2,
  mmd: FileCode,
  pdf: FileText,
};

export const FileCard: React.FC<FileCardProps> = ({ file, selected, onSelect }) => {
  const IconComponent = formatIcons[file.format] || FileText;

  return (
    <div
      className={clsx(
        'p-3 rounded-lg border cursor-pointer transition-colors duration-fast',
        selected
          ? 'border-accent bg-accent-muted'
          : 'border-border bg-card hover:bg-hover hover:border-border-hover'
      )}
      onClick={() => onSelect(file.id)}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-lg',
          file.format === 'pdf' && 'bg-pdf/20 text-pdf',
          file.format === 'md' && 'bg-md/20 text-md',
          file.format === 'csv' && 'bg-csv/20 text-csv',
          file.format === 'mmd' && 'bg-mmd/20 text-mmd',
        )}>
          <IconComponent size={16} />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
            {file.unsupported && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-warning-muted text-warning">
                View Only
              </span>
            )}
          </div>
          {file.snippet && (
            <p className="text-xs text-foreground-dim line-clamp-2 mt-0.5">{file.snippet}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-foreground-dim">
            <span className="truncate">{file.path}</span>
            {file.size > 0 && <span>{(file.size / 1024).toFixed(1)} KB</span>}
          </div>
        </div>

        {/* Selected indicator */}
        {selected && (
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent">
            <Check size={12} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
};
