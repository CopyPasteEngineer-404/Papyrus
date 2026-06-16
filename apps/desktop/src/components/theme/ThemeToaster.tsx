import React from 'react';
import { Toaster } from 'sonner';
import { useTheme } from './ThemeProvider';

/**
 * ThemeToaster — Sonner toaster that automatically adapts to the current theme.
 *
 * Must be rendered inside ThemeProvider (or alongside it in the same tree).
 * Reads resolvedTheme from context and passes it to Sonner's `theme` prop.
 * Toast styles use CSS custom properties for seamless theme integration.
 */
export const ThemeToaster: React.FC = () => {
  let resolvedTheme: 'light' | 'dark' = 'dark';

  try {
    // This will throw if rendered outside ThemeProvider,
    // which is fine — we default to 'dark'
    const theme = useTheme();
    resolvedTheme = theme.resolvedTheme;
  } catch {
    // Fall back to checking the DOM attribute directly
    if (typeof document !== 'undefined') {
      const attr = document.documentElement.getAttribute('data-theme');
      resolvedTheme = attr === 'light' ? 'light' : 'dark';
    }
  }

  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme}
      toastOptions={{
        style: {
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          color: 'var(--fg-primary)',
        },
      }}
    />
  );
};
