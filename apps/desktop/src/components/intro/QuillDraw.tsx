import React, { useId, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppSettingsStore, type QuillStyle } from '../../stores/appSettings';

/**
 * QuillDraw — Phase 1b
 *
 * An animated quill that draws itself using Framer Motion.
 * Supports two styles switchable from Settings:
 *   - 'inkpen': Ink pen / dip pen SVG (inkpenmoney.svg)
 *   - 'feather': Feather quill SVG (Schreibfeder.svg)
 *
 * Key design decisions:
 * - Quill points DOWN-LEFT after animation (rotate -45deg)
 * - Colors use light yellow-brown (#C4A265) — old manuscript/papyrus theme
 * - Framer Motion orchestrates the draw + fill + tilt sequence
 *
 * When using SVG files, the image scales in with a draw-like animation.
 * When using the legacy inline SVG, the stroke-by-stroke draw animation is preserved.
 */

interface QuillDrawProps {
  /** Whether the quill should animate in "writing" mode (tilted down-left) */
  writing?: boolean;
  /** Whether the quill is lifting away after writing */
  lifting?: boolean;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Callback when the draw animation completes */
  onDrawComplete?: () => void;
}

/** Papyrus manuscript yellow-brown palette (for legacy inline SVG) */
const PAPYRUS = {
  ink: '#C4A265',
  inkLight: '#D4B87A',
  inkDark: '#A68B4B',
  inkMuted: 'rgba(196, 162, 101, 0.5)',
  parchment: '#E8D5A3',
  nibMetal: '#8B7355',
  nibLight: '#B8A07A',
} as const;

