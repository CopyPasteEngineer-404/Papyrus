import React from 'react';
import { useTheme } from '../theme';

interface ScribbleLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 24,
  md: 40,
  lg: 64,
};

/**
 * ScribbleLoader — Theme-specific hand-drawn scribble loading animation.
 *
 * Each theme skin has its own unique SVG pattern:
 * - Papyrus: Full quill pen drawing a line with ink drops
 * - Halftone: Newspaper press with rollers and ink splatter
 * - Isometric: 3D wireframe rotating and building
 * - Minimal Art: Elegant minimal circle with varying line weight
 * - Three.js: Glowing orb with orbiting particles
 */
export const ScribbleLoader: React.FC<ScribbleLoaderProps> = ({ size = 'md', className, label }) => {
  const { themeSkin } = useTheme();
  const px = sizeMap[size];

  return (
    <div className={className} role="status" aria-label={label || 'Loading'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 60 60"
        fill="none"
        className="scribble-loader-svg"
      >
        {themeSkin === 'halftone' ? (
          /* Halftone: Newspaper press with rollers and ink splatter */
          <>
            {/* Main press line */}
            <path
              d="M8 30 C12 18, 22 12, 30 18 C38 24, 28 36, 36 42 C44 48, 52 36, 52 30"
              stroke="var(--accent-primary, #2C7DA0)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              className="scribble-path"
            />
            {/* Top roller */}
            <circle cx="20" cy="10" r="4" fill="none" stroke="var(--accent-primary, #2C7DA0)" strokeWidth="1" className="scribble-roller" />
            <circle cx="20" cy="10" r="1.5" fill="var(--accent-primary, #2C7DA0)" opacity="0.4" />
            {/* Bottom roller */}
            <circle cx="40" cy="50" r="4" fill="none" stroke="var(--accent-primary, #2C7DA0)" strokeWidth="1" className="scribble-roller" style={{ animationDirection: 'reverse' }} />
            <circle cx="40" cy="50" r="1.5" fill="var(--accent-primary, #2C7DA0)" opacity="0.4" />
            {/* Ink splatter dots */}
            <circle cx="10" cy="48" r="2" fill="var(--accent-primary, #2C7DA0)" opacity="0.3" className="scribble-ink-splat-1" />
            <circle cx="48" cy="14" r="1.5" fill="var(--accent-primary, #2C7DA0)" opacity="0.25" className="scribble-ink-splat-2" />
            <circle cx="50" cy="46" r="2.5" fill="var(--accent-primary, #2C7DA0)" opacity="0.2" className="scribble-ink-splat-3" />
            {/* Halftone dot pattern around the path */}
            <circle cx="12" cy="12" r="1" fill="var(--accent-primary, #2C7DA0)" opacity="0.3" className="scribble-dot scribble-dot-1" />
            <circle cx="50" cy="14" r="1" fill="var(--accent-primary, #2C7DA0)" opacity="0.25" className="scribble-dot scribble-dot-2" />
            <circle cx="46" cy="48" r="1" fill="var(--accent-primary, #2C7DA0)" opacity="0.3" className="scribble-dot scribble-dot-3" />
          </>
        ) : themeSkin === 'isometric' ? (
          /* Isometric: 3D wireframe rotating and building */
          <>
            {/* Isometric cube wireframe */}
            <path
              d="M30 8 L48 18 L48 38 L30 48 L12 38 L12 18 Z"
              stroke="var(--accent-primary, #6C8EBF)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
              className="scribble-wireframe"
            />
            <path
              d="M30 8 L30 28 M48 18 L30 28 M12 18 L30 28 L30 48 M30 28 L48 38 M30 28 L12 38"
              stroke="var(--accent-primary, #6C8EBF)"
              strokeWidth="0.8"
              strokeLinejoin="round"
              fill="none"
              className="scribble-wireframe"
              style={{ animationDelay: '0.5s' }}
            />
            {/* Subtle fill glow on front face */}
            <path
              d="M30 28 L48 38 L30 48 L12 38 Z"
              fill="var(--accent-primary, #6C8EBF)"
              opacity="0.05"
            />
            {/* Geometric accent lines */}
            <line x1="30" y1="8" x2="30" y2="2" stroke="var(--accent-primary, #6C8EBF)" strokeWidth="0.5" opacity="0.3" />
            <line x1="48" y1="18" x2="54" y2="15" stroke="var(--accent-primary, #6C8EBF)" strokeWidth="0.5" opacity="0.3" />
          </>
        ) : themeSkin === 'threejs' ? (
          /* Three.js: Floating quill with ink drops */
          <>
            {/* Quill shaft */}
            <line x1="30" y1="8" x2="30" y2="42" stroke="#C4A265" strokeWidth="2" strokeLinecap="round" />
            {/* Quill feathers */}
            <path d="M30 12 C18 18, 10 30, 8 38 C14 30, 22 22, 30 16" fill="#C4A265" opacity="0.2" />
            <path d="M30 12 C42 18, 50 30, 52 38 C46 30, 38 22, 30 16" fill="#C4A265" opacity="0.2" />
            {/* Nib */}
            <path d="M28 40 L26 46 L30 52 L34 46 L32 40" fill="#A68B4B" />
            {/* Ink drops */}
            <circle cx="30" cy="54" r="1.5" fill="#C4A265" opacity="0.4" className="scribble-ink-drop" style={{ animationDelay: '0.2s' }} />
            <circle cx="33" cy="56" r="0.8" fill="#C4A265" opacity="0.25" className="scribble-ink-drop" style={{ animationDelay: '0.6s' }} />
            {/* Warm glow ring */}
            <circle cx="30" cy="30" r="16" fill="none" stroke="#C4A265" strokeWidth="0.4" opacity="0.12" className="scribble-circle" />
          </>
        ) : themeSkin === 'minimalart' ? (
          /* Minimal Art: Elegant minimal circle with varying line weight */
          <>
            <circle
              cx="30"
              cy="30"
              r="20"
              stroke="var(--accent-primary, #C87941)"
              strokeWidth="1.5"
              fill="none"
              className="scribble-circle"
            />
            {/* Varying weight arc overlay */}
            <path
              d="M30 10 A20 20 0 0 1 50 30"
              stroke="var(--accent-primary, #C87941)"
              strokeWidth="1"
              fill="none"
              className="scribble-weight-line"
            />
            {/* Inner thin circle */}
            <circle
              cx="30"
              cy="30"
              r="12"
              stroke="var(--accent-primary, #C87941)"
              strokeWidth="0.5"
              fill="none"
              opacity="0.3"
              className="scribble-circle"
              style={{ animationDelay: '0.5s' }}
            />
            {/* Orbiting dot */}
            <circle
              cx="30"
              cy="10"
              r="2"
              fill="var(--accent-primary, #C87941)"
              className="scribble-orbit-dot"
            />
            {/* Center point */}
            <circle
              cx="30"
              cy="30"
              r="1"
              fill="var(--accent-primary, #C87941)"
              opacity="0.5"
            />
          </>
        ) : (
          /* Papyrus (default): Full quill pen drawing a line with ink drops */
          <>
            {/* Main ink line */}
            <path
              d="M10 35 C14 15, 24 10, 30 20 C36 30, 22 40, 32 45 C42 50, 48 30, 52 25"
              stroke="var(--accent-primary, #C4A265)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              className="scribble-path"
            />
            {/* Secondary line — thinner, offset */}
            <path
              d="M15 42 Q22 38, 28 44 Q34 50, 42 46"
              stroke="var(--accent-primary, #C4A265)"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
              className="scribble-path-secondary"
            />
            {/* Quill pen nib at the drawing point */}
            <path
              d="M50 22 L54 18 L52 24 Z"
              fill="var(--accent-primary, #C4A265)"
              opacity="0.6"
              className="scribble-quill-pen"
            />
            {/* Ink drop at the end of the line */}
            <circle cx="52" cy="25" r="2" fill="var(--accent-primary, #C4A265)" opacity="0.5" className="scribble-ink-drop" />
            {/* Small ink splatter dots */}
            <circle cx="55" cy="28" r="0.8" fill="var(--accent-primary, #C4A265)" opacity="0.3" className="scribble-ink-drop" style={{ animationDelay: '0.3s' }} />
            <circle cx="53" cy="30" r="0.6" fill="var(--accent-primary, #C4A265)" opacity="0.25" className="scribble-ink-drop" style={{ animationDelay: '0.6s' }} />
          </>
        )}
      </svg>
      {label && <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>{label}</span>}
    </div>
  );
};
