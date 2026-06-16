import type React from 'react';
import type { Surface, AppRoute } from './types';

/** Map surface to the view component that renders it */
export const surfaceRoutes: Record<Surface, () => Promise<{ default: React.ComponentType }>> = {
  search: () => import('../views/SearchView').then(m => ({ default: m.SearchView })),
  workspace: () => import('../views/WorkspaceView').then(m => ({ default: m.WorkspaceView })),
  fileviewer: () => import('../views/FileViewerView').then(m => ({ default: m.FileViewerView })),
  tasks: () => import('../views/TasksView').then(m => ({ default: m.TasksView })),
  exports: () => import('../views/ExportsView').then(m => ({ default: m.ExportsView })),
  settings: () => import('../views/SettingsView').then(m => ({ default: m.SettingsView })),
};

/** Get label for a surface */
export function getSurfaceLabel(surface: Surface): string {
  const labels: Record<Surface, string> = {
    search: 'Search',
    workspace: 'Files',
    fileviewer: 'File Viewer',
    tasks: 'Tasks',
    exports: 'Exports',
    settings: 'Settings',
  };
  return labels[surface];
}
