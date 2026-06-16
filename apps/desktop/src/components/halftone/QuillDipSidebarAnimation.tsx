import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * QuillDipSidebarAnimation — A small interactive animation for the halftone theme sidebar.
 *
 * Shows a quill pen dipping into an inkwell and scribbling on paper.
 * The animation loops continuously but is subtle enough not to distract.
 * Only visible in the halftone theme skin, placed at the bottom of the sidebar.
 *
 * Phases (loop):
 *  1. idle — quill rests above inkwell
 *  2. dipping — quill descends into inkwell
 *  3. lifting — quill rises, dripping ink
 *  4. writing — quill moves across paper, leaving dots
 *  5. back to idle
 */

const INK_COLOR = '#2C7DA0';
const PAPER_COLOR = 'rgba(44, 125, 160, 0.15)';
const LOOP_DURATION = 4000; // ms per full cycle

export const QuillDipSidebarAnimation: React.FC = () => {
  const [phase, setPhase] = useState<'idle' | 'dipping' | 'lifting' | 'writing'>('idle');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const startCycle = () => {
      setPhase('dipping');
      timers.push(setTimeout(() => setPhase('lifting'), 800));
      timers.push(setTimeout(() => setPhase('writing'), 1600));
      timers.push(setTimeout(() => setPhase('idle'), 3200));
      timers.push(setTimeout(() => startCycle(), LOOP_DURATION));
    };

    // Start after a short delay
    timers.push(setTimeout(() => startCycle(), 1000));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Quill y-position based on phase
  const quillY = phase === 'dipping' ? 8 : phase === 'lifting' ? -4 : phase === 'writing' ? -2 : -6;
  const quillX = phase === 'writing' ? 12 : 0;
  const quillRotation = phase === 'dipping' ? 15 : phase === 'writing' ? -20 : -10;

  return (
    <div
      className="flex items-end justify-center w-full"
      style={{ height: 64, position: 'relative', overflow: 'hidden' }}
    >
      {/* Paper surface (bottom) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 8,
          right: 8,
          height: 16,
          background: PAPER_COLOR,
          borderRadius: 2,
          border: '1px solid rgba(44, 125, 160, 0.2)',
        }}
      >
        {/* Writing dots that appear during writing phase */}
        <AnimatePresence>
          {phase === 'writing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: 4, padding: '3px 6px' }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.circle
                  key={i}
                  cx={0}
                  cy={0}
                  r={1.5}
                  fill={INK_COLOR}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.7 }}
                  transition={{ delay: i * 0.15, duration: 0.2 }}
                  style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: INK_COLOR, opacity: 0.7 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Inkwell */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 'calc(50% - 18px)',
          width: 36,
          height: 20,
          background: 'rgba(44, 125, 160, 0.3)',
          borderRadius: '2px 2px 4px 4px',
          border: '1px solid rgba(44, 125, 160, 0.5)',
        }}
      >
        {/* Ink level */}
        <div
          style={{
            position: 'absolute',
            bottom: 2,
            left: 3,
            right: 3,
            height: 8,
            backgroundColor: INK_COLOR,
            borderRadius: '0 0 2px 2px',
            opacity: 0.6,
          }}
        />
      </div>

      {/* Quill pen */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 30,
          left: 'calc(50% - 8px)',
          zIndex: 2,
        }}
        animate={{
          y: quillY,
          x: quillX,
          rotate: quillRotation,
        }}
        transition={{
          duration: 0.4,
          ease: 'easeInOut',
        }}
      >
        <svg width="20" height="40" viewBox="0 0 20 40" fill="none">
          {/* Nib */}
          <path d="M10 0 L8 20 L10 25 L12 20 Z" fill={INK_COLOR} />
          {/* Shaft */}
          <line x1="10" y1="25" x2="10" y2="40" stroke={INK_COLOR} strokeWidth="1.5" strokeLinecap="round" />
          {/* Ink drip during lifting */}
          {phase === 'lifting' && (
            <circle cx="10" cy="26" r="1.5" fill={INK_COLOR} opacity="0.8">
              <animate attributeName="cy" from="26" to="32" dur="0.4s" fill="freeze" />
              <animate attributeName="opacity" from="0.8" to="0" dur="0.4s" fill="freeze" />
            </circle>
          )}
        </svg>
      </motion.div>
    </div>
  );
};
