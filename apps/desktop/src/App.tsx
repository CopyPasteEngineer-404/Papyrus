import React from 'react';
import { Bootstrap } from './app/Bootstrap';
import { ThemeProvider } from './components/theme';

// Import micro-animations CSS (keyframes)
import './components/micro-animations/micro-animations.css';

/**
 * App — Thin entry point.
 * ThemeProvider wraps the entire app (above Bootstrap/AppShell).
 * All application logic lives in Bootstrap → AppShell.
 *
 * Window.papyrus type declarations are in vite-env.d.ts
 */
export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Bootstrap />
    </ThemeProvider>
  );
};
