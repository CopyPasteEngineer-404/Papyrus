import { useEffect, useRef } from 'react';

const GOLD = '#C4A265';
const GOLD_LIGHT = '#D4B87A';
const GOLD_DIM = 'rgba(196, 162, 101, 0.25)';
const GOLD_GLOW = 'rgba(196, 162, 101, 0.08)';

export default function ThreeJsCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const glowPos = useRef({ x: 0, y: 0 });
  const isHovering = useRef(false);
  const isClicking = useRef(false);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!dot || !ring || !glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };

    const handleMouseDown = () => { isClicking.current = true; };
    const handleMouseUp = () => { isClicking.current = false; };

    const handleHoverStart = () => { isHovering.current = true; };
    const handleHoverEnd = () => { isHovering.current = false; };

    const interactiveSelectors = 'button, a, input, textarea, select, [role="button"], .clickable, label, [tabindex]:not([tabindex="-1"])';
    const interactiveElements = document.querySelectorAll(interactiveSelectors);
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleHoverStart);
      el.addEventListener('mouseleave', handleHoverEnd);
    });

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    function lerp(start: number, end: number, factor: number) {
      return start + (end - start) * factor;
    }

    let animId: number;
    function animate() {
      const ringSpeed = isHovering.current ? 0.14 : 0.09;
      const glowSpeed = isHovering.current ? 0.07 : 0.05;

      ringPos.current.x = lerp(ringPos.current.x, pos.current.x, ringSpeed);
      ringPos.current.y = lerp(ringPos.current.y, pos.current.y, ringSpeed);
      glowPos.current.x = lerp(glowPos.current.x, pos.current.x, glowSpeed);
      glowPos.current.y = lerp(glowPos.current.y, pos.current.y, glowSpeed);

      const ringScale = isHovering.current ? 2 : 1;
      const dotScale = isClicking.current ? 0.5 : isHovering.current ? 0.6 : 1;

      if (dot) {
        dot.style.transform = `translate(${pos.current.x - 3}px, ${pos.current.y - 3}px) scale(${dotScale})`;
        dot.style.background = isHovering.current ? GOLD_LIGHT : GOLD;
      }

      if (ring) {
        ring.style.transform = `translate(${ringPos.current.x - 16}px, ${ringPos.current.y - 16}px) scale(${ringScale})`;
        ring.style.borderColor = isHovering.current ? 'rgba(196, 162, 101, 0.5)' : GOLD_DIM;
        ring.style.boxShadow = isHovering.current
          ? '0 0 20px rgba(196, 162, 101, 0.15), inset 0 0 20px rgba(196, 162, 101, 0.08)'
          : '0 0 12px rgba(196, 162, 101, 0.08), inset 0 0 12px rgba(196, 162, 101, 0.03)';
      }

      if (glow) {
        glow.style.transform = `translate(${glowPos.current.x - 40}px, ${glowPos.current.y - 40}px)`;
        glow.style.background = isHovering.current
          ? 'radial-gradient(circle, rgba(196, 162, 101, 0.1) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(196, 162, 101, 0.04) 0%, transparent 70%)';
      }

      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleHoverStart);
        el.removeEventListener('mouseleave', handleHoverEnd);
      });
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: GOLD,
          boxShadow: `0 0 8px ${GOLD_DIM}, 0 0 20px rgba(196, 162, 101, 0.15)`,
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1.5px solid',
          borderColor: GOLD_DIM,
          background: 'rgba(196, 162, 101, 0.02)',
          boxShadow: '0 0 12px rgba(196, 162, 101, 0.08), inset 0 0 12px rgba(196, 162, 101, 0.03)',
          pointerEvents: 'none',
          zIndex: 99998,
          willChange: 'transform',
          transition: 'box-shadow 0.15s ease',
        }}
      />
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196, 162, 101, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 99997,
          willChange: 'transform',
        }}
      />
    </>
  );
}
