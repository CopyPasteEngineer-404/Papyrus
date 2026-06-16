import { create } from 'zustand';

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  format: string;
  size: number;
  modifiedAt: number;
}

export interface WorkspaceEntry {
  path: string;
  name: string;
  files: WorkspaceFile[];
  isIndexed: boolean;
  isIndexing: boolean;
  indexingProgress: number;
}

export interface WorkspaceState {
  currentPath: string | null;
  name: string | null;
  isIndexed: boolean;
  isIndexing: boolean;
  files: WorkspaceFile[];
  indexingProgress: number; // 0-100

  // Multi-workspace tracking
  workspaces: WorkspaceEntry[];
  currentWorkspaceId: string | null; // path of the active workspace

  setWorkspace: (path: string, name: string) => void;
  setIndexed: (indexed: boolean) => void;
  setIndexing: (indexing: boolean) => void;
  setFiles: (files: WorkspaceFile[]) => void;
  setIndexingProgress: (progress: number) => void;
  clear: () => void;
  switchWorkspace: (path: string) => void;
  removeWorkspace: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentPath: null,
  name: null,
  isIndexed: false,
  isIndexing: false,
  files: [],
  indexingProgress: 0,
  workspaces: [],
  currentWorkspaceId: null,

  setWorkspace: (path, name) => set({
    currentPath: path,
    name,
    currentWorkspaceId: path,
    // Don't reset isIndexed and files — they may have already been set
    // by the workspace:indexed event that fires before this handler runs.
    // The caller is responsible for calling setIndexed() and setFiles()
    // after setWorkspace() if needed.
    // Add to workspaces array if not already there
    workspaces: (() => {
      const existing = get().workspaces;
      const idx = existing.findIndex(w => w.path === path);
      const entry: WorkspaceEntry = {
        path,
        name,
        files: [], // Start fresh — don't copy files from previous workspace
        isIndexed: false,
        isIndexing: false,
        indexingProgress: 0,
      };
      if (idx >= 0) {
        const updated = [...existing];
        updated[idx] = { ...updated[idx], name };
        return updated;
      }
      return [...existing, entry];
    })(),
  }),

  setIndexed: (indexed) => set((state) => {
    // Update the workspaces array entry too
    const workspaces = state.workspaces.map(w =>
      w.path === state.currentWorkspaceId ? { ...w, isIndexed: indexed, isIndexing: false } : w
    );
    return { isIndexed: indexed, isIndexing: false, workspaces };
  }),

  setIndexing: (indexing) => set((state) => {
    const workspaces = state.workspaces.map(w =>
      w.path === state.currentWorkspaceId ? { ...w, isIndexing: indexing, isIndexed: indexing ? w.isIndexed : false } : w
    );
    return { isIndexing: indexing, isIndexed: indexing ? state.isIndexed : false, workspaces };
  }),

  setFiles: (files) => set((state) => {
    const workspaces = state.workspaces.map(w =>
      w.path === state.currentWorkspaceId ? { ...w, files } : w
    );
    return { files, workspaces };
  }),

  setIndexingProgress: (progress) => set((state) => {
    const workspaces = state.workspaces.map(w =>
      w.path === state.currentWorkspaceId ? { ...w, indexingProgress: progress } : w
    );
    return { indexingProgress: progress, workspaces };
  }),

  clear: () => set((state) => {
    // Remove current workspace from workspaces array
    const workspaces = state.workspaces.filter(w => w.path !== state.currentWorkspaceId);
    // If there are other workspaces, switch to the most recent one
    if (workspaces.length > 0) {
      const last = workspaces[workspaces.length - 1];
      return {
        currentPath: last.path,
        name: last.name,
        isIndexed: last.isIndexed,
        isIndexing: last.isIndexing,
        files: last.files,
        indexingProgress: last.indexingProgress,
        currentWorkspaceId: last.path,
        workspaces,
      };
    }
    // No workspaces left — show welcome screen
    return {
      currentPath: null,
      name: null,
      isIndexed: false,
      isIndexing: false,
      files: [],
      indexingProgress: 0,
      currentWorkspaceId: null,
      workspaces: [],
    };
  }),

  switchWorkspace: (path) => set((state) => {
    const entry = state.workspaces.find(w => w.path === path);
    if (!entry) return state;
    return {
      currentPath: entry.path,
      name: entry.name,
      isIndexed: entry.isIndexed,
      isIndexing: entry.isIndexing,
      files: entry.files,
      indexingProgress: entry.indexingProgress,
      currentWorkspaceId: entry.path,
    };
  }),

  removeWorkspace: (path) => set((state) => {
    const workspaces = state.workspaces.filter(w => w.path !== path);
    // If the removed workspace is current, switch to another or clear
    if (state.currentWorkspaceId === path) {
      if (workspaces.length > 0) {
        const last = workspaces[workspaces.length - 1];
        return {
          currentPath: last.path,
          name: last.name,
          isIndexed: last.isIndexed,
          isIndexing: last.isIndexing,
          files: last.files,
          indexingProgress: last.indexingProgress,
          currentWorkspaceId: last.path,
          workspaces,
        };
      }
      return {
        currentPath: null,
        name: null,
        isIndexed: false,
        isIndexing: false,
        files: [],
        indexingProgress: 0,
        currentWorkspaceId: null,
        workspaces: [],
      };
    }
    return { workspaces };
  }),
}));
