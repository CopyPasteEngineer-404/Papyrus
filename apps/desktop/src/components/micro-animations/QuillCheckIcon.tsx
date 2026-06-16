import React, { useEffect, useRef, useState } from 'react';

/**
 * QuillCheckIcon — quill writes a checkmark.
 * The quill moves as if writing, and a checkmark appears.
 * Duration: 800ms
 */
interface QuillCheckIconProps {
  trigger: boolean;
  size?: number;
  className?: string;
}

export const QuillCheckIcon: React.FC<QuillCheckIconProps> = ({
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
      className={`inline-flex items-center justify-center ${animating ? 'micro-anim-quill-write' : ''} ${className}`}
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
        {/* Quill pen */}
        <path
          d="M4 16 L12 3"
          stroke="var(--accent-primary)"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Vane */}
        <path
          d="M12 3 C10 5, 7 8, 4 11 L5.5 9.5 C7.5 7.5, 10 5, 12 3Z"
          fill="var(--accent-primary)"
          fillOpacity="0.2"
          stroke="var(--accent-primary)"
          strokeWidth="0.6"
        />
        {/* Nib */}
        <path
          d="M4 16 L3 17.5 L4.5 16.5 Z"
          fill="var(--accent-primary)"
        />

        {/* Animated checkmark appearing below quill */}
        {animating && (
          <path
            d="M6 13 L9 16 L15 9"
            stroke="var(--status-success)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="micro-anim-quill-check"
          />
        )}
      </svg>
    </span>
  );
};
