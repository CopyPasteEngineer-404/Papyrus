import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './intro.css';

const GOLD = '#C4A265';
const GOLD_LIGHT = '#D4B87A';
const GOLD_DARK = '#A68B4B';

const INK_DROP_DURATION = 1500;
const WORDMARK_START = 2200;
const TAGLINE_START = 4000;
const CLICK_HINT_START = 5800;

const REDUCED_MOTION_DURATION = 500;

type Phase = 'ink-drop' | 'wordmark' | 'tagline' | 'click-hint' | 'transition-out' | 'done';

interface ThreeJsIntroProps {
  onComplete: () => void;
}

export const ThreeJsIntro: React.FC<ThreeJsIntroProps> = ({ onComplete }) => {
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
    const timer = setTimeout(() => handleComplete(), REDUCED_MOTION_DURATION);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion, handleComplete]);

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

  const handleClick = useCallback(() => {
    if (skipRequested) return;
    setSkipRequested(true);

    if (phase === 'ink-drop' || phase === 'wordmark') {
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
          <div style={{ fontSize: 32, fontWeight: 400, letterSpacing: '0.2em', color: GOLD, opacity: 1 }}>
            PAPYRUS
          </div>
        </div>
      </div>
    );
  }

  const showInkDrop = phase === 'ink-drop';
  const showWordmark = phase === 'wordmark' || phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showTagline = phase === 'tagline' || phase === 'click-hint' || phase === 'transition-out';
  const showClickHint = phase === 'click-hint' || phase === 'transition-out';

  return (
    <AnimatePresence>
      {!skipRequested || phase === 'transition-out' ? (
        <motion.div
          key="threejs-intro"
          className="intro-overlay"
          onClick={handleClick}
          role="status"
          aria-label="Papyrus intro animation — click or press any key to continue"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'transition-out' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === 'transition-out' ? 0.5 : 0.15 }}
          style={{
            background: 'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(196, 162, 101, 0.06) 0%, transparent 100%)',
          }}
        >
          <div className="flex flex-col items-center gap-6 relative">
            {/* Floating quill SVG */}
            <AnimatePresence>
              {showInkDrop && (
                <motion.div
                  key="quill-icon"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ position: 'absolute', top: '28%' }}
                >
                  <svg width="60" height="100" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <motion.path
                      d="M60 15 L60 140"
                      stroke={GOLD}
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, ease: 'easeInOut' }}
                    />
                    <motion.path
                      d="M60 18 C50 25, 28 40, 18 60 C12 72, 10 85, 14 95 C18 88, 25 75, 35 62 C42 52, 50 40, 58 30"
                      fill={GOLD}
                      fillOpacity="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                    />
                    <motion.path
                      d="M60 18 C70 25, 92 40, 102 60 C108 72, 110 85, 106 95 C102 88, 95 75, 85 62 C78 52, 70 40, 62 30"
                      fill={GOLD}
                      fillOpacity="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
                    />
                    <path d="M56 138 L54 148 L58 160 L60 175 L62 160 L66 148 L64 138" fill={GOLD_DARK} />
                    {/* Glow behind quill */}
                    <circle cx="60" cy="90" r="30" fill={GOLD} opacity="0.04" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ink drop */}
            <AnimatePresence>
              {showInkDrop && (
                <motion.div
                  key="ink-drop"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.3, 1],
                    opacity: [0, 0.8, 0.2],
                  }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
                    position: 'absolute',
                    top: '38%',
                    opacity: 0.15,
                  }}
                />
              )}
            </AnimatePresence>

            {/* PAPYRUS wordmark */}
            <AnimatePresence>
              {showWordmark && (
                <motion.div
                  key="wordmark"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ marginTop: 180 }}
                >
                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 350,
                      letterSpacing: '0.25em',
                      color: GOLD,
                    }}
                  >
                    {'PAPYRUS'.split('').map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tagline */}
            <AnimatePresence>
              {showTagline && (
                <motion.div
                  key="tagline"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      color: 'rgba(196, 162, 101, 0.35)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Ancient Craft, Modern Tool
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {showClickHint && (
            <motion.div
              className="absolute bottom-8 text-sm"
              style={{ color: GOLD, letterSpacing: '0.05em', opacity: 0.35 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 0.35, 0.15, 0.35], y: 0 }}
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
