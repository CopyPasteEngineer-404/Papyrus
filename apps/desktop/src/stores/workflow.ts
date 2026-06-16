import { create } from 'zustand';
import { OutputFormat, ConstraintSet, DEFAULT_CONSTRAINT_SET } from '@papyrus/shared';

/** Target formats available for direct conversion (bypasses the full IR pipeline) */
export type ConvertTargetFormat = 'txt' | 'html' | 'md' | 'docx' | 'csv' | 'latex' | 'pdf';

export interface ConversionResult {
  success: boolean;
  outputPath: string;
  targetFormat: string;
  fileSize: number;
  duration: number;
  error?: string;
}

export interface WorkflowState {
  isPanelOpen: boolean;
  isSelectionLocked: boolean;
  step: 'select' | 'formats' | 'constraints' | 'review';
  selectedFormats: OutputFormat[];
  constraints: ConstraintSet;
  percentComplete: number;
  workerStatuses: Array<{ format: OutputFormat; status: string; duration?: number; error?: string }>;
  exportResults: Array<{ filename: string; format: OutputFormat; success: boolean; size: number; duration: number }>;
  isExecuting: boolean;
  lastError: string | null;

  /* Convert state */
  isConverting: boolean;
  lastConversionResult: ConversionResult | null;

  openPanel: () => void;
  closePanel: () => void;
  setStep: (step: WorkflowState['step']) => void;
  toggleFormat: (format: OutputFormat) => void;
  setConstraints: (constraints: ConstraintSet) => void;
  setProgress: (percent: number) => void;
  setWorkerStatuses: (statuses: WorkflowState['workerStatuses']) => void;
  setExportResults: (results: WorkflowState['exportResults']) => void;
  setExecuting: (executing: boolean) => void;
  setLastError: (error: string | null) => void;
  setConverting: (converting: boolean) => void;
  setConversionResult: (result: ConversionResult | null) => void;
  lockSelection: () => void;
  unlockSelection: () => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  isPanelOpen: false,
  isSelectionLocked: false,
  step: 'select',
  selectedFormats: [],
  constraints: { ...DEFAULT_CONSTRAINT_SET },
  percentComplete: 0,
  workerStatuses: [],
  exportResults: [],
  isExecuting: false,
  lastError: null,

  /* Convert state */
  isConverting: false,
  lastConversionResult: null,

  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  setStep: (step) => set({ step }),
  toggleFormat: (format) => set((state) => {
    const formats = state.selectedFormats.includes(format)
      ? state.selectedFormats.filter((f) => f !== format)
      : [...state.selectedFormats, format];
    return { selectedFormats: formats };
  }),
  setConstraints: (constraints) => set({ constraints }),
  setProgress: (percent) => set({ percentComplete: percent }),
  setWorkerStatuses: (statuses) => set({ workerStatuses: statuses }),
  setExportResults: (results) => set({ exportResults: results }),
  setExecuting: (executing) => set({ isExecuting: executing }),
  setLastError: (error) => set({ lastError: error }),
  setConverting: (converting) => set({ isConverting: converting }),
  setConversionResult: (result) => set({ lastConversionResult: result }),
  lockSelection: () => set({ isSelectionLocked: true, step: 'formats' }),
  unlockSelection: () => set({ isSelectionLocked: false, step: 'select' }),
  reset: () => set({
    step: 'select',
    isSelectionLocked: false,
    selectedFormats: [],
    constraints: { ...DEFAULT_CONSTRAINT_SET },
    percentComplete: 0,
    workerStatuses: [],
    exportResults: [],
    isExecuting: false,
    lastError: null,
    isConverting: false,
    lastConversionResult: null,
  }),
}));
