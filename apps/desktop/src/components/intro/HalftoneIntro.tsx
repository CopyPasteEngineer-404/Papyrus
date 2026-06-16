import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './intro.css';

/**
 * HalftoneIntro — "The Press Runs" (Updated)
 *
 * Full-screen overlay intro animation for the Halftone theme skin.
 *
 * New sequence:
 *  1. dot-matrix — Live moving dotted matrix background fills in
 *  2. rearrange — Dots and circles rearrange to form "PAPYRUS" in ASCII shadow style
 *  3. tagline — "Transform Documents" in monospace
 *  4. click-hint — "Click anywhere to continue" pulse
 *  5. transition-out on click
 *
 * Text "PAPYRUS" is rendered from dots — no shadow, just dots/circles
 * rearranging into the letter forms. The ASCII shadow style means the
 * text has a 3D depth effect made entirely of dots.
 *
 * Background dotted matrix is always live/moving.
 */

// ─── Timing Constants (ms) ───
const DOT_MATRIX_START = 0;
const REARRANGE_START = 1800;
const TAGLINE_START = 4000;
const CLICK_HINT_START = 5500;

const REDUCED_MOTION_DURATION = 500;

// Halftone accent (deep inky teal-blue)
const HALFTONE_ACCENT = '#2C7DA0';
const HALFTONE_ACCENT_DARK = '#1B4965';

type Phase = 'dot-matrix' | 'rearrange' | 'tagline' | 'click-hint' | 'transition-out' | 'done';

interface HalftoneIntroProps {
  onComplete: () => void;
}

// ─── ASCII Shadow "PAPYRUS" as dot positions ───
// Each letter is defined as a grid of dots (1 = filled, 0 = empty)
// This creates the ASCII shadow effect using only dots/circles
const PAPYRUS_ASCII: { letter: string; rows: number[][] }[] = [
  {
    letter: 'P',
    rows: [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
    ],
  },
  {
    letter: 'A',
    rows: [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
  },
  {
    letter: 'P',
    rows: [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
    ],
  },
  {
    letter: 'Y',
    rows: [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
  },
  {
    letter: 'R',
    rows: [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,1,0,0],
      [1,0,0,1,0],
      [1,0,0,0,1],
    ],
  },
  {
    letter: 'U',
    rows: [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
  },
  {
    letter: 'S',
    rows: [
      [0,1,1,1,1],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [0,1,1,1,0],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [1,1,1,1,0],
    ],
  },
];

// Generate target dot positions for the PAPYRUS word
function generateWordDots(): Array<{ x: number; y: number; delay: number }> {
  const dots: Array<{ x: number; y: number; delay: number }> = [];
  const dotSize = 6;
  const letterSpacing = 8;
  const totalWidth = PAPYRUS_ASCII.length * (5 * dotSize + letterSpacing) - letterSpacing;
  const startX = -totalWidth / 2;
  const startY = -3.5 * dotSize; // center vertically (7 rows)

  let letterX = startX;

  for (const { rows } of PAPYRUS_ASCII) {
    for (let row = 0; row < rows.length; row++) {
      for (let col = 0; col < rows[row].length; col++) {
        if (rows[row][col] === 1) {
          // Shadow layer (offset down-right by 1 dot)
          dots.push({
            x: letterX + col * dotSize + dotSize,
            y: startY + row * dotSize + dotSize,
            delay: (col + row * 5) * 15,
          });
          // Main dot
          dots.push({
            x: letterX + col * dotSize,
            y: startY + row * dotSize,
            delay: (col + row * 5) * 15 + 5,
          });
        }
      }
    }
    letterX += 5 * dotSize + letterSpacing;
  }

  return dots;
}

// ─── Background Matrix Dot Component ───
const MatrixDot: React.FC<{
  x: number;
  y: number;
  index: number;
}> = ({ x, y, index }) => {
  const isAccent = index % 8 === 0;
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={isAccent ? 1.5 : 1}
      fill={isAccent ? HALFTONE_ACCENT : 'rgba(240, 240, 240, 0.3)'}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.4, 0.15, 0.4],
        cy: [y, y + 8, y - 4, y],
      }}
      transition={{
        duration: 3 + (index % 5) * 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: (index % 20) * 0.1,
      }}
    />
  );
};

