import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { Sidebar, StatusBar } from '@papyrus/ui';
import { useWorkspaceStore } from '../stores/workspace';
import { useTaskStore } from '../stores/task';
import { useWorkflowStore } from '../stores/workflow';
import { useAppSettingsStore } from '../stores/appSettings';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { TitleBar } from '../components/window/TitleBar';
import { Spinner } from '../components/feedback/Spinner';
import { WorkflowPanel } from '../panels/WorkflowPanel';
import { useTheme } from '../components/theme';
import { ClockWidget } from '../components/widgets/ClockWidget';
import type { Surface } from './types';
import { ROUTES } from './types';
import { PanelLeftClose, PanelLeftOpen, X, LayoutList, Plus, Eye, Search, FolderOpen, ListTodo, Download, Settings } from 'lucide-react';
import clsx from 'clsx';

// Lazy-loaded views
const SearchView = lazy(() => import('../views/SearchView').then(m => ({ default: m.SearchView })));
const WorkspaceView = lazy(() => import('../views/WorkspaceView').then(m => ({ default: m.WorkspaceView })));
const FileViewerView = lazy(() => import('../views/FileViewerView').then(m => ({ default: m.FileViewerView })));
const TasksView = lazy(() => import('../views/TasksView').then(m => ({ default: m.TasksView })));
const ExportsView = lazy(() => import('../views/ExportsView').then(m => ({ default: m.ExportsView })));
const SettingsView = lazy(() => import('../views/SettingsView').then(m => ({ default: m.SettingsView })));


/** Map icon names to Lucide components */
const surfaceIconMap: Record<string, typeof Search> = {
  Search,
  FolderOpen,
  Eye,
  ListTodo,
  Download,
  Settings,
};

/**
 * AppShell — THE real app.
 *
 * Supports two layout modes:
 * - 'default': Sidebar + Content + Workflow Panel (classic)
 * - 'tabs': Browser-style tab bar at top, full-width content below
 *
 * Keyboard shortcuts:
 * - Ctrl+Shift+L: Toggle layout mode (default ↔ tabs)
 * - Ctrl+1-6: Switch surfaces
 */
