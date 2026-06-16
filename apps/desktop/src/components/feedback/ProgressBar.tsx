import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

const variantColors = {
  default: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

/**
 * ProgressBar — Determinate progress indicator.
 * Used for indexing progress, export progress, task queue progress.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = false,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={clsx('w-full', className)} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-foreground-muted">{label}</span>}
          {showPercent && <span className="text-xs text-foreground-dim">{Math.round(percent)}%</span>}
        </div>
      )}
      <div
        className={clsx(
          'w-full rounded-full overflow-hidden bg-hover',
          size === 'sm' ? 'h-1' : 'h-2'
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-normal',
            variantColors[variant]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
