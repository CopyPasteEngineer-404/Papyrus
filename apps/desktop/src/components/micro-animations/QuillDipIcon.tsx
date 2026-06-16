import React, { useEffect, useRef, useState } from 'react';

/**
 * QuillDipIcon — quill dips into ink and comes back colored.
 * The quill icon tilts down, dips, and returns with an ink color change.
 * Duration: 1000ms
 */
interface QuillDipIconProps {
  trigger: boolean;
  size?: number;
  className?: string;
}

export const QuillDipIcon: React.FC<QuillDipIconProps> = ({
  trigger,
  size = 18,
  className = '',
}) => {
  const [animating, setAnimating] = useState(false);
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 1020);
      return () => clearTimeout(timer);
    }
    prevTrigger.current = trigger;
  }, [trigger]);

  return (
    <span
      className={`inline-flex items-center justify-center ${animating ? 'micro-anim-quill-dip' : ''} ${className}`}
      style={{ width: size, height: size, transformOrigin: 'bottom center' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Quill pen icon */}
        {/* Shaft */}
        <path
          d="M4 18 L14 4"
          stroke={animating ? 'var(--accent-primary)' : 'var(--fg-muted)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          className={animating ? 'micro-anim-quill-ink-fill' : ''}
          fill="none"
        />
        {/* Left vane */}
        <path
          d="M14 4 C12 6, 8 9, 4 12 L6 10 C8 8, 11 6, 14 4Z"
          fill={animating ? 'var(--accent-primary)' : 'var(--fg-muted)'}
          fillOpacity={animating ? 0.3 : 0.15}
          stroke="var(--fg-muted)"
          strokeWidth="0.8"
          className={animating ? 'micro-anim-quill-ink-fill' : ''}
        />
        {/* Right vane */}
        <path
          d="M14 4 C14 7, 14 11, 12 15 L13 13 C14 10, 14 7, 14 4Z"
          fill={animating ? 'var(--accent-primary)' : 'var(--fg-muted)'}
          fillOpacity={animating ? 0.3 : 0.15}
          stroke="var(--fg-muted)"
          strokeWidth="0.8"
          className={animating ? 'micro-anim-quill-ink-fill' : ''}
        />
        {/* Nib */}
        <path
          d="M4 18 L3 19 L4.5 18.5 Z"
          fill={animating ? 'var(--accent-primary)' : 'var(--fg-muted)'}
          className={animating ? 'micro-anim-quill-ink-fill' : ''}
        />
        {/* Ink dot at nib */}
        {animating && (
          <circle
            cx="3.5"
            cy="19"
            r="1"
            fill="var(--accent-primary)"
            opacity="0.6"
          />
        )}
      </svg>
    </span>
  );
};
