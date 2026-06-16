import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { initializeApp, type InitPhase, type InitState } from './initialization';
import { AppShell } from './AppShell';
import { Providers } from './providers';
import { useWorkspaceStore } from '../stores/workspace';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Spinner } from '../components/feedback/Spinner';
import { ProgressBar } from '../components/feedback/ProgressBar';
import { AlertTriangle, RotateCcw } from 'lucide-react';

const IntroSequence = lazy(() => import('../components/intro').then(m => ({ default: m.IntroSequence })));
const SetupWizard = lazy(() => import('../components/setup/SetupWizard').then(m => ({ default: m.SetupWizard })));

/**
 * Bootstrap — Startup orchestration.
 *
 * Initialization order:
 * 1. Initialize DB (via IPC)
 * 2. Restore workspace
 * 3. Hydrate stores
 * 4. Initialize IPC listeners
 * 5. Load settings
 * 6. Mount app
 *
 * The "Quill Awakens" intro animation plays on EVERY launch,
 * rendering over the initialization. The user must click to
 * dismiss it and access the dashboard.
 */
export const Bootstrap: React.FC = () => {
  const [initState, setInitState] = useState<InitState>({
    phase: 'idle',
    workspaceRestored: false,
    settingsLoaded: false,
  });
  const [introComplete, setIntroComplete] = useState(false);
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  const workspaceStore = useWorkspaceStore();
  const workspaceRef = useRef(workspaceStore);
  workspaceRef.current = workspaceStore;

  // Check if setup has been completed on first launch
  useEffect(() => {
    window.papyrus?.getStoredSetting('setupComplete').then((value: any) => {
      setSetupComplete(value === true);
    }).catch(() => {
      // Default to completed if settings unavailable
      setSetupComplete(true);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const result = await initializeApp((phase: InitPhase) => {
        if (!cancelled) {
          setInitState(prev => ({ ...prev, phase }));
        }
      });

      if (!cancelled) {
        setInitState(result);
      }
    }

    boot();

    return () => { cancelled = true; };
  }, []);

  // Hydrate workspace store after init completes
  useEffect(() => {
    if (initState.phase === 'ready' && initState.workspaceRestored && initState.restoredWorkspace) {
      // Populate the workspace store from the initialization result.
      // The initialization already re-opened the last workspace (via workspace:open),
      // which triggered indexing and returned the file list. The workspace:indexed
      // event from main process may have fired BEFORE Providers mounted, so we
      // MUST hydrate the store here from the init result.
      const ws = initState.restoredWorkspace;
      workspaceRef.current.setWorkspace(ws.path, ws.name);
      if (ws.files && ws.files.length > 0) {
        workspaceRef.current.setFiles(ws.files);
      }
      // Ensure isIndexed is set after workspace hydration
      workspaceRef.current.setIndexed(true);
      workspaceRef.current.setIndexing(false);
    } else if (initState.phase === 'ready' && initState.workspaceRestored) {
      // Fallback: workspace info was found but no restoredWorkspace data
      // (e.g., edge case where getWorkspaceInfo returned data but openWorkspace wasn't called)
      window.papyrus?.getWorkspaceInfo().then((workspaces: any[]) => {
        if (workspaces && workspaces.length > 0) {
          const ws = workspaces[0];
          workspaceRef.current.setWorkspace(ws.path, ws.name);
          workspaceRef.current.setIndexed(true);
        }
      }).catch(() => {
        // Ignore — workspace info unavailable
      });
    }
  }, [initState.phase, initState.workspaceRestored, initState.restoredWorkspace]);

  const handleIntroComplete = () => {
    setIntroComplete(true);
  };

  const handleSetupComplete = () => {
    setSetupComplete(true);
  };

  // Show setup wizard on first launch
  if (setupComplete === false && initState.phase === 'ready') {
    return <Suspense fallback={null}><SetupWizard onComplete={handleSetupComplete} /></Suspense>;
  }

  // Still checking setup status
  if (setupComplete === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <Spinner size="sm" label="Initializing..." />
      </div>
    );
  }

  // Render based on init phase
  if (initState.phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <AlertTriangle size={48} className="text-error mb-4" />
        <h1 className="text-xl font-semibold mb-2">Papyrus failed to start</h1>
        <p className="text-foreground-muted mb-6">{initState.error || 'Unknown error'}</p>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
          onClick={() => window.location.reload()}
        >
          <RotateCcw size={16} />
          Retry
        </button>
      </div>
    );
  }

  // Show loading screen while app initializes (behind the intro overlay)
  if (initState.phase !== 'ready') {
    // Show intro over the loading state
    if (!introComplete) {
      return (
        <>
          <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
            <ProgressBar
              value={getProgressPercent(initState.phase)}
              showPercent
              label={getPhaseLabel(initState.phase)}
            />
          </div>
          <Suspense fallback={null}><IntroSequence onComplete={handleIntroComplete} /></Suspense>
        </>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <ProgressBar
          value={getProgressPercent(initState.phase)}
          showPercent
          label={getPhaseLabel(initState.phase)}
        />
        <Spinner size="sm" className="mt-4" />
      </div>
    );
  }

  // App is ready — if intro hasn't completed yet, show it over the app
  if (!introComplete) {
    return (
      <>
        <ErrorBoundary>
          <Providers>
            <AppShell />
          </Providers>
        </ErrorBoundary>
        <Suspense fallback={null}><IntroSequence onComplete={handleIntroComplete} /></Suspense>
      </>
    );
  }

  return (
    <ErrorBoundary>
      <Providers>
        <AppShell />
      </Providers>
    </ErrorBoundary>
  );
};

function getProgressPercent(phase: InitPhase): number {
  switch (phase) {
    case 'idle': return 0;
    case 'connecting': return 20;
    case 'restoring-workspace': return 40;
    case 'hydrating-stores': return 60;
    case 'loading-settings': return 80;
    case 'ready': return 100;
    case 'error': return 0;
  }
}

function getPhaseLabel(phase: InitPhase): string {
  switch (phase) {
    case 'idle': return 'Starting...';
    case 'connecting': return 'Connecting to runtime...';
    case 'restoring-workspace': return 'Restoring workspace...';
    case 'hydrating-stores': return 'Loading state...';
    case 'loading-settings': return 'Loading settings...';
    case 'ready': return 'Ready';
    case 'error': return 'Error';
  }
}
