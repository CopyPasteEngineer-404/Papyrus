import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Skeleton — Placeholder loading state.
 * Renders a shimmer-animated rectangle to indicate loading content.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  className,
  rounded = 'md',
}) => {
  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={clsx('skeleton', roundedClass, className)}
      style={{ width, height }}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * SkeletonCard — Pre-built card skeleton for file cards / export cards.
 */
export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton width={32} height={32} rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="14px" />
          <Skeleton width="40%" height="12px" />
        </div>
      </div>
      <Skeleton width="80%" height="12px" />
    </div>
  );
};

/**
 * SkeletonList — Pre-built list of skeletons for file lists / export lists.
 */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
