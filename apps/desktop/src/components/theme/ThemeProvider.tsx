import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
type ThemeSkin = 'papyrus' | 'halftone' | 'isometric' | 'minimalart' | 'threejs';

interface ThemeContextValue {
  /** The user's preference (may be 'system') */
  theme: ThemePreference;
  /** The actual resolved theme applied to the DOM */
  resolvedTheme: ResolvedTheme;
  /** Set the theme explicitly */
  setTheme: (theme: ThemePreference) => void;
  /** Cycle through: light → dark → system → light */
  toggleTheme: () => void;
  /** The visual skin (papyrus or halftone) */
  themeSkin: ThemeSkin;
  /** Set the theme skin */
  setThemeSkin: (skin: ThemeSkin) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_THEME: ThemePreference = 'dark';
const DEFAULT_SKIN: ThemeSkin = 'papyrus';

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', resolved);
}

function applySkin(skin: ThemeSkin): void {
  document.documentElement.setAttribute('data-theme-skin', skin);
}

/** Persist theme to electron-store (single source of truth) */
async function persistTheme(theme: ThemePreference): Promise<void> {
  try {
    await window.papyrus?.updateSettings({ theme });
  } catch {
    // electron-store unavailable — graceful fallback
  }
}

/** Persist skin to electron-store */
async function persistSkin(skin: ThemeSkin): Promise<void> {
  try {
    await window.papyrus?.updateSettings({ themeSkin: skin });
  } catch {
    // electron-store unavailable — graceful fallback
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Start with defaults, then hydrate from electron-store
  const [theme, setThemeState] = useState<ThemePreference>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(DEFAULT_THEME));
  const [themeSkin, setThemeSkinState] = useState<ThemeSkin>(DEFAULT_SKIN);
  const [hydrated, setHydrated] = useState(false);

  // Keep a ref to the current preference so the media-query listener can use it
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // On mount, hydrate theme and skin from electron-store
  useEffect(() => {
    async function hydrateTheme() {
      try {
        const settings = await window.papyrus?.getSettings();
        if (settings?.theme && ['light', 'dark', 'system'].includes(settings.theme)) {
          setThemeState(settings.theme as ThemePreference);
        }
        if (settings?.themeSkin && ['papyrus', 'halftone', 'isometric', 'minimalart', 'threejs'].includes(settings.themeSkin)) {
          setThemeSkinState(settings.themeSkin as ThemeSkin);
        }
      } catch {
        // electron-store unavailable — use defaults
      }
      setHydrated(true);
    }
    hydrateTheme();
  }, []);

  // Resolve and apply theme whenever the preference changes
  useEffect(() => {
    if (!hydrated) return;
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme, hydrated]);

  // Apply skin whenever it changes
  useEffect(() => {
    if (!hydrated) return;
    applySkin(themeSkin);
  }, [themeSkin, hydrated]);

  // Listen to system color-scheme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const resolved: ResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemePreference) => {
    setThemeState(newTheme);
    persistTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const cycle: ThemePreference[] = ['light', 'dark', 'system'];
      const idx = cycle.indexOf(prev);
      const next = cycle[(idx + 1) % cycle.length];
      persistTheme(next);
      return next;
    });
  }, []);

  const setThemeSkin = useCallback((skin: ThemeSkin) => {
    setThemeSkinState(skin);
    persistSkin(skin);
  }, []);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    themeSkin,
    setThemeSkin,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Re-export types for external use
export type { ThemePreference, ResolvedTheme, ThemeSkin };
