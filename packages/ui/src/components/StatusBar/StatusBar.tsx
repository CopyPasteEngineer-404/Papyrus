import React from 'react';
import { Activity, Circle, Database, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface StatusBarProps {
  status: 'READY' | 'RUNNING';
  aiProvider: string;
  aiOnline: boolean;
  indexed: boolean;
  tasksCompleted: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  status, aiProvider, aiOnline, indexed, tasksCompleted,
}) => {
  return (
    <footer className="flex items-center justify-between h-6 px-4 border-t border-border bg-background-secondary text-xs select-none">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1">
          {status === 'RUNNING' ? (
            <Activity size={10} className="text-accent animate-pulse" />
          ) : (
            <Circle size={8} className={clsx('fill-success text-success')} />
          )}
          <span className={status === 'RUNNING' ? 'text-accent font-medium' : 'text-foreground-muted'}>
            {status}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-4 text-foreground-dim">
        <span>{aiProvider}: {aiOnline ? 'Online' : 'Offline'}</span>
        <span className="flex items-center gap-1">
          <Database size={10} />
          {indexed ? 'Indexed' : 'Not indexed'}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 size={10} />
          {tasksCompleted} completed
        </span>
      </div>
    </footer>
  );
};
