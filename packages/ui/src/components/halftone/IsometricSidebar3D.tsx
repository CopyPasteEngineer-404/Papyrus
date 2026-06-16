import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * IsometricSidebar3D — 3D animated objects for the Isometric theme sidebar.
 *
 * Shows rotating, morphing, and writing 3D isometric objects.
 * Subtle, non-distracting animation that loops continuously.
 * Only visible in the isometric theme skin.
 *
 * Cycle through shapes:
 *  1. Rotating isometric cube
 *  2. Morphing sphere/icosahedron
 *  3. Writing pen/quill in isometric view
 *  4. Rotating prism
 */

const ISO_ACCENT = '#6C8EBF';
const ISO_ACCENT_LIGHT = '#8AA8D0';
const ISO_ACCENT_DARK = '#4A6FA0';

const SHAPE_DURATION = 5000; // ms per shape

// ─── Isometric Cube ───
const IsoRotatingCube: React.FC = () => {
  const size = 28;
  const dx = size * Math.cos(Math.PI / 6);
  const dy = size * Math.sin(Math.PI / 6);

  return (
    <motion.svg
      width="100" height="60" viewBox="-50 -30 100 60"
      initial={{ rotateY: 0 }}
      animate={{ rotateY: [0, 90, 180, 270, 360] }}
      transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
      style={{ perspective: 200 }}
    >
      {/* Left face */}
      <motion.polygon
        points={`0,${-size * 0.5} ${-dx},${-size * 0.5 + dy} ${-dx},${dy} 0,${size * 0.5}`}
        fill={ISO_ACCENT_DARK}
        stroke={ISO_ACCENT_LIGHT}
        strokeWidth="0.8"
        opacity="0.85"
        animate={{ opacity: [0.85, 0.7, 0.85] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* Right face */}
      <motion.polygon
        points={`0,${-size * 0.5} ${dx},${-size * 0.5 + dy} ${dx},${dy} 0,${size * 0.5}`}
        fill={ISO_ACCENT}
        stroke={ISO_ACCENT_LIGHT}
        strokeWidth="0.8"
        opacity="0.9"
        animate={{ opacity: [0.9, 0.75, 0.9] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />
      {/* Top face */}
      <motion.polygon
        points={`0,${-size * 0.5} ${dx},${-size * 0.5 + dy} 0,0 ${-dx},${-size * 0.5 + dy}`}
        fill={ISO_ACCENT_LIGHT}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.5"
        opacity="0.95"
      />
    </motion.svg>
  );
};

// ─── Isometric Prism (triangular) ───
const IsoPrism: React.FC = () => {
  return (
    <motion.svg
      width="100" height="60" viewBox="-50 -30 100 60"
      animate={{ rotateZ: [0, 2, -2, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Base triangle */}
      <polygon
        points="0,-18 20,8 -20,8"
        fill={ISO_ACCENT_DARK}
        stroke={ISO_ACCENT_LIGHT}
        strokeWidth="0.8"
        opacity="0.8"
      />
      {/* Right face */}
      <polygon
        points="0,-18 20,8 20,16 0,-10"
        fill={ISO_ACCENT}
        stroke={ISO_ACCENT_LIGHT}
        strokeWidth="0.8"
        opacity="0.85"
      />
      {/* Left face */}
      <polygon
        points="0,-18 -20,8 -20,16 0,-10"
        fill={ISO_ACCENT_DARK}
        stroke={ISO_ACCENT_LIGHT}
        strokeWidth="0.8"
        opacity="0.7"
      />
      {/* Bottom edge */}
      <polygon
        points="-20,8 20,8 20,16 -20,16"
        fill={ISO_ACCENT_DARK}
        stroke={ISO_ACCENT_LIGHT}
        strokeWidth="0.8"
        opacity="0.6"
      />
    </motion.svg>
  );
};

// ─── Isometric Cylinder ───
const IsoCylinder: React.FC = () => {
  return (
    <motion.svg
      width="100" height="60" viewBox="-50 -30 100 60"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Bottom ellipse */}
      <ellipse cx="0" cy="12" rx="18" ry="6"
        fill={ISO_ACCENT_DARK} stroke={ISO_ACCENT_LIGHT} strokeWidth="0.8" opacity="0.6" />
      {/* Body */}
      <rect x="-18" y="-10" width="36" height="22"
        fill={ISO_ACCENT} stroke="none" opacity="0.8" />
      <line x1="-18" y1="-10" x2="-18" y2="12" stroke={ISO_ACCENT_LIGHT} strokeWidth="0.8" />
      <line x1="18" y1="-10" x2="18" y2="12" stroke={ISO_ACCENT_LIGHT} strokeWidth="0.8" />
      {/* Top ellipse */}
      <ellipse cx="0" cy="-10" rx="18" ry="6"
        fill={ISO_ACCENT_LIGHT} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" opacity="0.9" />
    </motion.svg>
  );
};

// ─── Isometric Writing Pen ───
const IsoWritingPen: React.FC = () => {
  return (
    <motion.svg
      width="100" height="60" viewBox="-50 -30 100 60"
    >
      {/* Paper */}
      <motion.rect
        x="-20" y="-14" width="40" height="28" rx={2}
        fill="rgba(108, 142, 191, 0.1)"
        stroke={ISO_ACCENT}
        strokeWidth="0.8"
        opacity="0.6"
      />
      {/* Lines on paper */}
      {[-6, 0, 6].map((y, i) => (
        <motion.line
          key={i}
          x1="-14" y1={y} x2={10} y2={y}
          stroke={ISO_ACCENT}
          strokeWidth="0.5"
          opacity="0.3"
          initial={{ x2: -14 }}
          animate={{ x2: [0, 6, 10] }}
          transition={{
            duration: 2,
            delay: i * 0.8,
            repeat: Infinity,
            repeatDelay: 4,
          }}
        />
      ))}
      {/* Pen */}
      <motion.g
        animate={{ x: [-8, 6, -8], rotate: [-15, -5, -15] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <line x1="0" y1="-8" x2="0" y2="4" stroke={ISO_ACCENT} strokeWidth="1.5" />
        <polygon points="0,4 -2,8 2,8" fill={ISO_ACCENT} opacity="0.8" />
      </motion.g>
    </motion.svg>
  );
};

type ShapeType = 'cube' | 'prism' | 'cylinder' | 'pen';

export const IsometricSidebar3D: React.FC = () => {
  const [currentShape, setCurrentShape] = useState<ShapeType>('cube');

  useEffect(() => {
    const shapes: ShapeType[] = ['cube', 'prism', 'cylinder', 'pen'];
    let idx = 0;

    const timer = setInterval(() => {
      idx = (idx + 1) % shapes.length;
      setCurrentShape(shapes[idx]);
    }, SHAPE_DURATION);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex items-center justify-center w-full"
      style={{ height: 72, position: 'relative', overflow: 'hidden' }}
    >
      <motion.div
        key={currentShape}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5 }}
      >
        {currentShape === 'cube' && <IsoRotatingCube />}
        {currentShape === 'prism' && <IsoPrism />}
        {currentShape === 'cylinder' && <IsoCylinder />}
        {currentShape === 'pen' && <IsoWritingPen />}
      </motion.div>
    </div>
  );
};
