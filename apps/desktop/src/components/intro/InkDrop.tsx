import React from 'react';
import { motion } from 'framer-motion';

/**
 * InkDrop — Phase 1a
 *
 * A small ink drop that falls from above using Framer Motion,
 * creating a subtle splash/ripple effect on impact.
 * Colors use papyrus yellow-brown for manuscript theme consistency.
 */

const PAPYRUS_INK = '#C4A265';
const PAPYRUS_INK_DARK = '#A68B4B';

export const InkDrop: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 60, height: 60 }}>
      {/* The falling ink drop */}
      <motion.div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: PAPYRUS_INK,
          position: 'absolute',
        }}
        initial={{ y: -80, scale: 0.4, opacity: 0 }}
        animate={{
          y: [null, 0, 4, 0],
          scale: [0.4, 1, 1.15, 1],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 2.0,
          times: [0, 0.7, 0.85, 1],
          ease: [0.4, 0, 0.6, 1],
        }}
      />

      {/* Ripple ring that appears on impact */}
      <motion.div
        style={{
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: `1px solid ${PAPYRUS_INK}`,
          pointerEvents: 'none',
        }}
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{
          duration: 0.6,
          delay: 0.75,
          ease: 'easeOut',
        }}
      />

      {/* Second ripple — slightly delayed */}
      <motion.div
        style={{
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: `1px solid ${PAPYRUS_INK_DARK}`,
          pointerEvents: 'none',
        }}
        initial={{ scale: 0, opacity: 0.4 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.85,
          ease: 'easeOut',
        }}
      />

      {/* Splash/splash gradient that expands */}
      <motion.div
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${PAPYRUS_INK} 0%, transparent 70%)`,
          pointerEvents: 'none',
          position: 'absolute',
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: [0, 1.2, 1],
          opacity: [1, 0.9, 0],
        }}
        transition={{
          duration: 0.5,
          delay: 0.7,
          ease: 'easeOut',
        }}
      />
    </div>
  );
};
