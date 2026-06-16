import React from 'react';
import { motion } from 'framer-motion';

/**
 * Wordmark — Phase 2 + Phase 2.5
 *
 * "PAPYRUS" revealed letter-by-letter with Framer Motion stagger,
 * as if being handwritten by the quill.
 *
 * Phase 2.5: "Transform Documents" fades in below the wordmark.
 */

interface WordmarkProps {
  /** Whether the wordmark animation has started */
  visible: boolean;
  /** Base delay before the first letter appears (ms) */
  startDelay?: number;
  /** Time between each letter (ms) */
  staggerMs?: number;
  /** Whether the tagline should show */
  showTagline?: boolean;
}

const WORDMARK = 'PAPYRUS';
const TAGLINE = 'Transform Documents';

/** Papyrus manuscript yellow-brown */
const PAPYRUS_INK = '#C4A265';

export const Wordmark: React.FC<WordmarkProps> = ({
  visible,
  startDelay = 0,
  staggerMs = 80,
  showTagline = false,
}) => {
  if (!visible) return null;

  const letters = WORDMARK.split('');
  const staggerSec = staggerMs / 1000;
  const delaySec = startDelay / 1000;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Wordmark: letter-by-letter reveal with Framer Motion */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: '0.25em',
          color: PAPYRUS_INK,
          fontVariant: 'all-small-caps',
          textRendering: 'optimizeLegibility' as const,
        }}
        aria-label="Papyrus"
      >
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            style={{ display: 'inline-block' }}
            initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
            animate={{
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
            }}
            transition={{
              duration: 0.3,
              delay: delaySec + i * staggerSec,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Tagline: clean fade-in with Framer Motion */}
      {showTagline && (
        <motion.div
          style={{
            fontSize: 14,
            fontWeight: 400,
            letterSpacing: '0.08em',
            color: 'var(--fg-muted)',
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: delaySec + letters.length * staggerSec + 0.1,
            ease: 'easeOut',
          }}
        >
          {TAGLINE}
        </motion.div>
      )}
    </div>
  );
};
