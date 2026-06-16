import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * DocDisintegrateAnimation — Halftone sidebar animation.
 *
 * Shows a document file that disintegrates into dots and restructures
 * itself into a different file format document. This replaces the
 * quill/inkwell animation per user request.
 *
 * Loop:
 *  1. document — A file icon with "MD" label
 *  2. disintegrating — File breaks into scattered dots
 *  3. restructuring — Dots reform into new shape
 *  4. new-document — A file icon with "TXT" label
 *  5. reset — Fade out and start over with different formats
 */

const ACCENT = '#2C7DA0';
const ACCENT_MUTED = 'rgba(44, 125, 160, 0.3)';
const DOT_COLOR = '#2C7DA0';

const FORMAT_CYCLE = [
  { from: 'MD', to: 'TXT', fromColor: '#2C7DA0', toColor: '#909090' },
  { from: 'CSV', to: 'MD', fromColor: '#2ec4b6', toColor: '#2C7DA0' },
  { from: 'MD', to: 'PDF', fromColor: '#2C7DA0', toColor: '#e63946' },
  { from: 'TXT', to: 'MD', fromColor: '#909090', toColor: '#2C7DA0' },
];

type Phase = 'document' | 'disintegrating' | 'restructuring' | 'new-document' | 'reset';

// Generate dot positions that form a document shape
function generateDocDots(centerX: number, centerY: number, scale: number = 1): Array<{ x: number; y: number; r: number }> {
  const dots: Array<{ x: number; y: number; r: number }> = [];
  // Document outline (rectangle with folded corner)
  const w = 16 * scale, h = 20 * scale;
  const foldSize = 4 * scale;

  // Top edge
  for (let x = -w / 2; x <= w / 2 - foldSize; x += 3 * scale) {
    dots.push({ x: centerX + x, y: centerY - h / 2, r: 1.2 * scale });
  }
  // Right edge (above fold)
  for (let y = -h / 2; y <= -h / 2 + foldSize; y += 3 * scale) {
    dots.push({ x: centerX + w / 2, y: centerY + y, r: 1.2 * scale });
  }
  // Fold diagonal
  for (let i = 0; i <= 4; i++) {
    dots.push({
      x: centerX + w / 2 - foldSize + (i * foldSize / 4),
      y: centerY - h / 2 + foldSize - (i * foldSize / 4),
      r: 1 * scale,
    });
  }
  // Right edge (below fold)
  for (let y = -h / 2 + foldSize; y <= h / 2; y += 3 * scale) {
    dots.push({ x: centerX + w / 2, y: centerY + y, r: 1.2 * scale });
  }
  // Bottom edge
  for (let x = -w / 2; x <= w / 2; x += 3 * scale) {
    dots.push({ x: centerX + x, y: centerY + h / 2, r: 1.2 * scale });
  }
  // Left edge
  for (let y = -h / 2; y <= h / 2; y += 3 * scale) {
    dots.push({ x: centerX - w / 2, y: centerY + y, r: 1.2 * scale });
  }
  // Content lines inside
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      dots.push({
        x: centerX - 5 * scale + col * 3 * scale,
        y: centerY - 2 * scale + row * 4 * scale,
        r: 0.8 * scale,
      });
    }
  }
  return dots;
}

// Generate scattered dot positions
function generateScatterDots(count: number, centerX: number, centerY: number, spread: number): Array<{ x: number; y: number; r: number; angle: number; dist: number }> {
  const dots: Array<{ x: number; y: number; r: number; angle: number; dist: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist = spread * (0.5 + Math.random() * 0.8);
    dots.push({
      x: centerX + Math.cos(angle) * dist,
      y: centerY + Math.sin(angle) * dist,
      r: 1 + Math.random() * 1.5,
      angle,
      dist,
    });
  }
  return dots;
}

