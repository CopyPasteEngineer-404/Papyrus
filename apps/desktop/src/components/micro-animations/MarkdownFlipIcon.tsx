import React, { useEffect, useRef, useState } from 'react';

/**
 * MarkdownFlipIcon — subtle "page flip" animation on Y-axis.
 * The icon rotates with 3D perspective, like a page turning.
 * Duration: 400ms
 */
interface MarkdownFlipIconProps {
  trigger: boolean;
  size?: number;
  className?: string;
}

export const MarkdownFlipIcon: React.FC<MarkdownFlipIconProps> = ({
  trigger,
  size = 18,
  className = '',
}) => {
  const [animating, setAnimating] = useState(false);
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 420);
      return () => clearTimeout(timer);
    }
    prevTrigger.current = trigger;
  }, [trigger]);

  return (
    <span
      className={`inline-flex items-center justify-center ${animating ? 'micro-anim-md-flip' : ''} ${className}`}
      style={{ width: size, height: size, perspective: '400px' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Page/document icon with "M" for markdown */}
        <rect
          x="2"
          y="1"
          width="16"
          height="18"
          rx="2"
          stroke="var(--accent-md)"
          strokeWidth="1.5"
          fill="var(--bg-card)"
        />
        {/* Stylized M */}
        <path
          d="M5 14V7l2.5 3.5L10 7v7"
          stroke="var(--accent-md)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Down arrow */}
        <path
          d="M13 9v5m0 0l-1.5-1.5M13 14l1.5-1.5"
          stroke="var(--accent-md)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
