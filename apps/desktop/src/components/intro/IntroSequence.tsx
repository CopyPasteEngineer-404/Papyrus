import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InkDrop } from './InkDrop';
import { QuillDraw } from './QuillDraw';
import { Wordmark } from './Wordmark';
import { HalftoneIntro } from './HalftoneIntro';
import { IsometricIntro } from './IsometricIntro';
import { MinimalArtIntro } from './MinimalArtIntro';
import { useTheme } from '../theme';
import './intro.css';

/**
 * IntroSequence — Skin-aware intro dispatcher
 *
 * Detects the current theme skin and renders the appropriate intro:
 *  - 'papyrus': Ink drop + quill + wordmark (original)
 *  - 'halftone': Dots rearranging into ASCII shadow PAPYRUS
 *  - 'isometric': Grid + isometric cube + blueprint wordmark
 *  - 'minimalart': Golden line + elegant serif wordmark
 *
 * All intros share the same contract: they call onComplete() when done.
 */

interface IntroSequenceProps {
  /** Called when the intro completes (or is skipped) */
  onComplete: () => void;
}

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const { themeSkin } = useTheme();

  // Dispatch to the correct intro based on skin
  if (themeSkin === 'halftone') {
    return <HalftoneIntro onComplete={onComplete} />;
  }

  if (themeSkin === 'isometric') {
    return <IsometricIntro onComplete={onComplete} />;
  }

  if (themeSkin === 'minimalart') {
    return <MinimalArtIntro onComplete={onComplete} />;
  }

  // Default: Papyrus intro
  return <PapyrusIntro onComplete={onComplete} />;
};

// ─── Papyrus Intro (original, extracted) ───

const PAPYRUS_INK = '#C4A265';
const INK_DROP_DURATION = 2000;
const QUILL_DRAW_START = 2000;
const WORDMARK_START = 5000;
const WORDMARK_STAGGER = 120;
const TAGLINE_START = 7500;
const CLICK_HINT_START = 8500;
const REDUCED_MOTION_LOGO_DURATION = 500;

type Phase = 'ink-drop' | 'quill-draw' | 'wordmark' | 'tagline' | 'click-hint' | 'transition-out' | 'done';

const PapyrusIntro: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('ink-drop');
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

  useEffect(() => {
    if (!prefersReducedMotion) return;
    const timer = setTimeout(() => handleComplete(), REDUCED_MOTION_LOGO_DURATION);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion, handleComplete]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (skipRequested) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      if (!skipRequested) setPhase('quill-draw');
    }, INK_DROP_DURATION));

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

  const handleClick = useCallback(() => {
    if (skipRequested) return;
    setSkipRequested(true);

    if (phase === 'ink-drop' || phase === 'quill-draw') {
      setPhase('done');
      handleComplete();
      return;
    }

    setPhase('transition-out');
    setTimeout(() => handleComplete(), 500);
  }, [skipRequested, phase, handleComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      handleClick();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick]);

  if (phase === 'done') return null;

  if (prefersReducedMotion) {
    return (
      <div className="intro-overlay" role="status" aria-label="Papyrus">
        <div className="flex flex-col items-center gap-4">
          <QuillDraw />
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '0.25em', color: PAPYRUS_INK, opacity: 1 }}>
            PAPYRUS
          </div>
        </div>
      </div>
    );
  }

  const showInkDrop = phase === 'ink-drop';
  const showQuill = phase === 'quill-draw' || phase === 'wordmark' || phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showWordmark = phase === 'wordmark' || phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showTagline = phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showClickHint = phase === 'click-hint' || phase === 'transition-out';
  const quillWriting = phase === 'wordmark' || phase === 'tagline' || phase === 'click-hint';
  const quillLifting = phase === 'transition-out';

  return (
    <AnimatePresence>
      {!skipRequested || phase === 'transition-out' ? (
        <motion.div
          key="intro-overlay"
          className="intro-overlay"
          onClick={handleClick}
          role="status"
          aria-label="Papyrus intro animation — click or press any key to continue"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'transition-out' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === 'transition-out' ? 0.5 : 0.15 }}
        >
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse 50% 40% at 50% 45%, rgba(196, 162, 101, 0.08) 0%, transparent 100%)`,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 1.5, delay: 2 }}
          />

          <div className="flex flex-col items-center gap-6 relative">
            <AnimatePresence>
              {showInkDrop && (
                <motion.div
                  key="ink-drop"
                  className="absolute"
                  style={{ top: '30%' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <InkDrop />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showQuill && (
                <motion.div
                  key="quill"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <QuillDraw writing={quillWriting} lifting={quillLifting} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showWordmark && (
                <motion.div
                  key="wordmark"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2"
                >
                  <Wordmark
                    visible={true}
                    startDelay={0}
                    staggerMs={WORDMARK_STAGGER}
                    showTagline={showTagline}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {showClickHint && (
            <motion.div
              className="absolute bottom-8 text-sm"
              style={{ color: PAPYRUS_INK, letterSpacing: '0.05em' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 0.8, 0.5, 0.8], y: 0 }}
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