export const QuillDraw: React.FC<QuillDrawProps> = ({
  writing = false,
  lifting = false,
  style,
  onDrawComplete,
}) => {
  const { quillStyle } = useAppSettingsStore();
  const id = useId();
  const uid = id.replace(/:/g, '');
  const [drawPhase, setDrawPhase] = useState<'drawing' | 'filling' | 'tilting' | 'done'>('drawing');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setDrawPhase('filling'), 2500));
    timers.push(setTimeout(() => setDrawPhase('tilting'), 3000));
    timers.push(setTimeout(() => {
      setDrawPhase('done');
      onDrawComplete?.();
    }, 3500));
    return () => timers.forEach(clearTimeout);
  }, [onDrawComplete]);

  // Framer Motion variants for the quill container
  const containerVariants = {
    drawing: { rotate: 0, x: 0, y: 0, opacity: 1 },
    tilting: {
      rotate: -45, x: -15, y: 10, opacity: 1,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
    },
    writing: { rotate: -45, x: -15, y: 10, opacity: 1 },
    lifting: {
      rotate: -60, x: -20, y: -20, opacity: 0.6,
      transition: { duration: 0.3, ease: 'easeOut' as const },
    },
  };

  let animateState = 'drawing';
  if (lifting) animateState = 'lifting';
  else if (writing) animateState = 'writing';
  else if (drawPhase === 'tilting') animateState = 'tilting';
  else if (drawPhase === 'done') animateState = 'writing';

  // SVG file-based quill (simpler, uses the two uploaded SVGs)
  if (quillStyle === 'inkpen' || quillStyle === 'feather') {
    const svgSrc = quillStyle === 'feather' ? '/Schreibfeder.svg' : '/inkpenmoney.svg';

    return (
      <motion.div
        style={{
          width: 140,
          height: 140,
          position: 'relative',
          transformOrigin: 'center 70%',
          ...style,
        }}
        initial={{ opacity: 0, scale: 0.3, rotate: 15 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: drawPhase === 'done' || drawPhase === 'tilting' ? -45 : 0,
        }}
        transition={{
          duration: 2.5,
          ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
          rotate: { delay: 1.5, duration: 1.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
        }}
        onAnimationComplete={() => {
          if (drawPhase === 'drawing') {
            setDrawPhase('done');
            onDrawComplete?.();
          }
        }}
      >
        <img
          src={svgSrc}
          alt={quillStyle === 'feather' ? 'Feather Quill' : 'Ink Pen'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 20px rgba(196, 162, 101, 0.5))',
          }}
        />
      </motion.div>
    );
  }

  // Legacy inline SVG quill (original stroke-by-stroke animation)
  const drawVariants = (pathLength: number, delay: number) => ({
    hidden: { strokeDashoffset: pathLength, fillOpacity: 0 },
    visible: {
      strokeDashoffset: 0,
      fillOpacity: drawPhase === 'filling' || drawPhase === 'tilting' || drawPhase === 'done' ? 1 : 0,
      transition: {
        strokeDashoffset: { duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        fillOpacity: { duration: 0.4, delay: Math.max(0, 1.2 - delay), ease: 'easeOut' as const },
      },
    },
  });

  return (
    <motion.div
      style={{ width: 120, height: 180, position: 'relative', transformOrigin: 'center 70%', ...style }}
      variants={containerVariants}
      animate={animateState}
      initial="drawing"
    >
      <svg viewBox="0 0 120 180" width="120" height="180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Papyrus quill logo" role="img">
        <defs>
          <linearGradient id={`feather-fill-${uid}`} x1="40" y1="10" x2="80" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={PAPYRUS.inkLight} stopOpacity="0.9" />
            <stop offset="50%" stopColor={PAPYRUS.ink} stopOpacity="0.7" />
            <stop offset="100%" stopColor={PAPYRUS.inkDark} stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id={`nib-fill-${uid}`} x1="55" y1="140" x2="65" y2="175" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={PAPYRUS.nibMetal} />
            <stop offset="50%" stopColor={PAPYRUS.nibLight} />
            <stop offset="100%" stopColor={PAPYRUS.nibMetal} />
          </linearGradient>
          <radialGradient id={`ink-dot-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={PAPYRUS.ink} />
            <stop offset="100%" stopColor={PAPYRUS.inkDark} />
          </radialGradient>
        </defs>
        <motion.path d="M60 15 L60 140" stroke={PAPYRUS.inkDark} strokeWidth="1.5" strokeLinecap="round" fill={PAPYRUS.inkDark} initial="hidden" animate="visible" variants={drawVariants(125, 0)} custom={125} />
        <motion.path d="M60 18 C50 25, 28 40, 18 60 C12 72, 10 85, 14 95 C18 88, 25 75, 35 62 C42 52, 50 40, 58 30" stroke={PAPYRUS.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={`url(#feather-fill-${uid})`} initial="hidden" animate="visible" variants={drawVariants(140, 0.35)} />
        <motion.path d="M60 35 C54 42, 38 55, 28 72 C24 80, 22 88, 25 92 C30 85, 38 72, 48 58 C53 50, 57 42, 60 38" stroke={PAPYRUS.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={`url(#feather-fill-${uid})`} initial="hidden" animate="visible" variants={drawVariants(100, 0.5)} />
        <motion.path d="M60 18 C70 25, 92 40, 102 60 C108 72, 110 85, 106 95 C102 88, 95 75, 85 62 C78 52, 70 40, 62 30" stroke={PAPYRUS.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={`url(#feather-fill-${uid})`} initial="hidden" animate="visible" variants={drawVariants(140, 0.55)} />
        <motion.path d="M60 35 C66 42, 82 55, 92 72 C96 80, 98 88, 95 92 C90 85, 82 72, 72 58 C67 50, 63 42, 60 38" stroke={PAPYRUS.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={`url(#feather-fill-${uid})`} initial="hidden" animate="visible" variants={drawVariants(100, 0.7)} />
        <motion.path d="M60 50 L35 58 M60 65 L30 75 M60 80 L28 88 M60 95 L32 100" stroke={PAPYRUS.ink} strokeWidth="1.2" strokeLinecap="round" fill="none" initial="hidden" animate="visible" variants={drawVariants(80, 0.65)} />
        <motion.path d="M60 50 L85 58 M60 65 L90 75 M60 80 L92 88 M60 95 L88 100" stroke={PAPYRUS.ink} strokeWidth="1.2" strokeLinecap="round" fill="none" initial="hidden" animate="visible" variants={drawVariants(80, 0.85)} />
        <motion.path d="M56 138 L54 148 L58 160 L60 175 L62 160 L66 148 L64 138" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={`url(#nib-fill-${uid})`} initial="hidden" animate="visible" variants={drawVariants(80, 0.9)} />
        <motion.path d="M60 140 L60 168" stroke="var(--bg-primary, #09090b)" strokeWidth="1" strokeLinecap="round" fill="var(--bg-primary, #09090b)" initial="hidden" animate="visible" variants={drawVariants(28, 1.1)} />
        <motion.circle cx="60" cy="176" r="2.5" fill={`url(#ink-dot-${uid})`} initial={{ opacity: 0 }} animate={{ opacity: drawPhase === 'filling' || drawPhase === 'tilting' || drawPhase === 'done' ? 1 : 0 }} transition={{ duration: 0.3, delay: 1.3 }} />
      </svg>
    </motion.div>
  );
};
