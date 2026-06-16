import React, { useCallback, useEffect, useState } from 'react';
import { PipelineViz, ConstraintForm, ExportResult } from '@papyrus/ui';
import { OutputFormat } from '@papyrus/shared';
import { useSearchStore } from '../stores/search';
import { useWorkflowStore, ConvertTargetFormat, ConversionResult } from '../stores/workflow';
import { useTaskStore } from '../stores/task';
import { useWorkspaceStore } from '../stores/workspace';
import { X, Lock, Unlock, ChevronRight, Play, ArrowRightLeft, FolderOpen, FileText, CheckCircle2, AlertCircle, Sun, Moon, Palette, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

const STEPS = ['select', 'formats', 'constraints', 'review'] as const;
type WorkflowStep = typeof STEPS[number];

/** Map from file extension (lowercase, no dot) to source format for the converter */
const EXT_TO_SOURCE_FORMAT: Record<string, string> = {
  md: 'md', markdown: 'md',
  csv: 'csv',
  txt: 'txt', text: 'txt',
  mmd: 'mermaid', mermaid: 'mermaid',
  tex: 'latex', latex: 'latex',
};

/** Available direct-conversion target formats */
const CONVERT_TARGETS: ConvertTargetFormat[] = ['txt', 'md', 'html', 'docx', 'csv', 'latex', 'pdf'];

/** Supported conversion pairs (source → target) */
const SUPPORTED_CONVERSIONS: Record<string, ConvertTargetFormat[]> = {
  md:  ['txt', 'html', 'csv', 'docx', 'latex'],
  csv: ['txt', 'md', 'html', 'docx', 'latex'],
  txt: ['md', 'html', 'csv', 'docx', 'latex'],
  mermaid: ['txt', 'md', 'html', 'csv'],
  latex: ['md', 'html', 'txt', 'docx', 'pdf'],
};

/** Human-readable format labels */
const FORMAT_LABELS: Record<string, string> = {
  md: 'Markdown',
  txt: 'Plain Text',
  html: 'HTML',
  csv: 'CSV',
  pdf: 'PDF',
  docx: 'Word Document',
  mermaid: 'Mermaid',
  latex: 'LaTeX',
};

/** HTML conversion options state */
interface HtmlOptions {
  darkMode: boolean;
  textColor: string;
  headingColor: string;
  fontSize: number;
  includeMermaid: boolean;
}

const DEFAULT_HTML_OPTIONS: HtmlOptions = {
  darkMode: false,
  textColor: '#1a1a1a',
  headingColor: '#A68B4B',
  fontSize: 16,
  includeMermaid: true,
};

/**
 * WorkflowPanel — Owns the export flow, constraints, pipeline visualization,
 * and direct file format conversion.
 */
export const WorkflowPanel: React.FC = () => {
  const search = useSearchStore();
  const workflow = useWorkflowStore();
  const taskStore = useTaskStore();
  const workspace = useWorkspaceStore();
  const [convertTarget, setConvertTarget] = useState<ConvertTargetFormat>('txt');
  const [htmlOptions, setHtmlOptions] = useState<HtmlOptions>({ ...DEFAULT_HTML_OPTIONS });

  // Resolve selected file info
  const selectedFileIds = Array.from(search.selectedFiles);
  const selectedFileInfo = selectedFileIds.map(fileId => {
    const searchFile = search.results.find(r => r.fileId === fileId);
    const workspaceFile = workspace.files.find(f => f.id === fileId);
    const filePath = searchFile?.filePath ?? workspaceFile?.path ?? null;
    const fileName = searchFile?.fileName ?? workspaceFile?.name ?? fileId;
    const ext = filePath?.split('.').pop()?.toLowerCase() ?? '';
    const sourceFormat = EXT_TO_SOURCE_FORMAT[ext] ?? null;
    return { fileId, filePath, fileName, ext, sourceFormat };
  });

  // Compute the formats of selected files to filter export options
  const selectedFileFormats = new Set(
    selectedFileInfo
      .map(f => f.sourceFormat ?? f.ext)
      .filter((f): f is string => f !== null)
  );

  // Determine if direct conversion is available (single file selected, known source format)
  const singleFile = selectedFileInfo.length === 1 ? selectedFileInfo[0] : null;
  const canConvert = singleFile && singleFile.sourceFormat && singleFile.filePath;
  const convertTargets = canConvert ? (SUPPORTED_CONVERSIONS[singleFile!.sourceFormat!] ?? []) : [];
  const hasConvertTargets = convertTargets.length > 0;

  const handleRunTransformation = useCallback(async () => {
    if (selectedFileIds.length === 0 || workflow.selectedFormats.length === 0) return;

    // Resolve file IDs to file paths
    const sourceFilePaths = selectedFileInfo
      .map(f => f.filePath)
      .filter((p): p is string => p !== null);

    if (sourceFilePaths.length === 0) {
      workflow.setLastError('Could not resolve selected files. Try re-opening the workspace.');
      return;
    }

    workflow.setExecuting(true);
    workflow.setStep('review');
    workflow.setProgress(0);
    workflow.setLastError(null);

    try {
      const task = await window.papyrus?.createTask(
        sourceFilePaths,
        workflow.selectedFormats,
        workflow.constraints
      );

      if (task) {
        taskStore.addTask(task);
        taskStore.setActiveTask(task.id);
        toast.success('Export started', {
          description: `Transforming ${sourceFilePaths.length} file(s) to ${workflow.selectedFormats.join(', ').toUpperCase()}`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      workflow.setLastError(message);
      workflow.setExecuting(false);
      toast.error('Export failed', { description: message });
    }
  }, [selectedFileIds, selectedFileInfo, workflow, taskStore]);

  const handleConvert = useCallback(async () => {
    if (!canConvert || !singleFile?.filePath) return;

    workflow.setConverting(true);
    workflow.setLastError(null);
    workflow.setConversionResult(null);

    try {
      // Build HTML options if converting to HTML
      const htmlOpts = convertTarget === 'html' ? {
        darkMode: htmlOptions.darkMode,
        textColor: htmlOptions.textColor,
        headingColor: htmlOptions.headingColor,
        fontSize: htmlOptions.fontSize,
        includeMermaid: htmlOptions.includeMermaid,
      } : undefined;

      const result = await window.papyrus?.convertFile(singleFile.filePath, convertTarget, htmlOpts);

      if (result) {
        workflow.setConversionResult(result as ConversionResult);
        if (result.success) {
          toast.success('Conversion complete', {
            description: `${singleFile.fileName} → ${FORMAT_LABELS[convertTarget] || convertTarget.toUpperCase()} (${formatFileSize(result.fileSize)})`,
            action: {
              label: 'Open',
              onClick: () => window.papyrus?.openExport(result.outputPath),
            },
          });
        } else {
          toast.error('Conversion failed', { description: result.error });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      workflow.setLastError(message);
      toast.error('Conversion failed', { description: message });
    } finally {
      workflow.setConverting(false);
    }
  }, [canConvert, singleFile, convertTarget, htmlOptions, workflow]);

  const handleCancel = useCallback(async () => {
    if (taskStore.activeTaskId) {
      try {
        await window.papyrus?.cancelTask(taskStore.activeTaskId);
        toast.info('Export cancelled');
      } catch (error) {
        console.error('Cancel failed:', error);
      }
    }
    workflow.setExecuting(false);
    workflow.setProgress(0);
    workflow.setStep('select');
  }, [taskStore.activeTaskId, workflow]);

  // Determine which formats to show for the pipeline export — if ALL selected files share the same format, hide it
  const allFormats: OutputFormat[] = ['pdf', 'md', 'txt'];

  // If only one format and all selected files are that format, exclude it
  // If mix of formats, show all but mark same-as-source ones
  const availableFormats = selectedFileFormats.size === 1
    ? allFormats.filter(format => !selectedFileFormats.has(format))
    : allFormats;

  // Auto-deselect formats that are no longer available
  useEffect(() => {
    if (selectedFileFormats.size === 1) {
      const hiddenFormat = Array.from(selectedFileFormats)[0] as OutputFormat;
      if (workflow.selectedFormats.includes(hiddenFormat)) {
        workflow.toggleFormat(hiddenFormat);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFileFormats]);

  // Auto-select first available convert target when source format changes
  useEffect(() => {
    if (convertTargets.length > 0 && !convertTargets.includes(convertTarget)) {
      setConvertTarget(convertTargets[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convertTargets]);

  // Reset HTML options dark mode defaults when toggling
  const handleDarkModeToggle = useCallback((dark: boolean) => {
    setHtmlOptions(prev => ({
      ...prev,
      darkMode: dark,
      textColor: dark ? '#e0e0e0' : '#1a1a1a',
      headingColor: dark ? '#D4B87A' : '#A68B4B',
    }));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header with close */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Transformation</h2>
        <button
          className="p-1 rounded hover:bg-hover text-foreground-dim hover:text-foreground transition-colors"
          onClick={workflow.closePanel}
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 px-4 py-2">
        {STEPS.map((step, i) => {
          const stepIndex = STEPS.indexOf(workflow.step as WorkflowStep);
          const isActive = workflow.step === step;
          const isDone = i < stepIndex;

          return (
            <React.Fragment key={step}>
              <div className={clsx(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded',
                isActive && 'bg-accent-muted text-accent',
                isDone && 'text-success',
                !isActive && !isDone && 'text-foreground-dim',
              )}>
                <span className={clsx(
                  'flex items-center justify-center w-5 h-5 rounded-full text-xs',
                  isActive && 'bg-accent text-white',
                  isDone && 'bg-success/20 text-success',
                  !isActive && !isDone && 'bg-hover text-foreground-dim',
                )}>
                  {i + 1}
                </span>
                <span className="capitalize">{step}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={12} className="text-foreground-dim" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto px-4 py-2 space-y-4">
        {/* Error display */}
        {workflow.lastError && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-error-muted border border-error/30">
            <span className="text-sm text-error flex-1">{workflow.lastError}</span>
            <button
              className="text-xs text-error hover:underline"
              onClick={() => workflow.setLastError(null)}
            >
              dismiss
            </button>
          </div>
        )}

        {/* Quick Convert Section */}
        {hasConvertTargets && singleFile && (
          <div className="rounded-lg border border-accent/30 bg-accent-muted/30 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={14} className="text-accent" />
              <h3 className="text-xs font-semibold text-accent uppercase tracking-wider">
                Quick Convert
              </h3>
            </div>
            <p className="text-xs text-foreground-secondary">
              Directly convert <span className="font-medium text-foreground">{singleFile.fileName}</span> to a different format — no pipeline needed.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground-muted">From:</span>
              <span className={clsx(
                'px-2 py-0.5 rounded text-xs font-medium',
                'bg-card border border-border'
              )}>
                {FORMAT_LABELS[singleFile.sourceFormat!] || singleFile.sourceFormat!.toUpperCase()}
              </span>
              <ArrowRightLeft size={12} className="text-foreground-dim" />
              <span className="text-xs text-foreground-muted">To:</span>
              <div className="flex gap-1 flex-wrap">
                {convertTargets.map(fmt => (
                  <button
                    key={fmt}
                    className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                      convertTarget === fmt
                        ? 'bg-accent text-white'
                        : 'bg-card border border-border text-foreground-muted hover:text-foreground hover:border-accent/50'
                    )}
                    onClick={() => setConvertTarget(fmt)}
                    disabled={workflow.isConverting}
                    aria-pressed={convertTarget === fmt}
                  >
                    {FORMAT_LABELS[fmt] || fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* HTML Conversion Options — shown when converting to HTML */}
            {convertTarget === 'html' && (
              <div className="rounded-md border border-border p-2.5 space-y-2 bg-card/50">
                <div className="flex items-center gap-1.5">
                  <Palette size={12} style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                    HTML Options
                  </span>
                </div>

                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-secondary">Dark mode output</span>
                  <button
                    type="button"
                    className={clsx(
                      'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors',
                      htmlOptions.darkMode
                        ? 'bg-accent text-white'
                        : 'bg-hover text-foreground-muted'
                    )}
                    onClick={() => handleDarkModeToggle(!htmlOptions.darkMode)}
                    aria-pressed={htmlOptions.darkMode}
                  >
                    {htmlOptions.darkMode ? <Moon size={12} /> : <Sun size={12} />}
                    {htmlOptions.darkMode ? 'Dark' : 'Light'}
                  </button>
                </div>

                {/* Text Color */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-secondary">Text color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={htmlOptions.textColor}
                      onChange={(e) => setHtmlOptions(prev => ({ ...prev, textColor: e.target.value }))}
                      className="w-6 h-6 rounded border border-border cursor-pointer"
                      style={{ padding: 0 }}
                      aria-label="Text color"
                    />
                    <span className="text-xs text-foreground-dim font-mono">{htmlOptions.textColor}</span>
                  </div>
                </div>

                {/* Heading Color */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-secondary">Heading color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={htmlOptions.headingColor}
                      onChange={(e) => setHtmlOptions(prev => ({ ...prev, headingColor: e.target.value }))}
                      className="w-6 h-6 rounded border border-border cursor-pointer"
                      style={{ padding: 0 }}
                      aria-label="Heading color"
                    />
                    <span className="text-xs text-foreground-dim font-mono">{htmlOptions.headingColor}</span>
                  </div>
                </div>

                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-secondary">Font size</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min={12}
                      max={24}
                      value={htmlOptions.fontSize}
                      onChange={(e) => setHtmlOptions(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                      className="w-20 accent-accent"
                      aria-label="Font size"
                      aria-valuetext={`${htmlOptions.fontSize}px`}
                    />
                    <span className="text-xs text-foreground-dim font-mono w-6">{htmlOptions.fontSize}px</span>
                  </div>
                </div>

                {/* Mermaid Rendering */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-secondary">Render Mermaid diagrams</span>
                  <button
                    type="button"
                    className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                      htmlOptions.includeMermaid
                        ? 'bg-accent text-white'
                        : 'bg-hover text-foreground-muted'
                    )}
                    onClick={() => setHtmlOptions(prev => ({ ...prev, includeMermaid: !prev.includeMermaid }))}
                    aria-pressed={htmlOptions.includeMermaid}
                  >
                    {htmlOptions.includeMermaid ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            )}

            <button
              className={clsx(
                'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                workflow.isConverting
                  ? 'bg-hover text-foreground-dim cursor-not-allowed'
                  : 'bg-accent hover:bg-accent-hover text-white'
              )}
              onClick={handleConvert}
              disabled={workflow.isConverting}
            >
              {workflow.isConverting ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <ArrowRightLeft size={14} />
                  Convert to {FORMAT_LABELS[convertTarget] || convertTarget.toUpperCase()}
                </>
              )}
            </button>

            {/* Conversion Result */}
            {workflow.lastConversionResult && (
              <div className={clsx(
                'rounded-lg p-2.5 text-xs',
                workflow.lastConversionResult.success
                  ? 'bg-success/10 border border-success/30'
                  : 'bg-error-muted border border-error/30'
              )}>
                {workflow.lastConversionResult.success ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-success">
                      <CheckCircle2 size={14} />
                      <span className="font-medium">Conversion successful</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-foreground-secondary">
                      <FileText size={12} />
                      <span className="truncate">{workflow.lastConversionResult.outputPath.split(/[/\\]/).pop()}</span>
                      <span className="text-foreground-dim">({formatFileSize(workflow.lastConversionResult.fileSize)})</span>
                      <span className="text-foreground-dim">in {workflow.lastConversionResult.duration}ms</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        className="flex items-center gap-1 text-accent hover:underline"
                        onClick={() => window.papyrus?.openExport(workflow.lastConversionResult!.outputPath)}
                      >
                        <FileText size={10} /> Open
                      </button>
                      <button
                        className="flex items-center gap-1 text-accent hover:underline"
                        onClick={() => window.papyrus?.showExportInFolder(workflow.lastConversionResult!.outputPath)}
                      >
                        <FolderOpen size={10} /> Show in Folder
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 text-error">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{workflow.lastConversionResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected Files */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Selected Files ({search.selectedFiles.length})
            </h3>
            {search.selectedFiles.length > 0 && workflow.step === 'select' && (
              <button
                className="text-xs text-foreground-dim hover:text-foreground"
                onClick={search.clearSelection}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-1">
            {Array.from(search.selectedFiles).map((fileId) => {
              const searchFile = search.results.find((r) => r.fileId === fileId);
              const workspaceFile = workspace.files.find((f) => f.id === fileId);
              const fileName = searchFile?.fileName ?? workspaceFile?.name ?? fileId;
              return (searchFile || workspaceFile) ? (
                <div key={fileId} className="flex items-center gap-2 px-2 py-1 rounded bg-hover text-sm">
                  <span className="flex-1 truncate text-foreground-secondary">{fileName}</span>
                  {!workflow.isSelectionLocked && !workflow.isExecuting && (
                    <button
                      className="text-foreground-dim hover:text-error"
                      onClick={() => search.toggleFileSelection(fileId)}
                      aria-label={`Remove ${fileName}`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ) : null;
            })}
          </div>
          {workflow.step === 'select' && search.selectedFiles.length > 0 && !workflow.isSelectionLocked && (
            <button
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
              onClick={workflow.lockSelection}
            >
              <Lock size={14} />
              Lock Selection & Continue
            </button>
          )}
          {workflow.isSelectionLocked && workflow.step === 'formats' && (
            <div className="flex items-center gap-2 mt-2 text-xs text-foreground-muted">
              <Lock size={12} />
              Selection locked.
              <button className="text-accent hover:underline" onClick={workflow.unlockSelection}>
                <Unlock size={12} className="inline" /> Unlock
              </button>
            </div>
          )}
        </div>

        {/* Output Format Selection */}
        <div>
          <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Output Formats
          </h3>
          {search.selectedFiles.length > 0 && selectedFileFormats.size === 1 && (
            <p className="text-xs text-foreground-dim mb-2">
              {Array.from(selectedFileFormats)[0].toUpperCase()} is hidden — same as source file format
            </p>
          )}
          <div className="flex gap-2">
            {availableFormats.map((format) => {
              const sameAsSource = selectedFileFormats.size > 1 && selectedFileFormats.has(format);
              return (
                <label
                  key={format}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                    workflow.selectedFormats.includes(format)
                      ? 'border-accent bg-accent-muted text-accent'
                      : 'border-border bg-card hover:bg-hover text-foreground-muted',
                    sameAsSource && 'border-dashed opacity-70'
                  )}
                  title={sameAsSource ? 'Same as one of the source file formats' : undefined}
                >
                  <input
                    type="checkbox"
                    className="accent-accent"
                    checked={workflow.selectedFormats.includes(format)}
                    onChange={() => workflow.toggleFormat(format)}
                    disabled={workflow.isExecuting}
                  />
                  <span className={clsx(
                    'format-badge',
                    format === 'pdf' && 'format-badge--pdf',
                    format === 'md' && 'format-badge--md',
                    format === 'txt' && 'format-badge--txt',
                  )}>
                    {format}
                  </span>
                  {sameAsSource && (
                    <span className="text-[10px] text-foreground-dim italic">source</span>
                  )}
                </label>
              );
            })}
          </div>
          {availableFormats.length === 0 && (
            <p className="text-xs text-foreground-dim mt-1">
              No other formats available — source files already cover all options.
            </p>
          )}
        </div>

        {/* Constraints */}
        {!workflow.isExecuting && (
          <ConstraintForm
            constraints={workflow.constraints}
            selectedFormats={workflow.selectedFormats}
            onChange={workflow.setConstraints}
          />
        )}

        {/* Pipeline Visualization */}
        {(workflow.isExecuting || workflow.percentComplete > 0) && (
          <PipelineViz
            stages={['Markdown', 'IR', 'Workers', 'Exports']}
            percentComplete={workflow.percentComplete}
            workerStatuses={workflow.workerStatuses}
            onCancel={handleCancel}
          />
        )}

        {/* Export Results */}
        {workflow.exportResults.length > 0 && (
          <ExportResult exports={workflow.exportResults} />
        )}
      </div>

      {/* Footer Action */}
      <div className="px-4 py-3 border-t border-border space-y-2">
        {!workflow.isExecuting && (
          <div className="text-xs text-foreground-dim">
            Next: {workflow.step === 'select' ? 'Choose output formats' : workflow.step === 'formats' ? 'Set constraints' : workflow.step === 'constraints' ? 'Review and run' : 'View results'}
          </div>
        )}
        <button
          className={clsx(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
            workflow.isExecuting
              ? 'bg-red-600/80 hover:bg-red-600 text-white'
              : (search.selectedFiles.length === 0 || workflow.selectedFormats.length === 0)
                ? 'bg-hover text-foreground-dim cursor-not-allowed'
                : 'bg-accent hover:bg-accent-hover text-white'
          )}
          onClick={workflow.isExecuting ? handleCancel : handleRunTransformation}
          disabled={!workflow.isExecuting && (search.selectedFiles.length === 0 || workflow.selectedFormats.length === 0)}
        >
          {workflow.isExecuting ? (
            <>
              <XCircle size={14} />
              Cancel Export
            </>
          ) : (
            <>
              <Play size={14} />
              Export {workflow.selectedFormats.map(f => f.toUpperCase()).join(' & ')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/** Format bytes to human-readable string */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