export const DocDisintegrateAnimation: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('document');
  const [formatIndex, setFormatIndex] = useState(0);
  const [dots, setDots] = useState<Array<{ x: number; y: number; r: number }>>([]);
  const [scatterDots, setScatterDots] = useState<Array<{ x: number; y: number; r: number; angle: number; dist: number }>>([]);

  const currentFormat = FORMAT_CYCLE[formatIndex % FORMAT_CYCLE.length];

  useEffect(() => {
    const cx = 60, cy = 30;
    setDots(generateDocDots(cx, cy, 1));
    setScatterDots(generateScatterDots(40, cx, cy, 35));
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const startCycle = () => {
      setPhase('document');
      timers.push(setTimeout(() => setPhase('disintegrating'), 1500));
      timers.push(setTimeout(() => setPhase('restructuring'), 2800));
      timers.push(setTimeout(() => setPhase('new-document'), 3800));
      timers.push(setTimeout(() => {
        setPhase('reset');
        setFormatIndex(prev => prev + 1);
        // Regenerate dots for new format
        const cx = 60, cy = 30;
        setDots(generateDocDots(cx, cy, 1));
        setScatterDots(generateScatterDots(40, cx, cy, 35));
        timers.push(setTimeout(() => startCycle(), 800));
      }, 5200));
    };

    timers.push(setTimeout(() => startCycle(), 500));
    return () => timers.forEach(clearTimeout);
  }, [formatIndex]);

  const cx = 60, cy = 30;

  return (
    <div
      className="flex items-center justify-center w-full"
      style={{ height: 64, position: 'relative', overflow: 'hidden' }}
    >
      <svg width="120" height="60" viewBox="0 0 120 60" style={{ position: 'absolute' }}>
        {/* Phase: document shown */}
        {(phase === 'document' || phase === 'disintegrating') && (
          <>
            {/* File icon outline */}
            <motion.g
              initial={{ opacity: 1 }}
              animate={{ opacity: phase === 'disintegrating' ? 0 : 1 }}
              transition={{ duration: 0.6 }}
            >
              <rect
                x={cx - 14} y={cy - 18} width={28} height={36}
                rx={2} fill="none" stroke={currentFormat.fromColor}
                strokeWidth={1.5}
              />
              {/* Folded corner */}
              <path
                d={`M${cx + 14} ${cy - 18} L${cx + 6} ${cy - 18} L${cx + 14} ${cy - 10} Z`}
                fill={currentFormat.fromColor} opacity={0.3}
              />
              {/* Content lines */}
              {[0, 1, 2, 3].map(i => (
                <line
                  key={i}
                  x1={cx - 8} y1={cy - 8 + i * 6} x2={cx + 8} y2={cy - 8 + i * 6}
                  stroke={currentFormat.fromColor} strokeWidth={1} opacity={0.5}
                />
              ))}
              {/* Format label */}
              <text
                x={cx} y={cy + 22}
                textAnchor="middle"
                fontSize={8}
                fontWeight={900}
                fontFamily="monospace"
                fill={currentFormat.fromColor}
                letterSpacing="0.08em"
              >
                {currentFormat.from}
              </text>
            </motion.g>
          </>
        )}

        {/* Phase: dots disintegrating / restructuring */}
        {(phase === 'disintegrating' || phase === 'restructuring') && (
          <>
            {scatterDots.map((dot, i) => {
              const targetDist = phase === 'restructuring' ? 0 : dot.dist;
              const currentDist = phase === 'disintegrating' ? dot.dist : dot.dist;
              const targetX = phase === 'restructuring' ? dots[i % dots.length]?.x ?? dot.x : dot.x;
              const targetY = phase === 'restructuring' ? dots[i % dots.length]?.y ?? dot.y : dot.y;
              const fromX = cx + Math.cos(dot.angle) * dot.dist;
              const fromY = cy + Math.sin(dot.angle) * dot.dist;
              const toX = phase === 'restructuring' ? (dots[i % dots.length]?.x ?? fromX) : fromX;
              const toY = phase === 'restructuring' ? (dots[i % dots.length]?.y ?? fromY) : fromY;

              return (
                <motion.circle
                  key={i}
                  cx={phase === 'disintegrating' ? fromX : toX}
                  cy={phase === 'disintegrating' ? fromY : toY}
                  r={dot.r}
                  fill={DOT_COLOR}
                  opacity={phase === 'disintegrating' ? 0.8 : 0.6}
                  initial={{
                    cx: phase === 'disintegrating' ? (dots[i % dots.length]?.x ?? cx) : fromX,
                    cy: phase === 'disintegrating' ? (dots[i % dots.length]?.y ?? cy) : fromY,
                    opacity: 0,
                  }}
                  animate={{
                    cx: phase === 'disintegrating' ? fromX : toX,
                    cy: phase === 'disintegrating' ? fromY : toY,
                    opacity: phase === 'disintegrating' ? [0, 0.8] : [0.8, 0.6, 0],
                  }}
                  transition={{
                    duration: phase === 'disintegrating' ? 1.0 : 0.8,
                    delay: i * 0.02,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
          </>
        )}

        {/* Phase: new document */}
        {(phase === 'new-document' || phase === 'reset') && (
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: phase === 'reset' ? 0 : 1,
              scale: phase === 'reset' ? 0.6 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <rect
              x={cx - 14} y={cy - 18} width={28} height={36}
              rx={2} fill="none" stroke={currentFormat.toColor}
              strokeWidth={1.5}
            />
            {/* Folded corner */}
            <path
              d={`M${cx + 14} ${cy - 18} L${cx + 6} ${cy - 18} L${cx + 14} ${cy - 10} Z`}
              fill={currentFormat.toColor} opacity={0.3}
            />
            {/* Content lines */}
            {[0, 1, 2, 3].map(i => (
              <line
                key={i}
                x1={cx - 8} y1={cy - 8 + i * 6} x2={cx + 8} y2={cy - 8 + i * 6}
                stroke={currentFormat.toColor} strokeWidth={1} opacity={0.5}
              />
            ))}
            {/* Format label */}
            <text
              x={cx} y={cy + 22}
              textAnchor="middle"
              fontSize={8}
              fontWeight={900}
              fontFamily="monospace"
              fill={currentFormat.toColor}
              letterSpacing="0.08em"
            >
              {currentFormat.to}
            </text>
          </motion.g>
        )}

        {/* Arrow indicator between formats */}
        {phase === 'new-document' && (
          <motion.text
            x={cx} y={8}
            textAnchor="middle"
            fontSize={7}
            fontWeight={700}
            fontFamily="monospace"
            fill={ACCENT}
            opacity={0.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
          >
            {currentFormat.from} → {currentFormat.to}
          </motion.text>
        )}
      </svg>
    </div>
  );
};
