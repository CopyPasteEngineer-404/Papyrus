import React from 'react';
import { WindowControls } from './WindowControls';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useTheme, type ThemeSkin } from '../theme';

interface TitleBarProps {
  workspaceName?: string | null;
}

/** Papyrus manuscript yellow-brown — matches intro animation */
const PAPYRUS_INK = '#C4A265';

/** Halftone inky teal-blue — matches halftone intro */
const HALFTONE_ACCENT = '#2C7DA0';

/** Isometric steel blue — matches isometric intro */
const ISO_ACCENT = '#6C8EBF';
const ISO_ACCENT_DARK = '#4A6FA0';

/**
 * TitleBar — Custom Electron title bar.
 *
 * Skin-aware: shows different icon colors/styles based on theme skin:
 *  - 'papyrus': Yellow-brown quill icon
 *  - 'halftone': Teal-blue geometric icon with hard shadow and halftone dots
 *  - 'isometric': Steel blue isometric cube icon
 *
 * The entire bar is a drag region except for interactive elements.
 */
export const TitleBar: React.FC<TitleBarProps> = ({ workspaceName }) => {
  const { themeSkin } = useTheme();

  return (
    <div
      className="drag-region flex items-center h-titlebar bg-background-secondary border-b border-border select-none"
    >
      {/* App Icon + Name — Left */}
      <div className="no-drag flex items-center gap-2 px-4">
        {themeSkin === 'halftone' ? (
          /* Halftone icon — dotted diamond with hard shadow */
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Papyrus"
            role="img"
          >
            <rect x="3" y="3" width="10" height="10" fill={HALFTONE_ACCENT} transform="rotate(0)" style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,1))' }} />
            {/* Halftone dots inside the icon */}
            <circle cx="6" cy="6" r="1" fill="rgba(0,0,0,0.3)" />
            <circle cx="10" cy="6" r="1" fill="rgba(0,0,0,0.3)" />
            <circle cx="6" cy="10" r="1" fill="rgba(0,0,0,0.3)" />
            <circle cx="10" cy="10" r="1" fill="rgba(0,0,0,0.3)" />
            <circle cx="8" cy="8" r="1.5" fill="var(--fg-primary, #f0f0f0)" />
          </svg>
        ) : themeSkin === 'isometric' ? (
          /* Isometric icon — small isometric cube */
          <svg
            width="16"
            height="16"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Papyrus"
            role="img"
          >
            {/* Isometric cube — 3 faces */}
            <polygon points="20,4 36,12 20,20 4,12" fill={ISO_ACCENT} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            <polygon points="4,12 20,20 20,36 4,28" fill={ISO_ACCENT_DARK} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            <polygon points="20,20 36,12 36,28 20,36" fill="#5A7A9F" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          </svg>
        ) : themeSkin === 'threejs' ? (
          /* Three.js icon — golden quill nib */
          <svg
            width="16"
            height="16"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Papyrus"
            role="img"
          >
            <path d="M20 4 L20 28" stroke="#C4A265" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 6 C14 10, 8 18, 6 26 C8 22, 14 16, 20 12" fill="#C4A265" fillOpacity="0.35"/>
            <path d="M20 6 C26 10, 32 18, 34 26 C32 22, 26 16, 20 12" fill="#C4A265" fillOpacity="0.35"/>
            <path d="M18 26 L17 32 L20 36 L23 32 L22 26" fill="#A68B4B"/>
            <circle cx="20" cy="20" r="12" fill="#C4A265" opacity="0.04"/>
          </svg>
        ) : (
          /* Papyrus quill icon — matches intro animation's quill */
          <svg
            width="16"
            height="16"
            viewBox="0 0 120 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Papyrus"
            role="img"
          >
            <path
              d="M60 15 L60 140"
              stroke={PAPYRUS_INK}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M60 18 C50 25, 28 40, 18 60 C12 72, 10 85, 14 95 C18 88, 25 75, 35 62 C42 52, 50 40, 58 30"
              fill={PAPYRUS_INK}
              fillOpacity="0.8"
            />
            <path
              d="M60 18 C70 25, 92 40, 102 60 C108 72, 110 85, 106 95 C102 88, 95 75, 85 62 C78 52, 70 40, 62 30"
              fill={PAPYRUS_INK}
              fillOpacity="0.8"
            />
            <path
              d="M56 138 L54 148 L58 160 L60 175 L62 160 L66 148 L64 138"
              fill="#8B7355"
            />
          </svg>
        )}
        <span className={`text-sm font-semibold text-foreground ${themeSkin === 'halftone' ? 'uppercase tracking-wider' : themeSkin === 'isometric' ? 'tracking-wide' : themeSkin === 'threejs' ? 'tracking-widest' : ''}`}>
          {themeSkin === 'halftone' ? 'PAPYRUS' : themeSkin === 'threejs' ? 'PAPYRUS' : 'Papyrus'}
        </span>
      </div>

      {/* Workspace Name — Center */}
      <div className="flex-1 text-center">
        <span className="text-xs text-foreground-muted">
          {workspaceName || 'No Workspace'}
        </span>
      </div>

      {/* Theme Toggle + Window Controls — Right */}
      <div className="no-drag flex items-center gap-1 px-1">
        <ThemeToggle />
        <WindowControls />
      </div>
    </div>
  );
};
