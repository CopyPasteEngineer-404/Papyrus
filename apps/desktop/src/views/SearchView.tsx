import React, { useCallback, useState } from 'react';
import { SearchBar, FileCard } from '@papyrus/ui';
import { useSearchStore } from '../stores/search';
import { useWorkflowStore } from '../stores/workflow';
import { useWorkspaceStore } from '../stores/workspace';
import { FolderOpen, Search, Loader2, FileText, Table2, FileCode } from 'lucide-react';

/**
 * SearchView — File search and selection surface.
 * Surface: 'search'
 *
 * Improvements over baseline:
 * - Filename search, path search, extension search
 * - Filter tabs: All, Documents (.md), Tables (.csv), Exports
 * - Search type indicator (by filename / by path / by extension)
 * - Result badges showing match type
 */
export const SearchView: React.FC = () => {
  const search = useSearchStore();
  const workflow = useWorkflowStore();
  const workspace = useWorkspaceStore();

  // Filter by active tab
  const getFilteredResults = useCallback(() => {
    const tab = search.activeTab;
    if (tab === 'All') return search.results;
    if (tab === 'Documents') return search.results.filter(r => r.format === 'md');
    if (tab === 'Tables') return search.results.filter(r => r.format === 'csv');
    if (tab === 'Exports') return search.results.filter(r => r.format === 'pdf' || r.filePath?.includes('exports'));
    return search.results;
  }, [search.results, search.activeTab]);

  const filteredResults = getFilteredResults();

  const handleSearch = useCallback(async () => {
    search.setSearching(true);
    try {
      const filters: any = {};
      // Apply format filter from active tab
      if (search.activeTab === 'Documents') filters.formats = ['md'];
      if (search.activeTab === 'Tables') filters.formats = ['csv'];

      const results = await window.papyrus?.search(search.query, filters) || [];
      search.setResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      search.setSearching(false);
    }
  }, [search]);

  const handleOpenWorkspace = useCallback(async () => {
    try {
      const result = await window.papyrus?.openWorkspace('');
      if (result) {
        workspace.setWorkspace(result.path, result.name);
        // Populate files from the IPC result — same fix as WorkspaceView.tsx
        if (result.files && Array.isArray(result.files)) {
          workspace.setFiles(result.files.map((f: any) => ({
            id: f.id,
            name: f.name,
            path: f.path,
            format: f.format,
            size: f.size ?? 0,
            modifiedAt: f.modifiedAt || Date.now(),
          })));
        }
        // setWorkspace() resets isIndexed=false; must restore it here
        workspace.setIndexed(true);
        workspace.setIndexing(false);
      }
    } catch (error) {
      console.error('Failed to open workspace:', error);
      alert(`Failed to open workspace: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [workspace]);

  /** Determine what matched — filename, path, or extension */
  const getMatchType = useCallback((result: any, query: string): string[] => {
    if (!query) return [];
    const matches: string[] = [];
    const q = query.toLowerCase();
    const fileName = result.fileName?.toLowerCase() || '';
    const filePath = result.filePath?.toLowerCase() || '';
    const ext = result.format?.toLowerCase() || '';

    if (fileName.includes(q)) matches.push('filename');
    if (filePath.includes(q)) matches.push('path');
    if (ext === q || `.${ext}` === q) matches.push('extension');
    return matches;
  }, []);

  // Empty state: No workspace open
  if (!workspace.currentPath) {
    return (
      <div className="flex flex-col h-full">
        <SearchBar
          value={search.query}
          onChange={search.setQuery}
          onSearch={handleSearch}
          resultCount={0}
          tabs={['All', 'Documents', 'Tables', 'Exports']}
          activeTab={search.activeTab}
          onTabChange={search.setActiveTab}
        />
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <FolderOpen size={48} className="text-foreground-dim mb-4" />
          <h3 className="text-lg font-medium text-foreground">No workspace open</h3>
          <p className="text-sm text-foreground-muted mt-1 mb-4">
            Open a workspace folder to start searching and transforming documents
          </p>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
            onClick={handleOpenWorkspace}
          >
            <FolderOpen size={16} />
            Open Workspace
          </button>
        </div>
      </div>
    );
  }

  // Empty state: Workspace not indexed yet
  if (workspace.isIndexing) {
    return (
      <div className="flex flex-col h-full">
        <SearchBar
          value={search.query}
          onChange={search.setQuery}
          onSearch={handleSearch}
          resultCount={0}
          tabs={['All', 'Documents', 'Tables', 'Exports']}
          activeTab={search.activeTab}
          onTabChange={search.setActiveTab}
        />
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <Loader2 size={48} className="text-accent animate-spin mb-4" />
          <h3 className="text-lg font-medium text-foreground">Indexing workspace...</h3>
          <p className="text-sm text-foreground-muted mt-1">
            Scanning {workspace.name} for supported files
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SearchBar
        value={search.query}
        onChange={search.setQuery}
        onSearch={handleSearch}
        resultCount={filteredResults.length}
        tabs={['All', 'Documents', 'Tables', 'Exports']}
        activeTab={search.activeTab}
        onTabChange={search.setActiveTab}
      />

      {/* Search hints */}
      {search.query && (
        <div className="flex items-center gap-2 px-2 mb-2">
          <span className="text-xs" style={{ color: 'var(--fg-dim, #71717a)' }}>
            Search by filename, path, or extension (e.g. "readme", ".md", "docs/")
          </span>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {search.isSearching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-accent animate-spin" />
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="space-y-2">
            {filteredResults.map((file) => {
              const matchTypes = getMatchType(file, search.query);
              return (
                <div key={file.fileId} className="relative">
                  <FileCard
                    file={{
                      id: file.fileId,
                      name: file.fileName,
                      path: file.filePath,
                      format: file.format,
                      size: file.size,
                      modifiedAt: file.modifiedAt,
                      snippet: matchTypes.length > 0
                        ? `Matched by: ${matchTypes.join(', ')}`
                        : file.snippet,
                    }}
                    selected={search.selectedFiles.includes(file.fileId)}
                    onSelect={search.toggleFileSelection}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={48} className="text-foreground-dim mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              {search.query ? 'No results found' : 'Search for documents'}
            </h3>
            <p className="text-sm text-foreground-muted mt-1">
              {search.query
                ? `No files matching "${search.query}" were found`
                : 'Type a search query and press Enter to find files in your workspace'
              }
            </p>
            {!search.query && (
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-foreground-dim">
                  <FileText size={14} style={{ color: '#C4A265' }} />
                  .md files
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foreground-dim">
                  <Table2 size={14} style={{ color: '#A68B4B' }} />
                  .csv files
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foreground-dim">
                  <FileCode size={14} style={{ color: '#D4B87A' }} />
                  .mmd files
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selection bar */}
        {search.selectedFiles.length > 0 && (
          <div className="sticky bottom-0 flex items-center justify-between px-4 py-2 bg-background-secondary border-t border-border">
            <span className="text-sm text-foreground-muted">{search.selectedFiles.length} items selected</span>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:bg-hover rounded-md transition-colors"
                onClick={search.clearSelection}
              >
                Clear
              </button>
              <button
                className="px-3 py-1.5 text-xs bg-accent hover:bg-accent-hover text-white rounded-md transition-colors"
                onClick={() => { workflow.openPanel(); workflow.setStep('formats'); }}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
