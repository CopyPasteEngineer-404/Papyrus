import React, { useEffect, useRef, useState } from 'react';

/**
 * MermaidFlowIcon — amber "flow" animation along diagram lines.
 * The icon's lines get a flowing highlight (like electricity flowing).
 * Duration: 800ms
 */
interface MermaidFlowIconProps {
  trigger: boolean;
  size?: number;
  className?: string;
}

export const MermaidFlowIcon: React.FC<MermaidFlowIconProps> = ({
  trigger,
  size = 18,
  className = '',
}) => {
  const [animating, setAnimating] = useState(false);
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 820);
      return () => clearTimeout(timer);
    }
    prevTrigger.current = trigger;
  }, [trigger]);

  return (
    <span
      className={`inline-flex items-center justify-center ${animating ? 'micro-anim-mmd-glow' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Flowchart diagram icon */}
        {/* Top box */}
        <rect
          x="7"
          y="1"
          width="6"
          height="4"
          rx="1"
          stroke="var(--accent-mmd)"
          strokeWidth="1.3"
          fill="var(--bg-card)"
        />
        {/* Left box */}
        <rect
          x="1"
          y="11"
          width="6"
          height="4"
          rx="1"
          stroke="var(--accent-mmd)"
          strokeWidth="1.3"
          fill="var(--bg-card)"
        />
        {/* Right box */}
        <rect
          x="13"
          y="11"
          width="6"
          height="4"
          rx="1"
          stroke="var(--accent-mmd)"
          strokeWidth="1.3"
          fill="var(--bg-card)"
        />
        {/* Connector lines */}
        <path
          d="M10 5 L10 8 L4 8 L4 11"
          stroke="var(--accent-mmd)"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animating ? 'micro-anim-mmd-flow' : ''}
        />
        <path
          d="M10 5 L10 8 L16 8 L16 11"
          stroke="var(--accent-mmd)"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animating ? 'micro-anim-mmd-flow' : ''}
          style={animating ? { animationDelay: '150ms' } : undefined}
        />
        {/* Bottom diamond */}
        <path
          d="M7 18 L10 15.5 L13 18 L10 20.5 Z"
          stroke="var(--accent-mmd)"
          strokeWidth="1.2"
          fill="var(--bg-card)"
          transform="translate(0, -2)"
        />
      </svg>
    </span>
  );
};
