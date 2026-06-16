import React, { useEffect, useRef, useState } from 'react';

/**
 * QuillErrorIcon — quill scratches out with X motion.
 * The quill shakes and makes an X scratch motion.
 * Duration: 500ms
 */
interface QuillErrorIconProps {
  trigger: boolean;
  size?: number;
  className?: string;
}

export const QuillErrorIcon: React.FC<QuillErrorIconProps> = ({
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
      className={`inline-flex items-center justify-center ${animating ? 'micro-anim-quill-scratch' : ''} ${className}`}
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
          stroke="var(--status-error)"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Vane */}
        <path
          d="M12 3 C10 5, 7 8, 4 11 L5.5 9.5 C7.5 7.5, 10 5, 12 3Z"
          fill="var(--status-error)"
          fillOpacity="0.15"
          stroke="var(--status-error)"
          strokeWidth="0.6"
        />
        {/* Nib */}
        <path
          d="M4 16 L3 17.5 L4.5 16.5 Z"
          fill="var(--status-error)"
        />

        {/* Animated X scratch */}
        {animating && (
          <>
            <line
              x1="7"
              y1="12"
              x2="13"
              y2="18"
              stroke="var(--status-error)"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="micro-anim-quill-x"
            />
            <line
              x1="13"
              y1="12"
              x2="7"
              y2="18"
              stroke="var(--status-error)"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="micro-anim-quill-x"
              style={{ animationDelay: '300ms' }}
            />
          </>
        )}
      </svg>
    </span>
  );
};
