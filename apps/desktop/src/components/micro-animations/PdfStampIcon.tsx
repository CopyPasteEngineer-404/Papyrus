import React, { useEffect, useRef, useState } from 'react';

/**
 * PdfStampIcon — "stamp" bounce animation.
 * The icon drops down slightly, bounces up, and settles with spring physics.
 * Duration: 500ms
 */
interface PdfStampIconProps {
  trigger: boolean;
  size?: number;
  className?: string;
}

export const PdfStampIcon: React.FC<PdfStampIconProps> = ({
  trigger,
  size = 18,
  className = '',
}) => {
  const [animating, setAnimating] = useState(false);
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 520);
      return () => clearTimeout(timer);
    }
    prevTrigger.current = trigger;
  }, [trigger]);

  return (
    <span
      className={`inline-flex items-center justify-center ${animating ? 'micro-anim-pdf-stamp' : ''} ${className}`}
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
        {/* PDF document icon */}
        <rect
          x="2"
          y="1"
          width="16"
          height="18"
          rx="2"
          stroke="var(--accent-pdf)"
          strokeWidth="1.5"
          fill="var(--bg-card)"
        />
        {/* Corner fold */}
        <path
          d="M13 1v5h5"
          stroke="var(--accent-pdf)"
          strokeWidth="1.2"
          strokeLinejoin="round"
          fill="var(--bg-surface)"
        />
        {/* "PDF" text lines */}
        <line x1="5" y1="10" x2="15" y2="10" stroke="var(--accent-pdf)" strokeWidth="1" opacity="0.6" />
        <line x1="5" y1="12.5" x2="15" y2="12.5" stroke="var(--accent-pdf)" strokeWidth="1" opacity="0.6" />
        <line x1="5" y1="15" x2="11" y2="15" stroke="var(--accent-pdf)" strokeWidth="1" opacity="0.6" />
      </svg>
    </span>
  );
};
