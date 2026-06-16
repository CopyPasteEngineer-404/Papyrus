import React, { useState } from 'react';
import {
  FileInput,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';

export interface TraceEntry {
  id: string;
  taskId: string;
  sourceFiles: string[];
  outputFormats: string[];
  constraints: Record<string, any>;
  workerDurations: Array<{ format: string; duration: number; success: boolean; error?: string }>;
  artifacts: Array<{ filename: string; format: string; size: number; path: string }>;
  errors: string[];
  createdAt: number;
  completedAt?: number;
}

interface TraceViewerProps {
  traces: TraceEntry[];
  onOpenArtifact?: (path: string) => void;
  className?: string;
}

/**
 * TraceViewer — Exposes pipeline execution traces for debugging and FYP demo.
 *
 * Shows:
 * - Input files
 * - Constraints applied
 * - Worker durations
 * - Errors (if any)
 * - Generated artifacts
 */
export const TraceViewer: React.FC<TraceViewerProps> = ({
  traces,
  onOpenArtifact,
  className,
}) => {
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  if (traces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package size={48} className="text-foreground-dim mb-4" />
        <h3 className="text-lg font-medium text-foreground">No traces yet</h3>
        <p className="text-sm text-foreground-muted mt-1">
          Run a transformation to see execution traces here
        </p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {traces.map((trace) => {
        const isExpanded = expandedTrace === trace.id;
        const totalDuration = trace.workerDurations.reduce((sum, w) => sum + w.duration, 0);
        const hasErrors = trace.errors.length > 0;

        return (
          <div
            key={trace.id}
            className="border border-border rounded-lg overflow-hidden bg-card"
          >
            {/* Header — always visible */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors duration-fast text-left"
              onClick={() => setExpandedTrace(isExpanded ? null : trace.id)}
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-foreground-dim" />
              ) : (
                <ChevronRight size={16} className="text-foreground-dim" />
              )}
              <span className="text-sm font-medium text-foreground">
                Task {trace.taskId.slice(0, 8)}
              </span>
              <span className="flex items-center gap-1 text-xs text-foreground-muted">
                <Clock size={12} />
                {totalDuration}ms
              </span>
              {hasErrors ? (
                <XCircle size={14} className="text-error" />
              ) : (
                <CheckCircle2 size={14} className="text-success" />
              )}
              <span className="ml-auto text-xs text-foreground-dim">
                {trace.outputFormats.map(f => f.toUpperCase()).join(', ')}
              </span>
            </button>

            {/* Expanded Detail */}
            {isExpanded && (
              <div className="border-t border-border px-4 py-3 space-y-4">
                {/* Input Files */}
                <section>
                  <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FileInput size={12} />
                    Input Files
                  </h4>
                  <ul className="space-y-1">
                    {trace.sourceFiles.map((file, i) => (
                      <li key={i} className="text-sm text-foreground-secondary font-mono truncate">
                        {file}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Constraints */}
                <section>
                  <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                    Constraints
                  </h4>
                  <pre className="text-xs text-foreground-dim bg-background-secondary p-2 rounded-md overflow-x-auto">
                    {JSON.stringify(trace.constraints, null, 2)}
                  </pre>
                </section>

                {/* Worker Durations */}
                <section>
                  <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Clock size={12} />
                    Worker Durations
                  </h4>
                  <div className="space-y-1">
                    {trace.workerDurations.map((w, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={clsx(
                          'format-badge',
                          w.format === 'pdf' && 'format-badge--pdf',
                          w.format === 'md' && 'format-badge--md',
                        )}>
                          {w.format}
                        </span>
                        <span className="text-foreground-secondary">{w.duration}ms</span>
                        {w.success ? (
                          <CheckCircle2 size={12} className="text-success" />
                        ) : (
                          <XCircle size={12} className="text-error" />
                        )}
                        {w.error && (
                          <span className="text-xs text-error flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {w.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Artifacts */}
                {trace.artifacts.length > 0 && (
                  <section>
                    <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                      Artifacts
                    </h4>
                    <ul className="space-y-1">
                      {trace.artifacts.map((artifact, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-foreground-secondary">{artifact.filename}</span>
                          <span className="text-xs text-foreground-dim">
                            ({formatSize(artifact.size)})
                          </span>
                          {onOpenArtifact && (
                            <button
                              className="text-accent hover:text-accent-hover transition-colors"
                              onClick={() => onOpenArtifact(artifact.path)}
                            >
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Errors */}
                {hasErrors && (
                  <section>
                    <h4 className="text-xs font-semibold text-error uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Errors
                    </h4>
                    <ul className="space-y-1">
                      {trace.errors.map((err, i) => (
                        <li key={i} className="text-sm text-error bg-error-muted p-2 rounded-md">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
