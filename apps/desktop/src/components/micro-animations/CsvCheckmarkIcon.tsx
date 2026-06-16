import React, { useEffect, useRef, useState } from 'react';

/**
 * CsvCheckmarkIcon — pulse + green checkmark ripple.
 * The CSV icon pulses, then a circular ripple + checkmark appears.
 * Duration: 600ms
 */
interface CsvCheckmarkIconProps {
  trigger: boolean;
  size?: number;
  className?: string;
}

export const CsvCheckmarkIcon: React.FC<CsvCheckmarkIconProps> = ({
  trigger,
  size = 18,
  className = '',
}) => {
  const [animating, setAnimating] = useState(false);
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 620);
      return () => clearTimeout(timer);
    }
    prevTrigger.current = trigger;
  }, [trigger]);

  return (
    <span
      className={`inline-flex items-center justify-center relative ${animating ? 'micro-anim-csv-pulse' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ripple ring */}
      {animating && (
        <span
          className="absolute inset-0 micro-anim-csv-ripple rounded-full"
          style={{
            border: `1.5px solid var(--status-success)`,
            borderRadius: '50%',
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Grid/table icon for CSV */}
        <rect
          x="2"
          y="2"
          width="16"
          height="16"
          rx="2"
          stroke="var(--accent-csv)"
          strokeWidth="1.5"
          fill="var(--bg-card)"
        />
        {/* Grid lines */}
        <line x1="2" y1="7" x2="18" y2="7" stroke="var(--accent-csv)" strokeWidth="1" opacity="0.5" />
        <line x1="2" y1="12" x2="18" y2="12" stroke="var(--accent-csv)" strokeWidth="1" opacity="0.5" />
        <line x1="8" y1="2" x2="8" y2="18" stroke="var(--accent-csv)" strokeWidth="1" opacity="0.5" />
        <line x1="13" y1="2" x2="13" y2="18" stroke="var(--accent-csv)" strokeWidth="1" opacity="0.5" />

        {/* Animated checkmark overlay */}
        {animating && (
          <path
            d="M6 10l3 3 5-6"
            stroke="var(--status-success)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="micro-anim-csv-check"
          />
        )}
      </svg>
    </span>
  );
};
