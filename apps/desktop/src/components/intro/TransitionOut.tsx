import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TransitionOut — Phase 3
 *
 * Wraps children and performs a smooth fade-out + slide-up
 * transition when `exiting` is true.
 *
 * Uses Framer Motion AnimatePresence for the exit animation.
 */

interface TransitionOutProps {
  /** Whether the transition-out animation should play */
  exiting: boolean;
  /** Callback when the exit animation completes */
  onExitComplete: () => void;
  /** Content to transition out */
  children: React.ReactNode;
  /** Use shrink-to-titlebar animation instead of fade-out */
  shrinkToTitlebar?: boolean;
}

export const TransitionOut: React.FC<TransitionOutProps> = ({
  exiting,
  onExitComplete,
  children,
  shrinkToTitlebar = false,
}) => {
  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {!exiting ? (
        <motion.div
          key="intro-content"
          style={{ display: 'contents' }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="intro-exiting"
          style={{ display: 'contents' }}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={
            shrinkToTitlebar
              ? { opacity: 0, scale: 0.15, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }
              : { opacity: 0, y: -20, scale: 1, transition: { duration: 0.3, ease: 'easeIn' } }
          }
          exit={{ opacity: 0 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
