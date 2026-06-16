/**
 * Surface-driven UI types for Papyrus.
 * The AppShell renders views based on the active surface,
 * preventing disconnected screens.
 */

export type Surface =
  | 'search'
  | 'workspace'
  | 'tasks'
  | 'exports'
  | 'settings'
  | 'fileviewer';

export interface AppRoute {
  surface: Surface;
  label: string;
  icon: string; // Lucide icon name
}

export const ROUTES: AppRoute[] = [
  { surface: 'search', label: 'Search', icon: 'Search' },
  { surface: 'workspace', label: 'Files', icon: 'FolderOpen' },
  { surface: 'fileviewer', label: 'File Viewer', icon: 'Eye' },
  { surface: 'tasks', label: 'Tasks', icon: 'ListTodo' },
  { surface: 'exports', label: 'Exports', icon: 'Download' },
  { surface: 'settings', label: 'Settings', icon: 'Settings' },
];
