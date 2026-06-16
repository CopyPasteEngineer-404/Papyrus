import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '../theme';
import {
  ChevronRight, ChevronLeft, Check, Palette, LayoutGrid,
  FolderOpen, Sparkles, Wifi, WifiOff, Download, Folder,
  FileText, GitBranch, ArrowRight, ArrowLeft, Monitor,
  CheckCircle2, AlertCircle, Loader2, Zap, BookOpen,
  PenTool, ScanSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SetupWizardProps {
  onComplete: () => void;
}

type WizardStep =
  | 'welcome'
  | 'about'
  | 'internet'
  | 'theme'
  | 'layout'
  | 'workspace'
  | 'done';

const STEPS: WizardStep[] = ['welcome', 'about', 'internet', 'theme', 'layout', 'workspace', 'done'];

/**
 * SetupWizard — Enhanced multi-step wizard for first launch.
 *
 * Steps: Welcome → About Papyrus → Internet Check → Choose Theme → Choose Layout → Workspace Setup → Done
 * Framer Motion animations between steps.
 * Internet connectivity check with visual feedback.
 * Custom design unique to Papyrus.
 */
export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const { themeSkin, setThemeSkin, resolvedTheme, setTheme } = useTheme();
  const [selectedLayout, setSelectedLayout] = useState<'default' | 'tabs'>('default');

  const stepIndex = STEPS.indexOf(currentStep);

  const goToStep = useCallback((step: WizardStep) => {
    const newIdx = STEPS.indexOf(step);
    setDirection(newIdx > stepIndex ? 'forward' : 'backward');
    setCurrentStep(step);
  }, [stepIndex]);

  const handleNext = useCallback(() => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) {
      goToStep(STEPS[nextIdx]);
    }
  }, [stepIndex, goToStep]);

  const handleBack = useCallback(() => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) {
      goToStep(STEPS[prevIdx]);
    }
  }, [stepIndex, goToStep]);

  const handleSkip = useCallback(() => {
    window.papyrus?.setStoredSetting('setupComplete', true);
    onComplete();
  }, [onComplete]);

  const handleComplete = useCallback(() => {
    window.papyrus?.setStoredSetting('setupComplete', true);
    try {
      window.papyrus?.setStoredSetting('layoutMode', selectedLayout);
    } catch {}
    onComplete();
  }, [onComplete, selectedLayout]);

  // Progress percentage
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  // Framer motion variants
  const slideVariants = {
    enter: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--fg-primary)' }}
    >
      {/* Progress bar */}
      <div className="h-1 w-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <motion.div
          className="h-full"
          style={{ backgroundColor: 'var(--accent-primary)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Main content area with animated transitions */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div className="w-full max-w-xl" style={{ minHeight: 360, position: 'relative' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', width: '100%' }}
            >
              {currentStep === 'welcome' && <WelcomeStep />}
              {currentStep === 'about' && <AboutStep themeSkin={themeSkin} />}
              {currentStep === 'internet' && <InternetStep />}
              {currentStep === 'theme' && (
                <ThemeStep
                  themeSkin={themeSkin}
                  setThemeSkin={setThemeSkin}
                  resolvedTheme={resolvedTheme}
                  setTheme={setTheme}
                />
              )}
              {currentStep === 'layout' && (
                <LayoutStep selectedLayout={selectedLayout} setSelectedLayout={setSelectedLayout} />
              )}
              {currentStep === 'workspace' && <WorkspaceStep />}
              {currentStep === 'done' && <DoneStep themeSkin={themeSkin} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation footer */}
      <div
        className="flex items-center justify-between px-8 py-4 border-t"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-2">
          {STEPS.map((step, i) => (
            <motion.div
              key={step}
              className="rounded-full"
              animate={{
                width: i === stepIndex ? 24 : 8,
                backgroundColor: i <= stepIndex ? 'var(--accent-primary)' : 'var(--bg-muted)',
              }}
              style={{ height: 8 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {currentStep !== 'done' && (
            <button
              className="px-4 py-2 text-sm rounded-md transition-colors hover:opacity-80"
              style={{ color: 'var(--fg-dim)' }}
              onClick={handleSkip}
            >
              Skip Setup
            </button>
          )}

          {stepIndex > 0 && (
            <button
              className="flex items-center gap-1 px-4 py-2 text-sm rounded-md transition-colors hover:opacity-80"
              style={{
                color: 'var(--fg-muted)',
                border: '1px solid var(--border-default)',
              }}
              onClick={handleBack}
            >
              <ChevronLeft size={14} />
              Back
            </button>
          )}

          {currentStep === 'done' ? (
            <motion.button
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
              onClick={handleComplete}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Check size={14} />
              Get Started
            </motion.button>
          ) : (
            <motion.button
              className="flex items-center gap-1 px-6 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
              onClick={handleNext}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Next
              <ChevronRight size={14} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Welcome Step ────────────────────────────────────────────────────────────────

const WelcomeStep: React.FC = () => (
  <div className="text-center">
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      className="mb-6"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
        style={{
          backgroundColor: 'var(--accent-primary-muted)',
          border: '2px solid var(--accent-primary)',
        }}
      >
        <Sparkles size={36} style={{ color: 'var(--accent-primary)' }} />
      </div>
    </motion.div>

    <motion.h1
      className="text-4xl font-bold mb-3"
      style={{ color: 'var(--fg-primary)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      Welcome to Papyrus
    </motion.h1>

    <motion.p
      className="text-lg mb-6"
      style={{ color: 'var(--fg-muted)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      Your document conversion workspace
    </motion.p>

    <motion.p
      className="text-sm leading-relaxed max-w-md mx-auto"
      style={{ color: 'var(--fg-dim)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      Transform your documents between formats with elegance.
      Let us set up your experience in a few quick steps.
    </motion.p>
  </div>
);

// ─── About Step ──────────────────────────────────────────────────────────────────

const AboutStep: React.FC<{ themeSkin: string }> = ({ themeSkin }) => {
  const features = [
    { icon: FileText, title: 'Multi-Format Conversion', desc: 'Convert between Markdown, CSV, HTML, TXT, and more' },
    { icon: GitBranch, title: 'Mermaid Diagrams', desc: 'Render and convert Mermaid flowcharts and diagrams' },
    { icon: ScanSearch, title: 'Live Preview', desc: 'Preview files in real-time with split editor view' },
    { icon: PenTool, title: 'Custom Themes', desc: 'Four unique visual themes with custom animations' },
    { icon: Zap, title: 'Batch Processing', desc: 'Process multiple files at once with pipeline architecture' },
    { icon: Monitor, title: 'Desktop Native', desc: 'Built with Electron for fast, offline-first experience' },
  ];

  return (
    <div>
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BookOpen size={36} style={{ color: 'var(--accent-primary)', margin: '0 auto' }} />
        <h2 className="text-2xl font-bold mt-3" style={{ color: 'var(--fg-primary)' }}>
          What is Papyrus?
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
          A powerful desktop document transformation tool
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {features.map((feat, i) => (
          <motion.div
            key={feat.title}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.3 }}
          >
            <feat.icon size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <span className="text-xs font-semibold" style={{ color: 'var(--fg-primary)' }}>
                {feat.title}
              </span>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-dim)' }}>
                {feat.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── Internet Check Step ──────────────────────────────────────────────────────────

const InternetStep: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check internet connectivity
    const checkInternet = async () => {
      try {
        // Try to fetch a small resource to verify connectivity
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch('https://dns.google/resolve?name=example.com', {
          mode: 'no-cors',
          signal: controller.signal,
        });

        clearTimeout(timeout);
        setStatus('online');
      } catch {
        // Fallback: check navigator.onLine
        if (navigator.onLine) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      }
    };

    // Small delay for visual effect
    const timer = setTimeout(checkInternet, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="mb-6"
      >
        {status === 'checking' && (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-default)' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={32} style={{ color: 'var(--accent-primary)' }} />
            </motion.div>
          </div>
        )}

        {status === 'online' && (
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{
              backgroundColor: 'var(--status-success-muted, rgba(16, 185, 129, 0.15))',
              border: '2px solid var(--status-success, #10b981)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Wifi size={32} style={{ color: 'var(--status-success, #10b981)' }} />
          </motion.div>
        )}

        {status === 'offline' && (
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{
              backgroundColor: 'var(--status-warning-muted, rgba(245, 158, 11, 0.15))',
              border: '2px solid var(--status-warning, #f59e0b)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <WifiOff size={32} style={{ color: 'var(--status-warning, #f59e0b)' }} />
          </motion.div>
        )}
      </motion.div>

      <motion.h2
        className="text-2xl font-bold mb-3"
        style={{ color: 'var(--fg-primary)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {status === 'checking' && 'Checking Connection...'}
        {status === 'online' && 'You\'re Online!'}
        {status === 'offline' && 'No Internet Connection'}
      </motion.h2>

      <motion.p
        className="text-sm leading-relaxed max-w-md mx-auto"
        style={{ color: 'var(--fg-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {status === 'checking' && 'Verifying your internet connection to ensure all features are available...'}
        {status === 'online' && 'Papyrus works offline, but some features like Mermaid diagram rendering may need an internet connection for CDN resources. All core document conversion features work without internet.'}
        {status === 'offline' && 'Papyrus works fully offline! All core document conversion features are available. Some features like Mermaid diagram rendering may need internet for CDN resources.'}
      </motion.p>

      {status === 'online' && (
        <motion.div
          className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg mx-auto"
          style={{
            backgroundColor: 'var(--status-success-muted, rgba(16, 185, 129, 0.15))',
            maxWidth: 280,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <CheckCircle2 size={14} style={{ color: 'var(--status-success, #10b981)' }} />
          <span className="text-xs" style={{ color: 'var(--status-success, #10b981)' }}>
            Internet connected — all features available
          </span>
        </motion.div>
      )}

      {status === 'offline' && (
        <motion.div
          className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg mx-auto"
          style={{
            backgroundColor: 'var(--status-warning-muted, rgba(245, 158, 11, 0.15))',
            maxWidth: 300,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <AlertCircle size={14} style={{ color: 'var(--status-warning, #f59e0b)' }} />
          <span className="text-xs" style={{ color: 'var(--status-warning, #f59e0b)' }}>
            Offline mode — core features still work
          </span>
        </motion.div>
      )}
    </div>
  );
};

// ─── Theme Step ──────────────────────────────────────────────────────────────────

const ThemeStep: React.FC<{
  themeSkin: string;
  setThemeSkin: (s: any) => void;
  resolvedTheme: string;
  setTheme: (t: any) => void;
}> = ({ themeSkin, setThemeSkin, resolvedTheme, setTheme }) => {
  const themes = [
    { id: 'papyrus' as const, name: 'Papyrus', desc: 'Elegant quill & ink on aged parchment', color: '#C4A265', icon: '📜' },
    { id: 'halftone' as const, name: 'Halftone', desc: 'Retro newsprint dot-matrix printing', color: '#2C7DA0', icon: '📰' },
    { id: 'isometric' as const, name: 'Isometric', desc: '3D geometric depth with clean lines', color: '#6C8EBF', icon: '📐' },
    { id: 'minimalart' as const, name: 'Minimal Art', desc: 'Gallery refinement and clean space', color: '#C87941', icon: '🎨' },
  ];

  return (
    <div>
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Palette size={36} style={{ color: 'var(--accent-primary)', margin: '0 auto' }} />
        <h2 className="text-2xl font-bold mt-3" style={{ color: 'var(--fg-primary)' }}>Choose Your Theme</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>Select a visual style that suits your workflow</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {themes.map((theme, i) => (
          <motion.button
            key={theme.id}
            className="flex flex-col items-start p-4 rounded-lg text-left transition-all"
            style={{
              border: themeSkin === theme.id ? `2px solid ${theme.color}` : '1px solid var(--border-default)',
              backgroundColor: themeSkin === theme.id ? `${theme.color}15` : 'var(--bg-secondary)',
            }}
            onClick={() => setThemeSkin(theme.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: theme.color }}>
                {themeSkin === theme.id ? <Check size={10} color="white" /> : null}
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>{theme.name}</span>
            </div>
            <span className="text-xs" style={{ color: 'var(--fg-dim)' }}>{theme.desc}</span>
          </motion.button>
        ))}
      </div>

      {/* Light/Dark toggle */}
      <motion.div
        className="flex items-center justify-center gap-3 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          className="px-3 py-1.5 text-xs rounded-md transition-colors"
          style={{
            backgroundColor: resolvedTheme === 'dark' ? 'var(--accent-primary-muted)' : 'transparent',
            color: resolvedTheme === 'dark' ? 'var(--accent-primary)' : 'var(--fg-dim)',
            border: resolvedTheme === 'dark' ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
          }}
          onClick={() => setTheme('dark')}
        >
          Dark Mode
        </button>
        <button
          className="px-3 py-1.5 text-xs rounded-md transition-colors"
          style={{
            backgroundColor: resolvedTheme === 'light' ? 'var(--accent-primary-muted)' : 'transparent',
            color: resolvedTheme === 'light' ? 'var(--accent-primary)' : 'var(--fg-dim)',
            border: resolvedTheme === 'light' ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
          }}
          onClick={() => setTheme('light')}
        >
          Light Mode
        </button>
      </motion.div>
    </div>
  );
};

// ─── Layout Step ──────────────────────────────────────────────────────────────────

const LayoutStep: React.FC<{
  selectedLayout: 'default' | 'tabs';
  setSelectedLayout: (l: 'default' | 'tabs') => void;
}> = ({ selectedLayout, setSelectedLayout }) => (
  <div>
    <motion.div
      className="text-center mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <LayoutGrid size={36} style={{ color: 'var(--accent-primary)', margin: '0 auto' }} />
      <h2 className="text-2xl font-bold mt-3" style={{ color: 'var(--fg-primary)' }}>Choose Your Layout</h2>
      <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>How do you prefer to navigate?</p>
    </motion.div>

    <div className="grid grid-cols-2 gap-4">
      <motion.button
        className="flex flex-col items-center p-6 rounded-lg text-center transition-all"
        style={{
          border: selectedLayout === 'default' ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
          backgroundColor: selectedLayout === 'default' ? 'var(--accent-primary-muted)' : 'var(--bg-secondary)',
        }}
        onClick={() => setSelectedLayout('default')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex gap-1 mb-3">
          <div className="w-3 h-10 rounded-sm" style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.3 }} />
          <div className="w-12 h-10 rounded-sm" style={{ backgroundColor: 'var(--bg-active)' }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>Sidebar</span>
        <span className="text-xs mt-1" style={{ color: 'var(--fg-dim)' }}>Classic sidebar navigation</span>
      </motion.button>

      <motion.button
        className="flex flex-col items-center p-6 rounded-lg text-center transition-all"
        style={{
          border: selectedLayout === 'tabs' ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
          backgroundColor: selectedLayout === 'tabs' ? 'var(--accent-primary-muted)' : 'var(--bg-secondary)',
        }}
        onClick={() => setSelectedLayout('tabs')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex gap-1">
            <div className="w-6 h-2 rounded-t-sm" style={{ backgroundColor: 'var(--accent-primary)' }} />
            <div className="w-5 h-2 rounded-t-sm" style={{ backgroundColor: 'var(--bg-muted)' }} />
          </div>
          <div className="w-14 h-8 rounded-sm" style={{ backgroundColor: 'var(--bg-active)' }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>Tabs</span>
        <span className="text-xs mt-1" style={{ color: 'var(--fg-dim)' }}>Browser-style tab navigation</span>
      </motion.button>
    </div>
  </div>
);

// ─── Workspace Step ──────────────────────────────────────────────────────────────

const WorkspaceStep: React.FC = () => (
  <div>
    <motion.div
      className="text-center mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <FolderOpen size={36} style={{ color: 'var(--accent-primary)', margin: '0 auto' }} />
      <h2 className="text-2xl font-bold mt-3" style={{ color: 'var(--fg-primary)' }}>Workspace Setup</h2>
      <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>Set up your workspace after this wizard</p>
    </motion.div>

    <div className="space-y-3">
      <motion.div
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>What is a workspace?</h3>
        <p className="text-xs mt-1" style={{ color: 'var(--fg-dim)' }}>
          A workspace is a directory containing your source documents. Papyrus scans it for supported file types
          (Markdown, CSV, Mermaid, HTML, TXT) and lets you convert between formats.
        </p>
      </motion.div>

      <motion.div
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>Getting started</h3>
        <ul className="text-xs mt-1 space-y-1" style={{ color: 'var(--fg-dim)' }}>
          <li>• Open an existing directory as a workspace</li>
          <li>• Create a new workspace from scratch</li>
          <li>• Try the sample workspace to explore features</li>
          <li>• Import files from anywhere on your system</li>
        </ul>
      </motion.div>

      <motion.div
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-primary)' }}>Supported Formats</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {['Markdown', 'CSV', 'Mermaid', 'HTML', 'TXT', 'PDF'].map(fmt => (
            <span
              key={fmt}
              className="px-2 py-0.5 text-xs rounded"
              style={{ backgroundColor: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}
            >
              {fmt}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
);

// ─── Done Step ────────────────────────────────────────────────────────────────────

const DoneStep: React.FC<{ themeSkin: string }> = ({ themeSkin }) => (
  <div className="text-center">
    <motion.div
      className="mb-6"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: 'var(--accent-primary-muted)', border: '2px solid var(--accent-primary)' }}
      >
        <Check size={32} style={{ color: 'var(--accent-primary)' }} />
      </div>
    </motion.div>

    <motion.h2
      className="text-2xl font-bold mb-3"
      style={{ color: 'var(--fg-primary)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      You&apos;re all set!
    </motion.h2>

    <motion.p
      className="text-sm leading-relaxed max-w-md mx-auto"
      style={{ color: 'var(--fg-muted)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      Your Papyrus workspace is ready. Start by opening a workspace directory or trying the sample workspace.
      You can always change your theme and layout in Settings.
    </motion.p>

    <motion.div
      className="mt-6 flex items-center justify-center gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <FolderOpen size={14} style={{ color: 'var(--accent-primary)' }} />
        <span className="text-xs" style={{ color: 'var(--fg-dim)' }}>Open Workspace</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <BookOpen size={14} style={{ color: 'var(--accent-primary)' }} />
        <span className="text-xs" style={{ color: 'var(--fg-dim)' }}>Try Sample</span>
      </div>
    </motion.div>
  </div>
);

export default SetupWizard;
