import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QuillStyle = 'inkpen' | 'feather';
export type LayoutMode = 'default' | 'tabs';

export interface AppSettingsState {
  quillStyle: QuillStyle;
  layoutMode: LayoutMode;
  setQuillStyle: (style: QuillStyle) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleLayoutMode: () => void;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set, get) => ({
      quillStyle: 'inkpen' as QuillStyle,
      layoutMode: 'default' as LayoutMode,
      setQuillStyle: (style) => set({ quillStyle: style }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      toggleLayoutMode: () => set({ layoutMode: get().layoutMode === 'default' ? 'tabs' : 'default' }),
    }),
    {
      name: 'papyrus-quill-settings',
    }
  )
);
