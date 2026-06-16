import React from 'react';
import { CheckCircle2, XCircle, FileOutput } from 'lucide-react';
import clsx from 'clsx';

interface ExportResultProps {
  exports: Array<{ filename: string; format: string; success: boolean; size: number; duration: number }>;
}

export const ExportResult: React.FC<ExportResultProps> = ({ exports }) => {
  return (
    <div className="space-y-2 mt-4">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <FileOutput size={14} />
        Export Results
      </h4>
      {exports.map((exp, i) => (
        <div
          key={i}
          className={clsx(
            'flex items-center gap-3 p-2 rounded-lg border',
            exp.success
              ? 'border-success/30 bg-success-muted'
              : 'border-error/30 bg-error-muted'
          )}
        >
          {exp.success ? (
            <CheckCircle2 size={16} className="text-success flex-shrink-0" />
          ) : (
            <XCircle size={16} className="text-error flex-shrink-0" />
          )}
          <span className={clsx(
            'format-badge',
            exp.format === 'pdf' && 'format-badge--pdf',
            exp.format === 'md' && 'format-badge--md',
          )}>
            {exp.format}
          </span>
          <span className="text-sm text-foreground-secondary flex-1 truncate">{exp.filename}</span>
          <span className="text-xs text-foreground-dim">
            {(exp.size / 1024).toFixed(1)} KB · {exp.duration}ms
          </span>
        </div>
      ))}
    </div>
  );
};
