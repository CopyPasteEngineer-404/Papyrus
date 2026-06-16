import React, { useEffect, useState, useCallback } from 'react';
import { useTaskStore } from '../stores/task';
import type { TransformationTask } from '@papyrus/shared';
import { ListTodo, Clock, XCircle, CheckCircle2, Loader2, X, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

/**
 * TasksView — Shows task execution history with real lifecycle status.
 * Surface: 'tasks'
 */
export const TasksView: React.FC = () => {
  const taskStore = useTaskStore();
  const [history, setHistory] = useState<TransformationTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const tasks = await window.papyrus?.getTaskHistory() || [];
        setHistory(tasks);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const allTasks = [...taskStore.tasks, ...history.filter(h => !taskStore.tasks.some(t => t.id === h.id))];

  const handleCancelTask = useCallback(async (taskId: string) => {
    try {
      await window.papyrus?.cancelTask(taskId);
      taskStore.updateTaskStatus(taskId, 'cancelled');
      toast.info('Task cancelled');
    } catch (error) {
      toast.error('Failed to cancel task');
    }
  }, [taskStore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    );
  }

  if (allTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ListTodo size={48} className="text-foreground-dim mb-4" />
        <h3 className="text-lg font-medium text-foreground">No tasks yet</h3>
        <p className="text-sm text-foreground-muted mt-1">
          Select files and export to PDF to create your first task
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <ListTodo size={20} className="text-accent" />
        <h1 className="text-xl font-semibold text-foreground">Task History</h1>
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {allTasks.map((task) => (
          <div
            key={task.id}
            className={clsx(
              'p-3 rounded-lg border transition-colors',
              task.status === 'running' && 'border-accent/30 bg-accent-muted',
              task.status === 'completed' && 'border-success/30 bg-success-muted',
              task.status === 'failed' && 'border-error/30 bg-error-muted',
              task.status === 'pending' && 'border-border bg-card',
              task.status === 'cancelled' && 'border-border bg-hover opacity-60',
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-foreground-dim">
                  {task.id.slice(0, 8)}
                </span>
                {task.status === 'running' && <Loader2 size={14} className="text-accent animate-spin" />}
                {task.status === 'completed' && <CheckCircle2 size={14} className="text-success" />}
                {task.status === 'failed' && <XCircle size={14} className="text-error" />}
                {task.status === 'cancelled' && <X size={14} className="text-foreground-dim" />}
                {task.status === 'pending' && <Clock size={14} className="text-foreground-dim" />}
              </div>
              <span className={clsx(
                'px-2 py-0.5 rounded text-xs font-medium uppercase',
                task.status === 'running' && 'bg-accent/20 text-accent',
                task.status === 'completed' && 'bg-success/20 text-success',
                task.status === 'failed' && 'bg-error/20 text-error',
                task.status === 'pending' && 'bg-hover text-foreground-dim',
                task.status === 'cancelled' && 'bg-hover text-foreground-dim',
              )}>
                {task.status}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-foreground-muted">
              <span>{(task.sourceFiles || []).length} file(s)</span>
              <span>{(task.outputFormats || []).join(', ').toUpperCase()}</span>
              {task.completedAt && (
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {Math.round((task.completedAt - task.createdAt) / 1000)}s
                </span>
              )}
            </div>

            {task.error && (
              <div className="flex items-center gap-1 mt-2 text-xs text-error">
                <AlertTriangle size={10} />
                {task.error}
              </div>
            )}

            {task.status === 'running' && (
              <button
                className="mt-2 flex items-center gap-1 px-2 py-1 text-xs text-error hover:bg-error-muted rounded transition-colors"
                onClick={() => handleCancelTask(task.id)}
              >
                <X size={10} />
                Cancel
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
