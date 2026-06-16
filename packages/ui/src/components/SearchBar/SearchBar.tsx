import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  resultCount: number;
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * SearchBar — Text input + tabs for filtering.
 *
 * Important: The input must NOT be inside any element that
 * intercepts keyboard events. The input uses standard React
 * onChange to ensure typing always works regardless of any
 * global keydown listeners that may have been attached by
 * the intro overlay or other components.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value, onChange, onSearch, resultCount, tabs, activeTab, onTabChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only intercept Enter — let all other keys pass through to the input
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
    // Do NOT call e.preventDefault() or e.stopPropagation() for other keys
    // This ensures the user can always type in the search bar
  };

  // Focus the input when the component mounts
  useEffect(() => {
    // Delay focus slightly to avoid conflicts with intro overlay
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-dim pointer-events-none" />
          <input
            ref={inputRef}
            className="w-full pl-9 pr-8 py-2 bg-background-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-foreground-dim focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors"
            type="text"
            placeholder="Search by filename, path, or extension..."
            value={value}
            onChange={(e) => {
              // Direct state update — never blocked
              onChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {value && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-dim hover:text-foreground"
              onClick={() => onChange('')}
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
          onClick={onSearch}
          type="button"
        >
          Search
        </button>
      </div>
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={clsx(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors duration-fast',
              activeTab === tab
                ? 'bg-accent-muted text-accent'
                : 'text-foreground-muted hover:text-foreground hover:bg-hover'
            )}
            onClick={() => onTabChange(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
        {resultCount > 0 && (
          <span className="ml-auto text-xs text-foreground-dim">{resultCount} results</span>
        )}
      </div>
    </div>
  );
};
