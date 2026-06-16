import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

/**
 * ThemeToggle — Compact theme cycle button for title bar or sidebar.
 *
 * Shows: Sun (light), Moon (dark), Monitor (system).
 * On click, cycles through: light → dark → system → light.
 * Smooth icon transition via CSS opacity + transform.
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const [animating, setAnimating] = useState(false);

  // Trigger animation on theme change
  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [theme]);

  const iconMap: Record<string, React.ReactNode> = {
    light: <Sun size={14} />,
    dark: <Moon size={14} />,
    system: <Monitor size={14} />,
  };

  const labelMap: Record<string, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  };

  return (
    <button
      className={`
        relative inline-flex items-center justify-center
        w-7 h-7 rounded-md
        text-foreground-muted hover:text-foreground
        hover:bg-hover active:bg-active
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary
        ${className}
      `}
      onClick={toggleTheme}
      aria-label={`Theme: ${labelMap[theme]}. Click to switch.`}
      title={`${labelMap[theme]} theme`}
    >
      <span
        className={`
          flex items-center justify-center
          transition-all duration-200 ease-out
          ${animating
            ? 'opacity-0 scale-75 rotate-45'
            : 'opacity-100 scale-100 rotate-0'
          }
        `}
        style={{ willChange: 'opacity, transform' }}
      >
        {iconMap[theme]}
      </span>
    </button>
  );
};
