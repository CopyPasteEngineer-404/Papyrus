import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import clsx from 'clsx';

interface WindowControlsProps {
  className?: string;
}

/**
 * WindowControls — Custom Electron window buttons (minimize, maximize, close).
 * These sit inside the TitleBar and call Electron's window APIs.
 */
export const WindowControls: React.FC<WindowControlsProps> = ({ className }) => {
  const handleMinimize = () => {
    window.papyrus?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.papyrus?.maximizeWindow();
  };

  const handleClose = () => {
    window.papyrus?.closeWindow();
  };

  return (
    <div className={clsx('flex items-center h-full', className)}>
      <button
        onClick={handleMinimize}
        className="flex items-center justify-center w-[46px] h-full hover:bg-hover transition-colors duration-fast"
        aria-label="Minimize"
      >
        <Minus size={14} className="text-foreground-muted" />
      </button>
      <button
        onClick={handleMaximize}
        className="flex items-center justify-center w-[46px] h-full hover:bg-hover transition-colors duration-fast"
        aria-label="Maximize"
      >
        <Square size={12} className="text-foreground-muted" />
      </button>
      <button
        onClick={handleClose}
        className="flex items-center justify-center w-[46px] h-full hover:bg-error transition-colors duration-fast group"
        aria-label="Close"
      >
        <X size={14} className="text-foreground-muted group-hover:text-white" />
      </button>
    </div>
  );
};
