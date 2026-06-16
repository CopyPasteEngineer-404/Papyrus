import { create } from 'zustand';
import type { TransformationTask, TaskStatus } from '@papyrus/shared';

export type { TaskStatus };

export interface TaskState {
  tasks: TransformationTask[];
  isRunning: boolean;
  activeTaskId: string | null;
  /** Queue of pending task IDs — tasks wait here before execution */
  queue: string[];

  addTask: (task: TransformationTask) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, error?: string) => void;
  setRunning: (running: boolean) => void;
  setActiveTask: (taskId: string | null) => void;
  enqueue: (taskId: string) => void;
  dequeue: (taskId: string) => void;
  clear: () => void;

  /** Get counts by status */
  getPendingCount: () => number;
  getRunningCount: () => number;
  getCompletedCount: () => number;
  getFailedCount: () => number;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isRunning: false,
  activeTaskId: null,
  queue: [],

  addTask: (task) => set((state) => ({
    tasks: [task, ...state.tasks],
    isRunning: task.status === 'running' || state.isRunning,
    activeTaskId: task.status === 'running' ? task.id : state.activeTaskId,
    queue: task.status === 'pending' ? [...state.queue, task.id] : state.queue,
  })),

  updateTaskStatus: (taskId, status, error) => set((state) => {
    const updatedTasks = state.tasks.map(t =>
      t.id === taskId
        ? { ...t, status, error, completedAt: status === 'completed' || status === 'failed' || status === 'cancelled' ? Date.now() : t.completedAt }
        : t
    );

    // Remove from queue if no longer pending
    const updatedQueue = status !== 'pending'
      ? state.queue.filter(id => id !== taskId)
      : state.queue;

    const runningTasks = updatedTasks.filter(t => t.status === 'running');

    return {
      tasks: updatedTasks,
      queue: updatedQueue,
      isRunning: runningTasks.length > 0,
      activeTaskId: status === 'running'
        ? taskId
        : state.activeTaskId === taskId
          ? (runningTasks[0]?.id || null)
          : state.activeTaskId,
    };
  }),

  setRunning: (running) => set({ isRunning: running }),
  setActiveTask: (taskId) => set({ activeTaskId: taskId }),

  enqueue: (taskId) => set((state) => ({
    queue: [...state.queue, taskId],
  })),

  dequeue: (taskId) => set((state) => ({
    queue: state.queue.filter(id => id !== taskId),
  })),

  clear: () => set({ tasks: [], isRunning: false, activeTaskId: null, queue: [] }),

  getPendingCount: () => get().tasks.filter(t => t.status === 'pending').length,
  getRunningCount: () => get().tasks.filter(t => t.status === 'running').length,
  getCompletedCount: () => get().tasks.filter(t => t.status === 'completed').length,
  getFailedCount: () => get().tasks.filter(t => t.status === 'failed').length,
}));
