import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  FolderOpen,
  ListTodo,
  Download,
  Settings,
  Circle,
  Eye,
} from 'lucide-react';
import clsx from 'clsx';
import {
  HalftoneSearchIcon,
  HalftoneFolderIcon,
  HalftoneListIcon,
  HalftoneDownloadIcon,
  HalftoneSettingsIcon,
} from '../halftone/HalftoneDottedIcons';
import { DocDisintegrateAnimation } from '../halftone/DocDisintegrateAnimation';
import { IsometricSidebar3D } from '../halftone/IsometricSidebar3D';

// ─── Minimal Art: Pixel particles forming a document shape ───
// Small circles/pixels drift in from scattered positions and settle into
// the outline of a document, then slowly disperse and reform in a loop.
const MA_ACCENT = '#C87941';
const MA_ACCENT_LIGHT = '#D48E58';

/** Document shape defined as a grid of 0/1 values */
const DOC_SHAPE = [
  [0,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,1],
  [1,0,0,1,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,0,0,0,1],
  [1,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1],
];

interface Dot {
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  size: number;
  opacity: number;
  delay: number;
}

const MinimalArtDocAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dotsRef = useRef<Dot[]>([]);
  const phaseRef = useRef<'assembling' | 'holding' | 'dispersing'>('assembling');
  const phaseStartRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 180;
    const H = 60;
    canvas.width = W * 2; // retina
    canvas.height = H * 2;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(2, 2);

    // Generate dots from the document shape
    const dotSize = 4;
    const gap = 2;
    const cellSize = dotSize + gap;
    const docW = DOC_SHAPE[0].length * cellSize;
    const docH = DOC_SHAPE.length * cellSize;
    const offsetX = (W - docW) / 2;
    const offsetY = (H - docH) / 2;

    const dots: Dot[] = [];
    for (let row = 0; row < DOC_SHAPE.length; row++) {
      for (let col = 0; col < DOC_SHAPE[row].length; col++) {
        if (DOC_SHAPE[row][col] === 1) {
          const tx = offsetX + col * cellSize + dotSize / 2;
          const ty = offsetY + row * cellSize + dotSize / 2;
          // Scatter start positions
          const angle = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 50;
          dots.push({
            targetX: tx,
            targetY: ty,
            startX: tx + Math.cos(angle) * dist,
            startY: ty + Math.sin(angle) * dist,
            currentX: tx + Math.cos(angle) * dist,
            currentY: ty + Math.sin(angle) * dist,
            size: dotSize * (0.6 + Math.random() * 0.4),
            opacity: 0.2 + Math.random() * 0.3,
            delay: (row * DOC_SHAPE[0].length + col) * 30,
          });
        }
      }
    }
    dotsRef.current = dots;
    phaseRef.current = 'assembling';
    phaseStartRef.current = performance.now();

    const ASSEMBLE_DURATION = 2000;
    const HOLD_DURATION = 3000;
    const DISPERSE_DURATION = 1500;

    function animate(time: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const elapsed = time - phaseStartRef.current;

      if (phaseRef.current === 'assembling') {
        const progress = Math.min(1, elapsed / ASSEMBLE_DURATION);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        dots.forEach(dot => {
          const dotProgress = Math.max(0, Math.min(1, (elapsed - dot.delay) / (ASSEMBLE_DURATION - dot.delay)));
          const dotEase = 1 - Math.pow(1 - dotProgress, 3);
          dot.currentX = dot.startX + (dot.targetX - dot.startX) * dotEase;
          dot.currentY = dot.startY + (dot.targetY - dot.startY) * dotEase;
        });

        if (progress >= 1) {
          phaseRef.current = 'holding';
          phaseStartRef.current = time;
        }
      } else if (phaseRef.current === 'holding') {
        // Gentle breathing while holding shape
        dots.forEach((dot, i) => {
          const breath = Math.sin(time / 800 + i * 0.2) * 0.5;
          dot.currentX = dot.targetX + breath;
          dot.currentY = dot.targetY + breath * 0.5;
        });

        if (elapsed >= HOLD_DURATION) {
          phaseRef.current = 'dispersing';
          phaseStartRef.current = time;
          // Set new scatter targets
          dots.forEach(dot => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 50;
            dot.startX = dot.currentX;
            dot.startY = dot.currentY;
            dot.targetX = offsetX + Math.random() * docW;
            dot.targetY = offsetY + Math.random() * docH;
            // Scatter outward
            dot.targetX = dot.currentX + Math.cos(angle) * dist;
            dot.targetY = dot.currentY + Math.sin(angle) * dist;
          });
        }
      } else if (phaseRef.current === 'dispersing') {
        const progress = Math.min(1, elapsed / DISPERSE_DURATION);
        const ease = progress * progress; // ease-in

        dots.forEach(dot => {
          dot.currentX = dot.startX + (dot.targetX - dot.startX) * ease;
          dot.currentY = dot.startY + (dot.targetY - dot.startY) * ease;
        });

        if (progress >= 1) {
          // Reset for new assembly cycle
          phaseRef.current = 'assembling';
          phaseStartRef.current = time;
          dots.forEach(dot => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 50;
            dot.startX = dot.currentX;
            dot.startY = dot.currentY;
            // Reset target to document shape
            const row = DOC_SHAPE.findIndex(r => true); // just reuse original
            dot.targetX = dot.targetX; // keep old target for next assembly
            dot.targetY = dot.targetY;
          });
          // Re-generate targets from shape
          let dotIdx = 0;
          for (let row = 0; row < DOC_SHAPE.length; row++) {
            for (let col = 0; col < DOC_SHAPE[row].length; col++) {
              if (DOC_SHAPE[row][col] === 1 && dotIdx < dots.length) {
                dots[dotIdx].targetX = offsetX + col * cellSize + dotSize / 2;
                dots[dotIdx].targetY = offsetY + row * cellSize + dotSize / 2;
                dots[dotIdx].delay = (row * DOC_SHAPE[0].length + col) * 30;
                dotIdx++;
              }
            }
          }
        }
      }

      // Draw dots
      dots.forEach((dot, i) => {
        const isEdge = i === 0 || i === dots.length - 1 || i % 7 === 0;
        ctx.beginPath();
        ctx.arc(dot.currentX, dot.currentY, dot.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = isEdge ? MA_ACCENT_LIGHT : MA_ACCENT;
        ctx.globalAlpha = dot.opacity + (phaseRef.current === 'holding' ? 0.3 : 0);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="minimalart-float flex items-center justify-center" style={{ height: 60 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} aria-hidden="true" role="presentation" />
    </div>
  );
};

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  navItems: NavItem[];
  activeNav: string;
  onNavClick: (id: string) => void;
  workspaceName: string;
  aiProvider: string;
  aiOnline: boolean;
  recentTasks: Array<{
    id: string;
    label: string;
    formats: string[];
    status: string;
    timeAgo: string;
  }>;
  themeSkin?: 'papyrus' | 'halftone' | 'isometric' | 'minimalart' | 'threejs';
  clockWidget?: React.ReactNode;
}

/** Map icon name strings to Lucide components */
const iconMap: Record<string, typeof Search> = {
  Search,
  FolderOpen,
  ListTodo,
  Download,
  Settings,
  Eye,
};

/** Map icon name strings to Halftone dot icon components */
const halftoneIconMap: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Search: HalftoneSearchIcon,
  FolderOpen: HalftoneFolderIcon,
  ListTodo: HalftoneListIcon,
  Download: HalftoneDownloadIcon,
  Settings: HalftoneSettingsIcon,
  Eye: HalftoneSearchIcon, // Reuse search icon as viewer for halftone
};

