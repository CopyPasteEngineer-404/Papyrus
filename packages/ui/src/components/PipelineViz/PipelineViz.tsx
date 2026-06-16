import React from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface PipelineVizProps {
  stages: string[];
  percentComplete: number;
  workerStatuses: Array<{ format: string; status: string; duration?: number; error?: string }>;
  onCancel: () => void;
}

export const PipelineViz: React.FC<PipelineVizProps> = ({
  stages, percentComplete, workerStatuses, onCancel,
}) => {
  const activeStageIndex = Math.min(
    Math.floor((percentComplete / 100) * stages.length),
    stages.length - 1
  );

  return (
    <div className="space-y-3 py-3">
      {/* Stage Visualization */}
      <div className="flex items-center gap-2">
        {stages.map((stage, i) => {
          let stageState = 'pending';
          if (i < activeStageIndex) stageState = 'done';
          else if (i === activeStageIndex) stageState = 'active';

          return (
            <React.Fragment key={stage}>
              <div className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-normal',
                stageState === 'done' && 'bg-success-muted text-success',
                stageState === 'active' && 'bg-accent-muted text-accent',
                stageState === 'pending' && 'bg-bg-hover text-foreground-dim',
              )}>
                {stageState === 'done' && <Check size={12} />}
                {stageState === 'active' && <Loader2 size={12} className="animate-spin" />}
                <span>{stage}</span>
              </div>
              {i < stages.length - 1 && (
                <div className={clsx(
                  'h-px flex-1',
                  i < activeStageIndex ? 'bg-success' : 'bg-border'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-bg-hover overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-normal"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Worker Statuses */}
      {workerStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {workerStatuses.map((ws) => (
            <div
              key={ws.format}
              className={clsx(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
                ws.status === 'completed' && 'bg-success-muted text-success',
                ws.status === 'running' && 'bg-accent-muted text-accent',
                ws.status === 'failed' && 'bg-error-muted text-error',
                ws.status === 'pending' && 'bg-bg-hover text-foreground-dim',
              )}
            >
              <span className="font-medium">{ws.format.toUpperCase()}</span>
              <span>
                {ws.status === 'completed' && ws.duration ? `${ws.duration}ms` : ws.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Button */}
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground-muted hover:text-error hover:bg-error-muted rounded-md transition-colors"
        onClick={onCancel}
      >
        <X size={12} />
        Cancel Export
      </button>
    </div>
  );
};
