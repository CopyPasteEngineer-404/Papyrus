import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './intro.css';

/**
 * IsometricIntro — "Blueprint Rising"
 *
 * Full-screen overlay intro animation for the Isometric theme skin.
 * A 3D isometric cube rises from the ground, rotates, and assembles
 * into the Papyrus logo shape, with the wordmark sliding in from the side.
 *
 * Phases:
 *  1. grid — Subtle isometric grid fades in
 *  2. cube — Isometric cube rises and rotates
 *  3. wordmark — "PAPYRUS" slides in with 3D perspective
 *  4. tagline — "Transform Documents" fades in
 *  5. click-hint — Continue prompt
 */

// ─── Timing Constants (ms) ───
const GRID_DURATION = 1500;
const CUBE_START = 1500;
const WORDMARK_START = 3500;
const TAGLINE_START = 5000;
const CLICK_HINT_START = 6500;

const REDUCED_MOTION_DURATION = 500;

// Isometric accent (steel blue)
const ISO_ACCENT = '#6C8EBF';
const ISO_ACCENT_DARK = '#4A6FA0';
const ISO_ACCENT_LIGHT = '#8AA8D0';

type Phase = 'grid' | 'cube' | 'wordmark' | 'tagline' | 'click-hint' | 'transition-out' | 'done';

interface IsometricIntroProps {
  onComplete: () => void;
}

// ─── Isometric Grid Background ───
const IsoGrid: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Isometric grid lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <React.Fragment key={i}>
          <line
            x1={i * 40} y1={0} x2={i * 40 + 200} y2={400}
            stroke={ISO_ACCENT} strokeWidth="0.5" opacity="0.4"
          />
          <line
            x1={i * 40 + 200} y1={0} x2={i * 40} y2={400}
            stroke={ISO_ACCENT} strokeWidth="0.5" opacity="0.4"
          />
        </React.Fragment>
      ))}
    </svg>
  );
};

// ─── Isometric Cube Component ───
const IsoCube: React.FC<{ visible: boolean; risen: boolean }> = ({ visible, risen }) => {
  if (!visible) return null;

  // Isometric cube vertices (2D projection of 3D cube)
  const cx = 0, cy = 0, size = 40;
  const dx = size * Math.cos(Math.PI / 6);
  const dy = size * Math.sin(Math.PI / 6);

  // Top face
  const topFace = `${cx},${cy - size} ${cx + dx},${cy - size + dy} ${cx},${cy} ${cx - dx},${cy - size + dy}`;
  // Right face
  const rightFace = `${cx},${cy} ${cx + dx},${cy - size + dy} ${cx + dx},${cy + dy} ${cx},${cy + size}`;
  // Left face
  const leftFace = `${cx},${cy} ${cx - dx},${cy - size + dy} ${cx - dx},${cy + dy} ${cx},${cy + size}`;

  return (
    <motion.svg
      width="160"
      height="160"
      viewBox="-100 -100 200 200"
      style={{ position: 'relative', zIndex: 1 }}
      initial={{ y: 80, opacity: 0, scale: 0.5 }}
      animate={risen ? {
        y: 0,
        opacity: 1,
        scale: 1,
        rotateY: [0, 90, 180, 270, 360],
      } : { y: 80, opacity: 0, scale: 0.5 }}
      transition={risen ? {
        y: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] },
        opacity: { duration: 0.4 },
        scale: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] },
        rotateY: { duration: 2, ease: 'easeInOut', repeat: Infinity },
      } : { duration: 0.3 }}
    >
      {/* Left face */}
      <polygon
        points={leftFace}
        fill={ISO_ACCENT_DARK}
        stroke={ISO_ACCENT_LIGHT}
        strokeWidth="1"
        opacity="0.9"
      />
      {/* Right face */}
      <polygon
        points={rightFace}
        fill={ISO_ACCENT}
        stroke={ISO_ACCENT_LIGHT}
        strokeWidth="1"
        opacity="0.9"
      />
      {/* Top face */}
      <polygon
        points={topFace}
        fill={ISO_ACCENT_LIGHT}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        opacity="0.95"
      />
    </motion.svg>
  );
};

// ─── Main Component ───
export const IsometricIntro: React.FC<IsometricIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('grid');
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
      if (!skipRequested) setPhase('cube');
    }, GRID_DURATION));

    timers.push(setTimeout(() => {
      if (!skipRequested) setPhase('wordmark');
    }, WORDMARK_START));

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

    if (phase === 'grid' || phase === 'cube') {
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

  // Reduced motion: show static isometric cube + wordmark
  if (prefersReducedMotion) {
    return (
      <div className="intro-overlay" role="status" aria-label="Papyrus">
        <div className="flex flex-col items-center gap-4">
          <IsoCube visible={true} risen={true} />
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: ISO_ACCENT,
          }}>
            PAPYRUS
          </div>
        </div>
      </div>
    );
  }

  const showGrid = true;
  const showCube = phase === 'cube' || phase === 'wordmark' || phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const cubeRisen = phase !== 'grid';
  const showWordmark = phase === 'wordmark' || phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showTagline = phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showClickHint = phase === 'click-hint' || phase === 'transition-out';

  return (
    <AnimatePresence>
      {!skipRequested || phase === 'transition-out' ? (
        <motion.div
          key="isometric-intro"
          className="intro-overlay"
          onClick={handleClick}
          role="status"
          aria-label="Papyrus isometric intro — click or press any key to continue"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'transition-out' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === 'transition-out' ? 0.5 : 0.15 }}
        >
          {/* Isometric grid background */}
          <IsoGrid visible={showGrid} />

          {/* Accent glow */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse 50% 40% at 50% 45%, rgba(108, 142, 191, 0.08) 0%, transparent 100%)`,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 2, delay: 1 }}
          />

          {/* Main content */}
          <div className="flex flex-col items-center gap-6 relative" style={{ zIndex: 1 }}>
            <AnimatePresence>
              {showCube && (
                <motion.div
                  key="iso-cube"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <IsoCube visible={true} risen={cubeRisen} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showWordmark && (
                <motion.div
                  key="iso-wordmark"
                  initial={{ opacity: 0, x: 40, skewX: -5 }}
                  animate={{ opacity: 1, x: 0, skewX: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  className="mt-2"
                >
                  <div style={{
                    fontSize: 40,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    color: ISO_ACCENT,
                    textShadow: `2px 2px 0px ${ISO_ACCENT_DARK}`,
                  }}>
                    PAPYRUS
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showTagline && (
                <motion.div
                  key="iso-tagline"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    color: 'var(--fg-muted, #8b97a8)',
                  }}
                >
                  Transform Documents
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Click hint */}
          {showClickHint && (
            <motion.div
              className="absolute bottom-8"
              style={{
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.06em',
                color: ISO_ACCENT,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 0.8, 0.5, 0.8], y: 0 }}
              transition={{
                duration: 2.5,
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
