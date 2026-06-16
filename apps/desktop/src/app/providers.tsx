import React, { useEffect, useRef } from 'react';
import { useWorkflowStore } from '../stores/workflow';
import { useTaskStore } from '../stores/task';
import { useWorkspaceStore } from '../stores/workspace';
import { useSearchStore } from '../stores/search';
import { OutputFormat } from '@papyrus/shared';
import { toast } from 'sonner';

/**
 * Providers component — sets up global side effects:
 * - IPC event listeners from main process
 * - File watcher events
 * - Store hydration from workspace data
 * - Cleanup on unmount
 */
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const workflow = useWorkflowStore();
  const taskStore = useTaskStore();

  // Use refs for ALL stores to avoid re-running the effect on every state change.
  // The effect should only run once on mount; store methods are stable via Zustand.
  const workflowRef = useRef(workflow);
  const taskRef = useRef(taskStore);
  const workspaceRef = useRef(useWorkspaceStore.getState());
  const searchRef = useRef(useSearchStore.getState());

  // Keep refs current
  workflowRef.current = workflow;
  taskRef.current = taskStore;
  workspaceRef.current = useWorkspaceStore.getState();
  searchRef.current = useSearchStore.getState();

  // Set up IPC listeners — runs ONCE on mount
  useEffect(() => {
    const handleTaskProgress = (data: any) => {
      workflowRef.current.setProgress(data.percentComplete || 0);

      if (data.workerStatuses) {
        workflowRef.current.setWorkerStatuses(data.workerStatuses);
      }
    };

    const handleTaskCompleted = (data: any) => {
      if (data.task) {
        taskRef.current.addTask(data.task);
        workflowRef.current.setProgress(100);
        workflowRef.current.setStep('review');
        // CRITICAL FIX: Mark execution as complete so UI leaves "Exporting..." state
        workflowRef.current.setExecuting(false);

        if (data.task.results) {
          const results: Array<{
            filename: string;
            format: OutputFormat;
            success: boolean;
            size: number;
            duration: number;
          }> = [];

          for (const [format, result] of Object.entries(data.task.results)) {
            const r = result as any;
            if (r.artifacts) {
              for (const artifact of r.artifacts) {
                results.push({
                  filename: artifact.filename,
                  format: format as OutputFormat,
                  success: r.success,
                  size: artifact.size ?? 0,
                  duration: r.duration || 0,
                });
              }
            }
          }
          workflowRef.current.setExportResults(results);
        }

        toast.success('Export complete', {
          description: `Task ${data.task.id.slice(0, 8)} finished successfully`,
        });
      } else {
        // No task data but still need to clear executing state
        workflowRef.current.setExecuting(false);
      }
    };

    const handleTaskFailed = (data: any) => {
      if (data.task) {
        taskRef.current.addTask(data.task);
      }
      workflowRef.current.setExecuting(false);

      const errorMsg = data.task?.error || data.error || 'Unknown error';
      toast.error('Export failed', { description: errorMsg });
    };

    const handleTaskCancelled = (data: { taskId: string; status: string; error?: string }) => {
      taskRef.current.updateTaskStatus(data.taskId, 'cancelled', data.error);
      workflowRef.current.setExecuting(false);
      toast.info('Export cancelled');
    };

    const handleWorkspaceIndexed = (data: any) => {
      if (data.workspace) {
        workspaceRef.current.setIndexed(true);
        workspaceRef.current.setIndexing(false);
        // Populate workspace files from the indexed event
        if (data.files && Array.isArray(data.files)) {
          workspaceRef.current.setFiles(data.files.map((f: any) => ({
            id: f.id,
            name: f.name,
            path: f.path,
            format: f.format,
            size: f.size ?? 0,
            modifiedAt: f.modifiedAt || Date.now(),
          })));
        }
        const currentQuery = searchRef.current.query;
        if (currentQuery) {
          window.papyrus?.search(currentQuery).then((results: any[]) => {
            searchRef.current.setResults(results);
          }).catch(() => {});
        }
      }
    };

    // Workspace indexing started
    const handleWorkspaceIndexing = (_data: any) => {
      workspaceRef.current.setIndexing(true);
    };

    // File watcher events
    const handleFileChanged = (data: { type: string; path: string }) => {
      const fileName = data.path.split(/[/\\]/).pop() || data.path;
      if (data.type === 'add') {
        toast.info('New file detected', { description: fileName });
      } else if (data.type === 'change') {
        toast.info('File updated', { description: fileName });
      } else if (data.type === 'unlink') {
        toast.info('File removed', { description: fileName });
      }

      // Re-index the workspace on file changes
      const currentPath = workspaceRef.current.currentPath;
      if (currentPath) {
        // Trigger a soft refresh — could be debounced in production
        window.papyrus?.search(searchRef.current.query || '*').then((results: any[]) => {
          searchRef.current.setResults(results);
        }).catch(() => {});
      }
    };

    window.papyrus?.on('task:progress', handleTaskProgress);
    window.papyrus?.on('task:completed', handleTaskCompleted);
    window.papyrus?.on('task:failed', handleTaskFailed);
    window.papyrus?.on('task:cancelled', handleTaskCancelled);
    window.papyrus?.on('workspace:indexed', handleWorkspaceIndexed);
    window.papyrus?.on('workspace:indexing', handleWorkspaceIndexing);
    window.papyrus?.on('file:changed', handleFileChanged);

    return () => {
      window.papyrus?.removeListener('task:progress', handleTaskProgress);
      window.papyrus?.removeListener('task:completed', handleTaskCompleted);
      window.papyrus?.removeListener('task:failed', handleTaskFailed);
      window.papyrus?.removeListener('task:cancelled', handleTaskCancelled);
      window.papyrus?.removeListener('workspace:indexed', handleWorkspaceIndexed);
      window.papyrus?.removeListener('workspace:indexing', handleWorkspaceIndexing);
      window.papyrus?.removeListener('file:changed', handleFileChanged);
    };
  }, []); // Empty dependency array — runs once on mount

  return <>{children}</>;
};
