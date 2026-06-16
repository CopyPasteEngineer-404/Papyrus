import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, FileWarning, Cpu, Wifi } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface WorkerError {
  workerName?: string;
  reason?: string;
  log?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorType: 'render' | 'data' | 'network' | 'worker' | 'unknown';
  workerError: WorkerError | null;
  resetKey: number;
}

/**
 * ErrorBoundary — Catches React render errors and displays a user-friendly
 * recovery screen with detailed error context.
 *
 * Error types:
 * - render: Component rendering error (default)
 * - data: Data/file processing error
 * - network: IPC communication error
 * - worker: Export worker failure (with worker name, reason, log)
 * - unknown: Unclassified error
 *
 * Features:
 * - Worker error extraction (worker name, reason, log)
 * - Classify errors for targeted messaging
 * - Retry button (resets error boundary)
 * - Reload button (full page reload)
 * - Error details (collapsible for debugging)
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorType: 'unknown', workerError: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorType = classifyError(error);
    const workerError = extractWorkerError(error);
    return { hasError: true, error, errorType, workerError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Papyrus ErrorBoundary]', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorType: 'unknown', workerError: null, resetKey: this.state.resetKey + 1 });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error, errorType, workerError } = this.state;

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <ErrorIcon type={errorType} />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {getErrorTitle(errorType)}
          </h2>

          {/* Worker error details — shows Worker, Reason, Log */}
          {workerError && (
            <div className="mb-4 p-4 rounded-lg border max-w-md text-left" style={{ borderColor: 'var(--status-error, #ef4444)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
              {workerError.workerName && (
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={14} style={{ color: 'var(--status-error, #ef4444)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--fg-primary)' }}>
                    Worker:
                  </span>
                  <span className="text-xs" style={{ color: 'var(--status-error, #ef4444)' }}>
                    {workerError.workerName}
                  </span>
                </div>
              )}
              {workerError.reason && (
                <div className="mb-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--fg-primary)' }}>
                    Reason:
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--fg-secondary)' }}>
                    {workerError.reason}
                  </p>
                </div>
              )}
              {workerError.log && (
                <div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--fg-primary)' }}>
                    Log:
                  </span>
                  <pre className="mt-1 p-2 rounded text-xs overflow-auto max-h-24 font-mono" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--fg-dim)' }}>
                    {workerError.log}
                  </pre>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-foreground-muted mb-2 max-w-md">
            {getErrorMessage(errorType, error)}
          </p>
          {error && (
            <details className="mb-4 max-w-lg">
              <summary className="text-xs text-foreground-dim cursor-pointer hover:text-foreground transition-colors">
                Show error details
              </summary>
              <pre className="mt-2 p-3 rounded-lg text-xs text-left overflow-auto max-h-40 bg-background-secondary border border-border">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
              onClick={this.handleReset}
            >
              <RotateCcw size={14} />
              Try Again
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-hover hover:bg-active text-foreground rounded-lg text-sm font-medium transition-colors"
              onClick={this.handleReload}
            >
              <Home size={14} />
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}

/** Error type icon */
function ErrorIcon({ type }: { type: string }) {
  const iconStyle = { color: 'var(--status-error, #ef4444)' };
  switch (type) {
    case 'worker':
      return <FileWarning size={40} className="mb-4" style={iconStyle} />;
    case 'network':
      return <Wifi size={40} className="mb-4" style={iconStyle} />;
    default:
      return <AlertTriangle size={40} className="mb-4" style={iconStyle} />;
  }
}

/** Extract worker-specific error info from the error message */
function extractWorkerError(error: Error): WorkerError | null {
  const msg = error.message || '';
  const result: WorkerError = {};

  // Try to extract worker name
  const workerMatch = msg.match(/(?:worker|Worker)[:\s]+(\w[\w-]*)/i)
    || msg.match(/(pdf-worker|markdown-worker|mermaid-worker)/i);
  if (workerMatch) {
    result.workerName = workerMatch[1];
  }

  // Try to extract reason
  const reasonPatterns = [
    /reason:\s*(.+?)(?:\n|$)/i,
    /(?:failed|error):\s*(.+?)(?:\n|$)/i,
    /invalid\s+(\w+)/i,
  ];
  for (const pattern of reasonPatterns) {
    const match = msg.match(pattern);
    if (match) {
      result.reason = match[1] || match[0];
      break;
    }
  }

  // If no specific reason extracted, use the error message itself
  if (!result.reason && msg.length < 200) {
    result.reason = msg;
  }

  // Try to extract log/output
  const logMatch = msg.match(/(?:log|output|details):\s*([\s\S]+)$/i);
  if (logMatch) {
    result.log = logMatch[1].trim().slice(0, 500);
  }

  return (result.workerName || result.reason) ? result : null;
}

/** Classify error by message content */
function classifyError(error: Error): 'render' | 'data' | 'network' | 'worker' | 'unknown' {
  const msg = error.message?.toLowerCase() || '';
  if (msg.includes('worker') || msg.includes('export failed') || msg.includes('pipeline')) return 'worker';
  if (msg.includes('cannot read') || msg.includes('undefined') || msg.includes('null')) return 'render';
  if (msg.includes('failed to fetch') || msg.includes('ipc') || msg.includes('invoke')) return 'network';
  if (msg.includes('parse') || msg.includes('invalid') || msg.includes('corrupt') || msg.includes('enoent') || msg.includes('eacces')) return 'data';
  return 'unknown';
}

function getErrorTitle(type: 'render' | 'data' | 'network' | 'worker' | 'unknown'): string {
  switch (type) {
    case 'render': return 'Display Error';
    case 'data': return 'Data Error';
    case 'network': return 'Communication Error';
    case 'worker': return 'Worker Failed';
    default: return 'Something went wrong';
  }
}

function getErrorMessage(type: 'render' | 'data' | 'network' | 'worker' | 'unknown', error: Error | null): string {
  switch (type) {
    case 'render':
      return 'The app encountered a display error. This usually happens when data is missing or malformed. Try again or reload.';
    case 'data':
      return error?.message || 'A file processing error occurred. The file may be corrupted or inaccessible.';
    case 'network':
      return 'The app could not communicate with the backend. This may happen if the Electron process is busy or unresponsive. Try reloading.';
    case 'worker':
      return error?.message || 'An export worker failed during processing. Check the worker details above for more information.';
    default:
      return error?.message || 'An unexpected error occurred.';
  }
}
