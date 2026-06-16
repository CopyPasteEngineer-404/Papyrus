import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './intro.css';

/**
 * MinimalArtIntro — "The Gallery Opens"
 *
 * Full-screen overlay intro animation for the Minimal Art theme skin.
 * Inspired by art exhibition openings and gallery aesthetics.
 *
 * Phases:
 *  1. reveal — A thin golden line draws across the screen, then expands
 *  2. wordmark — "PAPYRUS" fades in with elegant serif typography
 *  3. tagline — "Transform Documents" in small caps
 *  4. click-hint — Subtle "Click anywhere to continue"
 *  5. transition-out on click
 */

const LINE_DURATION = 2000;
const WORDMARK_START = 2000;
const TAGLINE_START = 3800;
const CLICK_HINT_START = 5500;

const REDUCED_MOTION_DURATION = 500;

// Minimal Art accent (warm terracotta)
const MA_ACCENT = '#C87941';
const MA_ACCENT_DARK = '#A86230';
const MA_ACCENT_LIGHT = '#D48E58';

type Phase = 'reveal' | 'wordmark' | 'tagline' | 'click-hint' | 'transition-out' | 'done';

interface MinimalArtIntroProps {
  onComplete: () => void;
}

export const MinimalArtIntro: React.FC<MinimalArtIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('reveal');
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

    if (phase === 'reveal') {
      setPhase('done');
      handleComplete();
      return;
    }

    setPhase('transition-out');
    setTimeout(() => handleComplete(), 600);
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

  // Reduced motion: show static wordmark
  if (prefersReducedMotion) {
    return (
      <div className="intro-overlay" role="status" aria-label="Papyrus">
        <div className="flex flex-col items-center gap-4">
          <div style={{
            fontSize: 36,
            fontWeight: 300,
            letterSpacing: '0.3em',
            color: MA_ACCENT,
          }}>
            PAPYRUS
          </div>
        </div>
      </div>
    );
  }

  const showLine = true; // Always show the line
  const showWordmark = phase === 'wordmark' || phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showTagline = phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showClickHint = phase === 'click-hint' || phase === 'transition-out';

  return (
    <AnimatePresence>
      {!skipRequested || phase === 'transition-out' ? (
        <motion.div
          key="minimalart-intro"
          className="intro-overlay"
          onClick={handleClick}
          role="status"
          aria-label="Papyrus minimal art intro — click or press any key to continue"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'transition-out' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === 'transition-out' ? 0.6 : 0.15 }}
        >
          {/* Ambient warm glow */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(200, 121, 65, 0.04) 0%, transparent 100%)`,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 3, delay: 1 }}
          />

          {/* Thin golden line that draws across the center */}
          {showLine && (
            <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: 1 }}>
              <motion.div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, transparent 0%, ${MA_ACCENT} 20%, ${MA_ACCENT_LIGHT} 50%, ${MA_ACCENT} 80%, transparent 100%)`,
                  transformOrigin: 'left center',
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0, 0.4, 0.2] }}
                transition={{
                  scaleX: { duration: 2, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 3, ease: 'easeOut' },
                }}
              />
              {/* Line expands slightly when wordmark appears */}
              {showWordmark && (
                <motion.div
                  style={{
                    position: 'absolute',
                    top: -0.5,
                    left: '20%',
                    right: '20%',
                    height: 2,
                    background: MA_ACCENT,
                    opacity: 0.15,
                    filter: 'blur(4px)',
                  }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 0.15, scaleX: 1 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              )}
            </div>
          )}

          {/* Wordmark */}
          <AnimatePresence>
            {showWordmark && (
              <motion.div
                key="ma-wordmark"
                initial={{ opacity: 0, y: 20, letterSpacing: '0.5em' }}
                animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col items-center relative"
                style={{ zIndex: 1, marginTop: -20 }}
              >
                <div style={{
                  fontSize: 44,
                  fontWeight: 300,
                  letterSpacing: '0.3em',
                  color: MA_ACCENT,
                  textTransform: 'uppercase',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}>
                  PAPYRUS
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tagline */}
          <AnimatePresence>
            {showTagline && (
              <motion.div
                key="ma-tagline"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  marginTop: 16,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  color: 'var(--fg-muted, #a89e90)',
                  textTransform: 'uppercase',
                  fontFamily: 'Georgia, "Times New Roman", serif',
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
                fontSize: 12,
                fontWeight: 400,
                letterSpacing: '0.1em',
                color: MA_ACCENT,
                textTransform: 'uppercase',
                fontFamily: 'Georgia, "Times New Roman", serif',
                zIndex: 1,
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 0.7, 0.4, 0.7], y: 0 }}
              transition={{
                duration: 3,
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
