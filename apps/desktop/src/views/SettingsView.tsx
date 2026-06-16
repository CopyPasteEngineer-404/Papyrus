import React, { useEffect, useState, useCallback } from 'react';
import { Settings, Palette, Cpu, FileText, Info, Moon, Sun, Monitor, PenTool, FolderOpen, Clock, Trash2, History, Activity, CheckCircle2, XCircle, Loader2, LayoutList, LayoutGrid, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme, type ThemeSkin } from '../components/theme';
import { useAppSettingsStore, type QuillStyle } from '../stores/appSettings';
import { useWorkspaceStore } from '../stores/workspace';

interface AppSettings {
  aiProvider: string;
  defaultConstraints: any;
  recentWorkspaces: Array<{ path: string; name: string; lastOpened: number }>;
}

/**
 * SettingsView — App settings with 3 theme skins, color mode, quill style, AI provider, constraints, recent workspaces.
 */
export const SettingsView: React.FC = () => {
  const { theme, resolvedTheme, toggleTheme, themeSkin, setThemeSkin } = useTheme();
  const { quillStyle, setQuillStyle, layoutMode, setLayoutMode, toggleLayoutMode } = useAppSettingsStore();
  const workspaceStore = useWorkspaceStore();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [smokeTestResults, setSmokeTestResults] = useState<{ passed: boolean; results: Array<{ name: string; status: 'pass' | 'fail'; message: string }> } | null>(null);
  const [runningSmokeTest, setRunningSmokeTest] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const result = await window.papyrus?.getSettings();
        setSettings(result);
      } catch {
        setSettings(null);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleUpdateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      await window.papyrus?.updateSettings(updates);
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  }, []);

  const handleOpenRecentWorkspace = useCallback(async (wsPath: string) => {
    try {
      const result = await window.papyrus?.openWorkspace(wsPath);
      if (result) {
        workspaceStore.setWorkspace(result.path, result.name);
        if (result.files && Array.isArray(result.files)) {
          workspaceStore.setFiles(result.files.map((f: any) => ({
            id: f.id, name: f.name, path: f.path, format: f.format,
            size: f.size ?? 0, modifiedAt: f.modifiedAt || Date.now(),
          })));
        }
        // Ensure isIndexed is set after workspace hydration
        workspaceStore.setIndexed(true);
        workspaceStore.setIndexing(false);
        toast.success(`Opened workspace: ${result.name}`);
      }
    } catch (error) {
      toast.error('Failed to open workspace');
    }
  }, [workspaceStore]);

  const handleRemoveRecentWorkspace = useCallback(async (wsPath: string) => {
    try {
      await window.papyrus?.removeRecentWorkspace(wsPath);
      setSettings(prev => prev ? {
        ...prev,
        recentWorkspaces: prev.recentWorkspaces.filter(w => w.path !== wsPath),
      } : null);
      toast.success('Workspace removed from recent list');
    } catch {
      toast.error('Failed to remove workspace');
    }
  }, []);

  const handleRunSmokeTest = useCallback(async () => {
    setRunningSmokeTest(true);
    setSmokeTestResults(null);
    try {
      const result = await window.papyrus?.runSmokeTest();
      if (result) {
        setSmokeTestResults(result);
        if (result.passed) {
          toast.success('All diagnostics passed');
        } else {
          const failedCount = result.results.filter((r: { name: string; status: 'pass' | 'fail'; message: string }) => r.status === 'fail').length;
          toast.error(`${failedCount} diagnostic(s) failed`);
        }
      }
    } catch (error) {
      toast.error('Failed to run diagnostics');
    } finally {
      setRunningSmokeTest(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
        <Settings size={24} className="text-accent animate-spin" />
        <span className="sr-only">Loading settings...</span>
      </div>
    );
  }

  const recentWorkspaces = settings?.recentWorkspaces || [];

  // Theme accent colors
  const PAPYRUS_GOLD = '#C4A265';
  const HALFTONE_TEAL = '#2C7DA0';
  const ISO_BLUE = '#6C8EBF';
  const MA_TERRACOTTA = '#C87941';

  const skins: Array<{ id: ThemeSkin; name: string; desc: string; accent: string; previewBg: string; previewOverlay: string; iconLetter: string }> = [
    {
      id: 'papyrus',
      name: 'Papyrus Theme',
      desc: 'Manuscript & parchment',
      accent: PAPYRUS_GOLD,
      previewBg: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #1f1f26 100%)',
      previewOverlay: `radial-gradient(circle at 70% 60%, rgba(196, 162, 101, 0.3) 0%, transparent 60%)`,
      iconLetter: 'P',
    },
    {
      id: 'halftone',
      name: 'Halftone Theme',
      desc: 'Newsprint & retro comic',
      accent: HALFTONE_TEAL,
      previewBg: '#0d0d0d',
      previewOverlay: `radial-gradient(circle at 50% 50%, rgba(44, 125, 160, 0.25) 0%, transparent 60%)`,
      iconLetter: 'H',
    },
    {
      id: 'isometric',
      name: 'Isometric Theme',
      desc: 'Professional 3D depth',
      accent: ISO_BLUE,
      previewBg: 'linear-gradient(135deg, #0f1318 0%, #161b22 50%, #1c2230 100%)',
      previewOverlay: `radial-gradient(circle at 50% 50%, rgba(108, 142, 191, 0.25) 0%, transparent 60%)`,
      iconLetter: 'I',
    },
    {
      id: 'minimalart',
      name: 'Minimal Art Theme',
      desc: 'Gallery & exhibition',
      accent: MA_TERRACOTTA,
      previewBg: 'linear-gradient(180deg, #1a1714 0%, #211e1a 50%, #28241f 100%)',
      previewOverlay: `radial-gradient(circle at 50% 50%, rgba(200, 121, 65, 0.2) 0%, transparent 60%)`,
      iconLetter: 'M',
    },
  ];

  return (
    <div className="max-w-2xl overflow-auto h-full">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={20} className="text-accent" />
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
      </div>

      {/* ─── Theme Skin ─── */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Palette size={14} />
          Theme Skin
        </h2>
        <p className="text-xs text-foreground-dim mb-3">
          Choose the visual identity for Papyrus. Each skin has its own intro animation, color palette, and visual style.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {skins.map((skin) => (
            <button
              key={skin.id}
              onClick={() => {
                setThemeSkin(skin.id);
                toast.success(`Theme skin changed to ${skin.name}`);
              }}
              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                themeSkin === skin.id
                  ? 'border-accent bg-accent-muted'
                  : 'border-border bg-card hover:border-border-hover'
              }`}
            >
              {/* Preview swatch */}
              <div className="w-12 h-12 rounded-md flex items-center justify-center" style={{
                background: skin.previewBg,
                border: skin.id === 'halftone' ? '2px solid #333333' : '1px solid var(--border-default)',
                position: 'relative',
                overflow: 'hidden',
                backgroundImage: skin.id === 'halftone'
                  ? `${skin.previewBg}, radial-gradient(circle, rgba(255,255,255,0.04) 1.5px, transparent 1.5px)`
                  : skin.previewBg,
                backgroundSize: skin.id === 'halftone' ? 'auto, 6px 6px' : 'auto',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: skin.previewOverlay,
                }} />
                {skin.id === 'halftone' ? (
                  <div style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: skin.accent,
                    letterSpacing: '0.08em',
                    textShadow: '2px 2px 0px rgba(0,0,0,1)',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {skin.iconLetter}
                  </div>
                ) : skin.id === 'isometric' ? (
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="none" style={{ position: 'relative', zIndex: 1 }}>
                    <polygon points="20,4 36,12 20,20 4,12" fill={skin.accent} opacity="0.8" />
                    <polygon points="4,12 20,20 20,36 4,28" fill={skin.accent} opacity="0.6" />
                    <polygon points="20,20 36,12 36,28 20,36" fill={skin.accent} opacity="0.7" />
                  </svg>
                ) : skin.id === 'minimalart' ? (
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="none" style={{ position: 'relative', zIndex: 1 }}>
                    <line x1="4" y1="20" x2="36" y2="20" stroke={skin.accent} strokeWidth="0.8" opacity="0.5" />
                    <circle cx="20" cy="20" r="6" fill="none" stroke={skin.accent} strokeWidth="0.8" opacity="0.7" />
                    <circle cx="20" cy="20" r="2" fill={skin.accent} opacity="0.4" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 120 180" fill="none" style={{ position: 'relative', zIndex: 1 }}>
                    <path d="M60 15 L60 140" stroke={skin.accent} strokeWidth="6" strokeLinecap="round" />
                    <path d="M60 18 C50 25, 28 40, 18 60 C12 72, 10 85, 14 95" fill={skin.accent} fillOpacity="0.8" stroke="none" />
                    <path d="M60 18 C70 25, 92 40, 102 60 C108 72, 110 85, 106 95" fill={skin.accent} fillOpacity="0.8" stroke="none" />
                  </svg>
                )}
              </div>
              <div className="text-center">
                <span className={`text-xs font-semibold block ${themeSkin === skin.id ? 'text-accent' : 'text-foreground-muted'}`}>
                  {skin.name}
                </span>
                <span className="text-[10px] text-foreground-dim">
                  {skin.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ─── Color Mode ─── */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Palette size={14} />
          Color Mode
        </h2>
        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-foreground">Mode</span>
              <p className="text-xs text-foreground-dim">Switch between dark and light mode</p>
            </div>
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-hover hover:bg-active rounded-lg text-sm text-foreground transition-colors"
              onClick={toggleTheme}
            >
              {theme === 'dark' && <Moon size={14} />}
              {theme === 'light' && <Sun size={14} />}
              {theme === 'system' && <Monitor size={14} />}
              {theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'}
            </button>
          </div>
        </div>
      </section>

      {/* Quill Style — only shown for Papyrus skin */}
      {themeSkin === 'papyrus' && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <PenTool size={14} />
            Quill Style
          </h2>
          <p className="text-xs text-foreground-dim mb-3">
            Choose the quill design shown in the intro animation and branding throughout Papyrus.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(['inkpen', 'feather'] as QuillStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => {
                  setQuillStyle(style);
                  toast.success(`Quill style changed to ${style === 'feather' ? 'Feather Quill' : 'Ink Pen'}`);
                }}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-3 transition-colors ${
                  quillStyle === style
                    ? 'border-accent bg-accent-muted'
                    : 'border-border bg-card hover:border-border-hover'
                }`}
              >
                <img
                  src={style === 'feather' ? '/Schreibfeder.svg' : '/inkpenmoney.svg'}
                  alt={style === 'feather' ? 'Feather Quill' : 'Ink Pen'}
                  className="w-14 h-14 object-contain"
                  style={{
                    filter: 'drop-shadow(0 2px 6px rgba(196, 162, 101, 0.4))',
                    transform: 'rotate(-30deg)',
                  }}
                />
                <span className={`text-sm font-medium ${
                  quillStyle === style ? 'text-accent' : 'text-foreground-muted'
                }`}>
                  {style === 'feather' ? 'Feather Quill' : 'Ink Pen'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─── Layout Mode ─── */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <LayoutGrid size={14} />
          Layout Mode
        </h2>
        <p className="text-xs text-foreground-dim mb-3">
          Choose how the app arranges navigation and content. You can also toggle with Ctrl+Shift+L.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setLayoutMode('default'); toast.success('Switched to sidebar layout'); }}
            className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
              layoutMode === 'default'
                ? 'border-accent bg-accent-muted'
                : 'border-border bg-card hover:border-border-hover'
            }`}
          >
            <LayoutList size={24} style={{ color: layoutMode === 'default' ? 'var(--accent-primary)' : 'var(--fg-dim)' }} />
            <div className="text-center">
              <span className={`text-xs font-semibold block ${layoutMode === 'default' ? 'text-accent' : 'text-foreground-muted'}`}>
                Sidebar
              </span>
              <span className="text-[10px] text-foreground-dim">
                Classic sidebar navigation
              </span>
            </div>
          </button>
          <button
            onClick={() => { setLayoutMode('tabs'); toast.success('Switched to tab layout'); }}
            className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
              layoutMode === 'tabs'
                ? 'border-accent bg-accent-muted'
                : 'border-border bg-card hover:border-border-hover'
            }`}
          >
            <LayoutGrid size={24} style={{ color: layoutMode === 'tabs' ? 'var(--accent-primary)' : 'var(--fg-dim)' }} />
            <div className="text-center">
              <span className={`text-xs font-semibold block ${layoutMode === 'tabs' ? 'text-accent' : 'text-foreground-muted'}`}>
                Tabs
              </span>
              <span className="text-[10px] text-foreground-dim">
                Browser-style tab bar
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* ─── Keyboard Shortcuts ─── */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Keyboard size={14} />
          Keyboard Shortcuts
        </h2>
        <div className="p-4 rounded-lg border border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Toggle layout mode</span>
            <kbd className="px-2 py-0.5 bg-hover rounded text-xs font-mono text-foreground-muted">Ctrl+Shift+L</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Switch to Search</span>
            <kbd className="px-2 py-0.5 bg-hover rounded text-xs font-mono text-foreground-muted">Ctrl+1</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Switch to Files</span>
            <kbd className="px-2 py-0.5 bg-hover rounded text-xs font-mono text-foreground-muted">Ctrl+2</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Switch to File Viewer</span>
            <kbd className="px-2 py-0.5 bg-hover rounded text-xs font-mono text-foreground-muted">Ctrl+3</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Switch to Tasks</span>
            <kbd className="px-2 py-0.5 bg-hover rounded text-xs font-mono text-foreground-muted">Ctrl+4</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Switch to Exports</span>
            <kbd className="px-2 py-0.5 bg-hover rounded text-xs font-mono text-foreground-muted">Ctrl+5</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Switch to Settings</span>
            <kbd className="px-2 py-0.5 bg-hover rounded text-xs font-mono text-foreground-muted">Ctrl+6</kbd>
          </div>
        </div>
      </section>

      {/* Recent Workspaces */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <History size={14} />
          Recent Workspaces
        </h2>
        <div className="p-4 rounded-lg border border-border bg-card">
          {recentWorkspaces.length === 0 ? (
            <p className="text-xs text-foreground-dim">No recent workspaces. Open a folder to get started.</p>
          ) : (
            <div className="space-y-2">
              {recentWorkspaces.map((ws) => (
                <div key={ws.path} className="flex items-center gap-2 group">
                  <FolderOpen size={14} className="text-accent flex-shrink-0" />
                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => handleOpenRecentWorkspace(ws.path)}
                  >
                    <div className="text-sm text-foreground truncate hover:text-accent transition-colors">{ws.name}</div>
                    <div className="text-xs text-foreground-dim truncate font-mono">{ws.path}</div>
                  </button>
                  <div className="flex items-center gap-1 text-xs text-foreground-dim flex-shrink-0">
                    <Clock size={10} />
                    {formatTimeAgo(ws.lastOpened)}
                  </div>
                  <button
                    className="p-1 rounded hover:bg-hover text-foreground-dim hover:text-error opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all"
                    aria-label={`Remove ${ws.name} from recent`}
                    onClick={() => handleRemoveRecentWorkspace(ws.path)}
                    title="Remove from recent"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AI Provider */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Cpu size={14} />
          AI Provider
        </h2>
        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Provider</span>
            <span className="text-sm text-foreground-muted">None (offline mode)</span>
          </div>
          <p className="text-xs text-foreground-dim">
            AI features require Ollama or an OpenAI-compatible endpoint. Not available in Phase 1.
          </p>
        </div>
      </section>

      {/* Default Export Constraints */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText size={14} />
          Default Export Constraints
        </h2>
        <div className="p-4 rounded-lg border border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">PDF Paper Size</span>
            <span className="text-sm text-foreground-muted">{settings?.defaultConstraints?.pdf?.paperSize || 'A4'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">PDF Font Size</span>
            <span className="text-sm text-foreground-muted">{settings?.defaultConstraints?.pdf?.fontSize || 12}px</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Include Table of Contents</span>
            <span className="text-sm text-foreground-muted">{settings?.defaultConstraints?.pdf?.includeToc ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Text Line Wrap</span>
            <span className="text-sm text-foreground-muted">{settings?.defaultConstraints?.txt?.lineWrap || 80} chars</span>
          </div>
        </div>
      </section>

      {/* Diagnostics */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity size={14} />
          Diagnostics
        </h2>
        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <p className="text-xs text-foreground-dim">
            Run a quick smoke test to verify all subsystems are working correctly. Open a workspace first for best results.
          </p>
          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRunSmokeTest}
            disabled={runningSmokeTest}
          >
            {runningSmokeTest ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
            {runningSmokeTest ? 'Running...' : 'Run Smoke Test'}
          </button>

          {smokeTestResults && (
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: smokeTestResults.passed ? 'var(--status-success, #10b981)' : 'var(--status-error, #ef4444)' }}>
                {smokeTestResults.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {smokeTestResults.passed ? 'All checks passed' : `${smokeTestResults.results.filter(r => r.status === 'fail').length} check(s) failed`}
              </div>
              {smokeTestResults.results.map((result) => (
                <div key={result.name} className="flex items-start gap-2 text-xs py-1.5 px-2 rounded" style={{ backgroundColor: result.status === 'pass' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)' }}>
                  {result.status === 'pass' ? (
                    <CheckCircle2 size={12} style={{ color: 'var(--status-success, #10b981)', flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <XCircle size={12} style={{ color: 'var(--status-error, #ef4444)', flexShrink: 0, marginTop: 2 }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold" style={{ color: 'var(--fg-primary)' }}>{result.name}</span>
                    <span className="ml-2" style={{ color: 'var(--fg-dim, #71717a)' }}>{result.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Info size={14} />
          About
        </h2>
        <div className="p-4 rounded-lg border border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Version</span>
            <span className="text-sm text-foreground-muted">0.1.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">IR Version</span>
            <span className="text-sm text-foreground-muted">1</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Theme Skin</span>
            <span className="text-sm text-foreground-muted capitalize">{themeSkin}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Output Formats</span>
            <span className="text-sm text-foreground-muted">PDF, Markdown, Plain Text, HTML, DOCX, CSV</span>
          </div>
        </div>
      </section>
    </div>
  );
};

/** Format timestamp to relative time string */
function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
