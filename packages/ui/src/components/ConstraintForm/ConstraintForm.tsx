import React from 'react';
import { ConstraintSet, OutputFormat, DEFAULT_CONSTRAINT_SET } from '@papyrus/shared';
import { SlidersHorizontal } from 'lucide-react';

interface ConstraintFormProps {
  constraints: ConstraintSet;
  selectedFormats: OutputFormat[];
  onChange: (constraints: ConstraintSet) => void;
}

export const ConstraintForm: React.FC<ConstraintFormProps> = ({
  constraints, selectedFormats, onChange,
}) => {
  const updatePdf = (key: string, value: any) => {
    onChange({
      ...constraints,
      pdf: { ...DEFAULT_CONSTRAINT_SET.pdf, ...constraints.pdf, [key]: value },
    });
  };

  if (!selectedFormats.includes('pdf')) return null;

  const pdf = constraints.pdf || {};

  return (
    <div className="space-y-3 py-3">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <SlidersHorizontal size={14} />
        PDF Constraints
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground-muted">Paper Size</span>
          <select
            className="px-2 py-1.5 bg-background-secondary border border-border rounded-md text-sm text-foreground focus:border-accent focus:outline-none"
            value={pdf.paperSize || 'A4'}
            onChange={(e) => updatePdf('paperSize', e.target.value)}
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground-muted">Font Size</span>
          <input
            type="number"
            className="px-2 py-1.5 bg-background-secondary border border-border rounded-md text-sm text-foreground focus:border-accent focus:outline-none"
            value={pdf.fontSize || 12}
            min={8}
            max={72}
            onChange={(e) => updatePdf('fontSize', Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-foreground-muted">Line Height</span>
          <input
            type="number"
            className="px-2 py-1.5 bg-background-secondary border border-border rounded-md text-sm text-foreground focus:border-accent focus:outline-none"
            value={pdf.lineHeight || 1.6}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => updatePdf('lineHeight', Number(e.target.value))}
          />
        </label>
        <div className="flex items-center gap-4 pt-5">
          <label className="flex items-center gap-2 text-sm text-foreground-muted">
            <input
              type="checkbox"
              className="accent-accent"
              checked={pdf.includeToc || false}
              onChange={(e) => updatePdf('includeToc', e.target.checked)}
            />
            Include TOC
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground-muted">
            <input
              type="checkbox"
              className="accent-accent"
              checked={pdf.darkMode || false}
              onChange={(e) => updatePdf('darkMode', e.target.checked)}
            />
            Dark Mode
          </label>
        </div>
      </div>
    </div>
  );
};