export const AppShell: React.FC = () => {
  const [activeSurface, setActiveSurface] = useState<Surface>('search');
  const [aiProvider] = useState('None');
  const [aiOnline] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Tab state for tab layout
  const [openTabs, setOpenTabs] = useState<Array<{ id: Surface; label: string }>>([
    { id: 'search', label: 'Search' },
    { id: 'workspace', label: 'Files' },
  ]);
  const [tabTransition, setTabTransition] = useState(false);

  const workspace = useWorkspaceStore();
  const taskStore = useTaskStore();
  const workflow = useWorkflowStore();
  const { themeSkin } = useTheme();
  const { layoutMode, toggleLayoutMode } = useAppSettingsStore();

  const handleNavClick = useCallback((id: string) => {
    setTabTransition(true);
    setTimeout(() => setTabTransition(false), 300);
    setActiveSurface(id as Surface);
    // Add to open tabs if not already there
    const route = ROUTES.find(r => r.surface === id);
    if (route && !openTabs.find(t => t.id === id)) {
      setOpenTabs(prev => [...prev, { id: id as Surface, label: route.label }]);
    }
  }, [openTabs]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const closeTab = useCallback((tabId: Surface) => {
    setOpenTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (tabId === activeSurface && filtered.length > 0) {
        setTabTransition(true);
        setTimeout(() => setTabTransition(false), 300);
        setActiveSurface(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  }, [activeSurface]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+L → Toggle layout mode
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggleLayoutMode();
      }
      // Ctrl+1-6 → Switch surfaces
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const surfaceMap: Record<string, Surface> = {
          '1': 'search',
          '2': 'workspace',
          '3': 'fileviewer',
          '4': 'tasks',
          '5': 'exports',
          '6': 'settings',
        };
        const target = surfaceMap[e.key];
        if (target) {
          e.preventDefault();
          handleNavClick(target);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLayoutMode, handleNavClick]);

  const renderSurface = () => {
    switch (activeSurface) {
      case 'search': return <SearchView />;
      case 'workspace': return <WorkspaceView />;
      case 'fileviewer': return <FileViewerView />;
      case 'tasks': return <TasksView />;
      case 'exports': return <ExportsView />;
      case 'settings': return <SettingsView />;
      default: return <SearchView />;
    }
  };

  const navItems = ROUTES.map(r => ({
    id: r.surface,
    label: r.label,
    icon: r.icon,
  }));

  // Theme-specific collapse animation class
  const getSidebarAnimClass = () => {
    if (themeSkin === 'halftone') return 'sidebar-collapse-halftone';
    if (themeSkin === 'isometric') return 'sidebar-collapse-isometric';
    if (themeSkin === 'minimalart') return 'sidebar-collapse-minimalart';

    return 'sidebar-collapse-papyrus';
  };

  // Get tab style based on theme
  const getTabThemeStyle = (isActive: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {};

    if (themeSkin === 'halftone') {
      return {
        ...base,
        borderRadius: 'var(--radius-sm, 2px) var(--radius-sm, 2px) 0 0',
        border: isActive ? '2px solid var(--accent-primary)' : '1px solid transparent',
        borderBottom: isActive ? 'none' : '1px solid var(--border-default)',
        fontWeight: isActive ? 900 : 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      };
    }

    if (themeSkin === 'isometric') {
      return {
        ...base,
        borderRadius: 'var(--radius-md, 6px) var(--radius-md, 6px) 0 0',
        border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent',
        borderBottom: isActive ? 'none' : '1px solid var(--border-default)',
        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
        transform: isActive ? 'translateY(-1px)' : 'none',
      };
    }

    if (themeSkin === 'minimalart') {
      return {
        ...base,
        borderRadius: 'var(--radius-lg, 10px) var(--radius-lg, 10px) 0 0',
        border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent',
        borderBottom: isActive ? 'none' : '1px solid var(--border-default)',
        fontWeight: isActive ? 600 : 400,
        letterSpacing: '0.04em',
      };
    }

    // Papyrus (default)
    return {
      ...base,
      borderRadius: '8px 8px 0 0',
      border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent',
      borderBottom: isActive ? 'none' : '1px solid var(--border-default)',
    };
  };

  // ─── Tab Layout ───
  if (layoutMode === 'tabs') {
    return (
      <div className="app-layout">
        <TitleBar workspaceName={workspace.name} />

        {/* Tab Bar — redesigned browser-style tabs */}
        <div
          className="flex items-center border-b relative"
          style={{
            borderBottom: '1px solid var(--border-default, #27272a)',
            backgroundColor: 'var(--bg-secondary)',
            minHeight: 40,
          }}
        >
          <div className="flex items-center flex-1 overflow-x-auto px-1 pt-1" style={{ scrollbarWidth: 'none' }}>
            {openTabs.map((tab) => {
              const isActive = activeSurface === tab.id;
              const IconComp = surfaceIconMap[ROUTES.find(r => r.surface === tab.id)?.icon || 'Search'];
              const tabStyle = getTabThemeStyle(isActive);

              return (
                <div
                  key={tab.id}
                  className={clsx(
                    'group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer transition-all duration-200 relative',
                    isActive ? 'z-10' : 'z-0',
                  )}
                  style={{
                    ...tabStyle,
                    backgroundColor: isActive ? 'var(--bg-primary)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--fg-dim)',
                    marginRight: 2,
                    maxWidth: 180,
                  }}
                  onClick={() => {
                    setTabTransition(true);
                    setTimeout(() => setTabTransition(false), 300);
                    setActiveSurface(tab.id);
                  }}
                >
                  {/* Active tab glow line */}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0"
                      style={{
                        height: 2,
                        backgroundColor: 'var(--accent-primary)',
                        boxShadow: '0 0 8px var(--accent-primary-muted)',
                      }}
                    />
                  )}

                  {/* Tab icon */}
                  {IconComp && <IconComp size={12} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.5 }} />}

                  {/* Tab label */}
                  <span className="truncate">{tab.label}</span>

                  {/* Close button — fades in on hover */}
                  <button
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-hover"
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                    style={{ color: 'var(--fg-dim)' }}
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}

            {/* New tab "+" button with animation */}
            <button
              className="flex items-center justify-center w-7 h-7 text-xs rounded-md transition-all duration-200 hover:bg-hover hover:scale-110 active:scale-95"
              style={{ color: 'var(--fg-dim)' }}
              onClick={() => {
                // Find a surface not yet open and add it
                const closedSurfaces = ROUTES.filter(r => !openTabs.find(t => t.id === r.surface));
                if (closedSurfaces.length > 0) {
                  const next = closedSurfaces[0];
                  setOpenTabs(prev => [...prev, { id: next.surface, label: next.label }]);
                  setActiveSurface(next.surface);
                }
              }}
              title="Open new tab"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Clock widget + Layout toggle in tab bar */}
          <div className="flex items-center gap-2 px-2 flex-shrink-0">
            <ClockWidget size="compact" />
            <button
              className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-hover transition-colors"
              style={{ color: 'var(--fg-dim)' }}
              onClick={toggleLayoutMode}
              title="Switch to sidebar layout (Ctrl+Shift+L)"
            >
              <LayoutList size={12} />
              Sidebar
            </button>
          </div>
        </div>

        {/* Main Row: Content + Workflow Panel */}
        <div className="app-main-row">
          <main className={`app-content ${tabTransition ? 'tab-switch-enter' : ''}`}>
            <ErrorBoundary>
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <Spinner size="lg" label="Loading view..." />
                </div>
              }>
                {renderSurface()}
              </Suspense>
            </ErrorBoundary>
          </main>
          {workflow.isPanelOpen && (
            <aside
              className="border-l border-border bg-background-secondary overflow-auto flex-shrink-0"
              style={{ width: 'var(--workflow-panel-width, 360px)' }}
            >
              <ErrorBoundary>
                <WorkflowPanel />
              </ErrorBoundary>
            </aside>
          )}
        </div>

        <StatusBar
          status={taskStore.isRunning ? 'RUNNING' : 'READY'}
          aiProvider={aiProvider}
          aiOnline={aiOnline}
          indexed={workspace.isIndexed}
          tasksCompleted={taskStore.tasks.filter(t => t.status === 'completed').length}
        />
      </div>
    );
  }

  // ─── Default Sidebar Layout ───
  return (
    <div className="app-layout">
      <TitleBar workspaceName={workspace.name} />

      <div className="app-main-row">
        {/* Sidebar with collapse animation */}
        <div
          className={`${getSidebarAnimClass()}`}
          style={{
            width: sidebarCollapsed ? 0 : 'var(--sidebar-width, 240px)',
            overflow: 'hidden',
            transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
          }}
        >
          <div style={{ width: 'var(--sidebar-width, 240px)', height: '100%' }}>
            <Sidebar
              navItems={navItems}
              activeNav={activeSurface}
              onNavClick={handleNavClick}
              workspaceName={workspace.name || 'No Workspace'}
              aiProvider={aiProvider}
              aiOnline={aiOnline}
              recentTasks={taskStore.tasks.slice(0, 4).map((t) => ({
                id: t.id,
                label: (t.sourceFiles || []).map((f) => f.split(/[/\\]/).pop()).join(', '),
                formats: t.outputFormats || [],
                status: t.status,
                timeAgo: t.completedAt ? `${Math.round((Date.now() - t.completedAt) / 60000)}m ago` : 'Running',
              }))}
              themeSkin={themeSkin}
              clockWidget={<ClockWidget size="compact" />}
            />
          </div>
        </div>

        {/* Collapse/expand toggle button */}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex items-center justify-center flex-shrink-0 border-r border-border hover:bg-hover transition-colors"
          style={{
            width: 28,
            height: '100%',
            color: 'var(--fg-dim, #71717a)',
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-default, #27272a)',
          }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>

        <main className="app-content">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Spinner size="lg" label="Loading view..." />
              </div>
            }>
              {renderSurface()}
            </Suspense>
          </ErrorBoundary>
        </main>
        {workflow.isPanelOpen && (
          <aside
            className="w-workflow-panel border-l border-border bg-background-secondary overflow-auto flex-shrink-0"
          >
            <ErrorBoundary>
              <WorkflowPanel />
            </ErrorBoundary>
          </aside>
        )}
      </div>

      <StatusBar
        status={taskStore.isRunning ? 'RUNNING' : 'READY'}
        aiProvider={aiProvider}
        aiOnline={aiOnline}
        indexed={workspace.isIndexed}
        tasksCompleted={taskStore.tasks.filter(t => t.status === 'completed').length}
      />
    </div>
  );
};
