import { create } from 'zustand';
import type { SearchResult } from '@papyrus/shared';

export type { SearchResult };

export interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  selectedFiles: string[]; // Array for serializability (Set is not JSON-serializable)
  activeTab: string;

  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setSearching: (searching: boolean) => void;
  toggleFileSelection: (fileId: string) => void;
  clearSelection: () => void;
  setActiveTab: (tab: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  isSearching: false,
  selectedFiles: [],
  activeTab: 'All',

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setSearching: (searching) => set({ isSearching: searching }),
  toggleFileSelection: (fileId) => set((state) => {
    const isSelected = state.selectedFiles.includes(fileId);
    return {
      selectedFiles: isSelected
        ? state.selectedFiles.filter(id => id !== fileId)
        : [...state.selectedFiles, fileId],
    };
  }),
  clearSelection: () => set({ selectedFiles: [] }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
