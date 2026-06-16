import React from 'react';

/**
 * HalftoneDottedIcons — Custom halftone-dot styled SVG icons for the Halftone theme.
 *
 * Every icon is rendered with circular halftone dots instead of solid fills,
 * giving the retro comic/newsprint aesthetic. Used throughout the UI when
 * the halftone skin is active.
 */

interface HalftoneIconProps {
  size?: number;
  color?: string;
  className?: string;
}

// ─── Papyrus Logo (dotted quill) ───
export const HalftonePapyrusLogo: React.FC<HalftoneIconProps> = ({ size = 24, color }) => {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="4" r="1.5" fill={c} />
      <circle cx="14" cy="7" r="1.2" fill={c} />
      <circle cx="18" cy="7" r="1.2" fill={c} />
      <circle cx="12" cy="10" r="1" fill={c} />
      <circle cx="16" cy="9" r="1" fill={c} />
      <circle cx="20" cy="10" r="1" fill={c} />
      <circle cx="10" cy="13" r="1" fill={c} />
      <circle cx="16" cy="12" r="1.2" fill={c} />
      <circle cx="22" cy="13" r="1" fill={c} />
      <circle cx="9" cy="16" r="0.8" fill={c} />
      <circle cx="16" cy="15" r="1" fill={c} />
      <circle cx="23" cy="16" r="0.8" fill={c} />
      <circle cx="16" cy="18" r="1" fill={c} />
      <circle cx="16" cy="21" r="1" fill={c} />
      <circle cx="16" cy="24" r="1.2" fill={c} />
      <circle cx="16" cy="27" r="1.5" fill={c} />
      <circle cx="15" cy="29" r="0.8" fill={c} />
      <circle cx="17" cy="29" r="0.8" fill={c} />
    </svg>
  );
};

// ─── PDF icon (dotted page with P) ───
export const HalftonePdfIcon: React.FC<HalftoneIconProps> = ({ size = 18, color }) => {
  const c = color || '#e63946';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="3" r="0.8" fill={c} /><circle cx="9" cy="3" r="0.8" fill={c} />
      <circle cx="12" cy="3" r="0.8" fill={c} /><circle cx="6" cy="6" r="0.8" fill={c} />
      <circle cx="18" cy="6" r="0.8" fill={c} /><circle cx="6" cy="18" r="0.8" fill={c} />
      <circle cx="9" cy="21" r="0.8" fill={c} /><circle cx="12" cy="21" r="0.8" fill={c} />
      <circle cx="15" cy="21" r="0.8" fill={c} /><circle cx="18" cy="21" r="0.8" fill={c} />
      <circle cx="10" cy="9" r="0.9" fill={c} /><circle cx="10" cy="12" r="0.9" fill={c} />
      <circle cx="10" cy="15" r="0.9" fill={c} /><circle cx="13" cy="9" r="0.9" fill={c} />
      <circle cx="15" cy="10" r="0.9" fill={c} /><circle cx="15" cy="12" r="0.9" fill={c} />
      <circle cx="13" cy="13" r="0.9" fill={c} />
    </svg>
  );
};

// ─── Markdown icon (dotted page with #) ───
export const HalftoneMdIcon: React.FC<HalftoneIconProps> = ({ size = 18, color }) => {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="3" r="0.8" fill={c} /><circle cx="9" cy="3" r="0.8" fill={c} />
      <circle cx="12" cy="3" r="0.8" fill={c} /><circle cx="6" cy="6" r="0.8" fill={c} />
      <circle cx="18" cy="6" r="0.8" fill={c} /><circle cx="6" cy="18" r="0.8" fill={c} />
      <circle cx="9" cy="21" r="0.8" fill={c} /><circle cx="12" cy="21" r="0.8" fill={c} />
      <circle cx="15" cy="21" r="0.8" fill={c} /><circle cx="18" cy="21" r="0.8" fill={c} />
      <circle cx="10" cy="9" r="0.9" fill={c} /><circle cx="14" cy="9" r="0.9" fill={c} />
      <circle cx="9" cy="12" r="0.9" fill={c} /><circle cx="12" cy="12" r="0.9" fill={c} />
      <circle cx="15" cy="12" r="0.9" fill={c} /><circle cx="10" cy="15" r="0.9" fill={c} />
      <circle cx="14" cy="15" r="0.9" fill={c} />
    </svg>
  );
};

// ─── CSV icon (dotted grid) ───
export const HalftoneCsvIcon: React.FC<HalftoneIconProps> = ({ size = 18, color }) => {
  const c = color || '#2ec4b6';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {[4, 10, 16].map((y) =>
        [4, 10, 16].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill={c} opacity={y === 4 ? 0.9 : 0.6} />
        ))
      )}
    </svg>
  );
};

// ─── Text file icon (dotted lines) ───
export const HalftoneTxtIcon: React.FC<HalftoneIconProps> = ({ size = 18, color }) => {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="3" r="0.8" fill={c} /><circle cx="9" cy="3" r="0.8" fill={c} />
      <circle cx="12" cy="3" r="0.8" fill={c} /><circle cx="6" cy="6" r="0.8" fill={c} />
      <circle cx="18" cy="6" r="0.8" fill={c} /><circle cx="6" cy="18" r="0.8" fill={c} />
      <circle cx="9" cy="21" r="0.8" fill={c} /><circle cx="12" cy="21" r="0.8" fill={c} />
      <circle cx="15" cy="21" r="0.8" fill={c} /><circle cx="18" cy="21" r="0.8" fill={c} />
      {[9, 12, 15].map((y) => (
        <React.Fragment key={y}>
          <circle cx="9" cy={y} r="0.7" fill={c} />
          <circle cx="12" cy={y} r="0.7" fill={c} />
          <circle cx="15" cy={y} r="0.7" fill={c} />
        </React.Fragment>
      ))}
    </svg>
  );
};

