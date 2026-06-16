import React from 'react';
import clsx from 'clsx';
import { ScribbleLoader } from './ScribbleLoader';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

/**
 * Spinner — Animated loading indicator.
 * Uses the theme-specific ScribbleLoader animation instead of a generic spinner.
 */
export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, label }) => {
  return (
    <ScribbleLoader size={size} className={clsx('flex items-center gap-2', className)} label={label} />
  );
};