export const Sidebar: React.FC<SidebarProps> = ({
  navItems, activeNav, onNavClick, workspaceName, aiProvider, aiOnline, recentTasks, themeSkin = 'papyrus', clockWidget,
}) => {
  const isHalftone = themeSkin === 'halftone';
  const isIsometric = themeSkin === 'isometric';
  const isMinimalArt = themeSkin === 'minimalart';

  // Get the appropriate animation class for the aside
  const getAsideClassName = () => {
    const base = 'flex flex-col h-full border-r border-border bg-background-secondary flex-shrink-0 w-sidebar';
    if (isIsometric) return `${base} isometric-pulse`;
    if (isMinimalArt) return `${base} minimalart-pulse`;
    return base;
  };

  // Get the appropriate nav animation class
  const getNavClassName = () => {
    const base = 'flex-1 px-2 py-2 space-y-1';
    if (isIsometric) return `${base} isometric-tab-enter`;
    if (isMinimalArt) return `${base} minimalart-tab-enter`;
    return base;
  };

  return (
    <aside className={getAsideClassName()} aria-label="Sidebar">
      {/* Workspace Info */}
      <div className="px-4 py-3 border-b border-border">
        <div className={`text-sm font-semibold text-foreground truncate ${isHalftone ? 'uppercase tracking-wider' : ''} ${isMinimalArt ? 'font-light tracking-wide' : ''}`}>
          {workspaceName}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="relative flex h-2 w-2">
            {aiOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            )}
            <Circle
              size={8}
              className={clsx(
                'relative inline-flex rounded-full',
                aiOnline ? 'text-success fill-success' : 'text-foreground-dim fill-foreground-dim'
              )}
            />
          </span>
          <span className="text-xs text-foreground-muted">{aiProvider}</span>
          <span className="sr-only">{aiOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={getNavClassName()} aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;

          // Use halftone dotted icons when halftone skin is active
          if (isHalftone) {
            const HalftoneIconComponent = halftoneIconMap[item.icon];
            return (
              <button
                key={item.id}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-fast',
                  isActive
                    ? 'bg-accent-muted text-accent font-semibold uppercase tracking-wider comic-border-accent'
                    : 'text-foreground-muted hover:bg-hover hover:text-foreground'
                )}
                style={isActive ? { border: '2px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)' } : {}}
                onClick={() => onNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                {HalftoneIconComponent && <HalftoneIconComponent size={18} color="currentColor" />}
                <span className="font-bold">{item.label.toUpperCase()}</span>
              </button>
            );
          }

          const IconComponent = iconMap[item.icon];
          return (
            <button
              key={item.id}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-accent-muted text-accent font-medium'
                  : 'text-foreground-muted hover:bg-hover hover:text-foreground',
                isMinimalArt && 'rounded-xl'
              )}
              onClick={() => onNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              {IconComponent && <IconComponent size={18} />}
              <span className={isMinimalArt && isActive ? 'tracking-wide' : ''}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Halftone: Document disintegration animation in sidebar */}
      {isHalftone && (
        <div className="px-3 py-2 border-t border-border">
          <DocDisintegrateAnimation />
        </div>
      )}

      {/* Isometric: 3D rotating/morphing objects in sidebar */}
      {isIsometric && (
        <div className="px-3 py-2 border-t border-border">
          <IsometricSidebar3D />
        </div>
      )}

      {/* Minimal Art: Pixel/dot particles forming a document shape */}
      {isMinimalArt && (
        <div className="px-3 py-2 border-t border-border">
          <MinimalArtDocAnimation />
        </div>
      )}

      {/* Clock Widget */}
      {clockWidget && (
        <div className="px-3 py-2 border-t border-border flex items-center justify-center">
          {clockWidget}
        </div>
      )}

      {/* Recent Tasks */}
      {recentTasks.length > 0 && (
        <div className="px-3 py-3 border-t border-border">
          <div className={`text-xs font-semibold text-foreground-dim uppercase tracking-wider mb-2 ${isHalftone ? 'font-black' : ''} ${isMinimalArt ? 'font-light tracking-widest' : ''}`}>
            Recent
          </div>
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <div key={task.id} className="text-xs">
                <div className={`text-foreground-secondary truncate ${isHalftone ? 'font-semibold' : ''} ${isMinimalArt ? 'font-light' : ''}`}>{task.label}</div>
                <div className="text-foreground-dim">
                  {task.formats.join(', ').toUpperCase()} · {task.timeAgo}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