// ─── Search icon (dotted magnifier) ───
export const HalftoneSearchIcon: React.FC<HalftoneIconProps> = ({ size = 18, color }) => {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 10 + 5 * Math.cos(rad);
        const cy = 10 + 5 * Math.sin(rad);
        return <circle key={angle} cx={cx} cy={cy} r="0.9" fill={c} />;
      })}
      <circle cx="18" cy="18" r="1" fill={c} />
      <circle cx="16.5" cy="16.5" r="0.8" fill={c} />
    </svg>
  );
};

// ─── Settings icon (dotted gear) ───
export const HalftoneSettingsIcon: React.FC<HalftoneIconProps> = ({ size = 18, color }) => {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2" fill={c} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 12 + 7 * Math.cos(rad);
        const cy = 12 + 7 * Math.sin(rad);
        return <circle key={angle} cx={cx} cy={cy} r="1.2" fill={c} />;
      })}
    </svg>
  );
};

// ─── Folder icon (dotted folder) ───
export const HalftoneFolderIcon: React.FC<HalftoneIconProps> = ({ size = 18, color }) => {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="4" cy="6" r="0.8" fill={c} /><circle cx="7" cy="6" r="0.8" fill={c} />
      <circle cx="10" cy="6" r="0.8" fill={c} />
      {[4, 8, 12, 16, 20].map((x) => (
        <React.Fragment key={x}>
          <circle cx={x} cy="10" r="0.8" fill={c} />
          <circle cx={x} cy="14" r="0.8" fill={c} />
          <circle cx={x} cy="18" r="0.8" fill={c} />
        </React.Fragment>
      ))}
    </svg>
  );
};

// ─── Download icon (dotted arrow) ───
export const HalftoneDownloadIcon: React.FC<HalftoneIconProps> = ({ size = 18, color }) => {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="4" r="0.9" fill={c} /><circle cx="12" cy="7" r="0.9" fill={c} />
      <circle cx="12" cy="10" r="0.9" fill={c} /><circle cx="8" cy="12" r="0.9" fill={c} />
      <circle cx="16" cy="12" r="0.9" fill={c} /><circle cx="6" cy="14" r="0.9" fill={c} />
      <circle cx="18" cy="14" r="0.9" fill={c} />
      {[5, 8, 11, 14, 17, 20].map((x) => (
        <circle key={x} cx={x} cy="18" r="0.8" fill={c} />
      ))}
    </svg>
  );
};

// ─── List icon (dotted checklist) ───
export const HalftoneListIcon: React.FC<HalftoneIconProps> = ({ size = 18, color }) => {
  const c = color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="6" r="1.5" fill={c} opacity="0.9" />
      <circle cx="10" cy="6" r="0.7" fill={c} /><circle cx="13" cy="6" r="0.7" fill={c} />
      <circle cx="16" cy="6" r="0.7" fill={c} />
      <circle cx="6" cy="12" r="1.5" fill={c} opacity="0.6" />
      <circle cx="10" cy="12" r="0.7" fill={c} /><circle cx="13" cy="12" r="0.7" fill={c} />
      <circle cx="6" cy="18" r="1.5" fill={c} opacity="0.4" />
      <circle cx="10" cy="18" r="0.7" fill={c} />
    </svg>
  );
};

// ─── Mermaid icon (dotted flowchart) ───
export const HalftoneMermaidIcon: React.FC<HalftoneIconProps> = ({ size = 18, color }) => {
  const c = color || '#e9c46a';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2" fill={c} opacity="0.8" />
      <circle cx="7" cy="14" r="1.8" fill={c} opacity="0.7" />
      <circle cx="17" cy="14" r="1.8" fill={c} opacity="0.7" />
      <circle cx="12" cy="20" r="1.5" fill={c} opacity="0.6" />
      <circle cx="10" cy="9" r="0.7" fill={c} opacity="0.5" />
      <circle cx="14" cy="9" r="0.7" fill={c} opacity="0.5" />
      <circle cx="9" cy="17" r="0.7" fill={c} opacity="0.5" />
      <circle cx="15" cy="17" r="0.7" fill={c} opacity="0.5" />
    </svg>
  );
};

/** Get halftone icon by format string */
export function getHalftoneFormatIcon(format: string): React.FC<HalftoneIconProps> | null {
  switch (format) {
    case 'pdf': return HalftonePdfIcon;
    case 'md': return HalftoneMdIcon;
    case 'csv': return HalftoneCsvIcon;
    case 'mmd':
    case 'mermaid': return HalftoneMermaidIcon;
    case 'txt': return HalftoneTxtIcon;
    default: return null;
  }
}

/** Get halftone nav icon by name */
export function getHalftoneNavIcon(iconName: string): React.FC<HalftoneIconProps> | null {
  switch (iconName) {
    case 'Search': return HalftoneSearchIcon;
    case 'FolderOpen': return HalftoneFolderIcon;
    case 'ListTodo': return HalftoneListIcon;
    case 'Download': return HalftoneDownloadIcon;
    case 'Settings': return HalftoneSettingsIcon;
    default: return null;
  }
}