// ─── Main Component ───
export const HalftoneIntro: React.FC<HalftoneIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('dot-matrix');
  const [skipRequested, setSkipRequested] = useState(false);
  const skipCompletedRef = useRef(false);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const handleComplete = useCallback(() => {
    if (skipCompletedRef.current) return;
    skipCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

  // Handle reduced motion
  useEffect(() => {
    if (!prefersReducedMotion) return;
    const timer = setTimeout(() => handleComplete(), REDUCED_MOTION_DURATION);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion, handleComplete]);

  // Phase progression timers
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (skipRequested) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      if (!skipRequested) setPhase('rearrange');
    }, REARRANGE_START));

    timers.push(setTimeout(() => {
      if (!skipRequested) setPhase('tagline');
    }, TAGLINE_START));

    timers.push(setTimeout(() => {
      if (!skipRequested) setPhase('click-hint');
    }, CLICK_HINT_START));

    return () => timers.forEach(clearTimeout);
  }, [prefersReducedMotion, skipRequested]);

  // Click handler
  const handleClick = useCallback(() => {
    if (skipRequested) return;
    setSkipRequested(true);

    if (phase === 'dot-matrix') {
      setPhase('done');
      handleComplete();
      return;
    }

    setPhase('transition-out');
    setTimeout(() => handleComplete(), 500);
  }, [skipRequested, phase, handleComplete]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      handleClick();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick]);

  if (phase === 'done') return null;

  // Generate word dots
  const wordDots = useMemo(() => generateWordDots(), []);

  // Generate background matrix dots
  const matrixDots = useMemo(() => {
    const dots: Array<{ x: number; y: number; index: number }> = [];
    for (let y = -200; y <= 200; y += 20) {
      for (let x = -300; x <= 300; x += 20) {
        dots.push({ x, y, index: dots.length });
      }
    }
    return dots;
  }, []);

  // Generate scattered starting positions for word dots
  const scatteredDots = useMemo(() => {
    return wordDots.map((dot, i) => {
      const angle = (i / wordDots.length) * Math.PI * 2;
      const dist = 150 + Math.random() * 200;
      return {
        startX: Math.cos(angle) * dist,
        startY: Math.sin(angle) * dist,
      };
    });
  }, [wordDots]);

  // Reduced motion: show static dot text
  if (prefersReducedMotion) {
    return (
      <div className="intro-overlay" role="status" aria-label="Papyrus">
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="-400 -200 800 400"
        >
          {wordDots.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={2}
              fill={i % 2 === 0 ? HALFTONE_ACCENT : HALFTONE_ACCENT_DARK}
              opacity={0.8}
            />
          ))}
        </svg>
      </div>
    );
  }

  const showWord = phase === 'rearrange' || phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showTagline = phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showClickHint = phase === 'click-hint' || phase === 'transition-out';

  return (
    <AnimatePresence>
      {!skipRequested || phase === 'transition-out' ? (
        <motion.div
          key="halftone-intro"
          className="intro-overlay"
          onClick={handleClick}
          role="status"
          aria-label="Papyrus halftone intro — click or press any key to continue"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'transition-out' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === 'transition-out' ? 0.5 : 0.15 }}
        >
          {/* Halftone accent glow */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse 40% 30% at 50% 45%, rgba(44, 125, 160, 0.08) 0%, transparent 100%)`,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 2, delay: 1.5 }}
          />

          {/* Background matrix - always live and moving */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
            viewBox="-400 -200 800 400"
          >
            {matrixDots.map((dot, i) => (
              <MatrixDot key={i} x={dot.x} y={dot.y} index={dot.index} />
            ))}
          </svg>

          {/* Word dots - rearranging from scattered positions */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
              zIndex: 1,
            }}
            viewBox="-400 -200 800 400"
          >
            {showWord && wordDots.map((dot, i) => {
              const scatter = scatteredDots[i];
              const isShadow = i % 2 === 0;

              return (
                <motion.circle
                  key={i}
                  cx={dot.x}
                  cy={dot.y}
                  r={isShadow ? 2.2 : 2.5}
                  fill={isShadow ? HALFTONE_ACCENT_DARK : HALFTONE_ACCENT}
                  opacity={isShadow ? 0.4 : 0.9}
                  initial={{
                    cx: scatter.startX,
                    cy: scatter.startY,
                    opacity: 0,
                    r: 0.5,
                  }}
                  animate={{
                    cx: dot.x,
                    cy: dot.y,
                    opacity: isShadow ? 0.4 : 0.9,
                    r: isShadow ? 2.2 : 2.5,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: dot.delay / 1000,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                />
              );
            })}
          </svg>

          {/* Tagline */}
          <AnimatePresence>
            {showTagline && (
              <motion.div
                key="tagline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: 'var(--fg-muted, #909090)',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  marginTop: 120,
                }}
              >
                Transform Documents
              </motion.div>
            )}
          </AnimatePresence>

          {/* Click hint — positioned at absolute bottom */}
          {showClickHint && (
            <motion.div
              style={{
                position: 'absolute',
                bottom: 32,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: HALFTONE_ACCENT,
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                zIndex: 2,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 0.9, 0.5, 0.9], y: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
              }}
            >
              Click anywhere to continue
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
