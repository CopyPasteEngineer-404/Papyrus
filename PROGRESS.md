# Papyrus (V1) — Progress

## Idea

Papyrus is an offline-first desktop document converter. It transforms Markdown, CSV, LaTeX, Mermaid diagrams, and DOCX files between formats (txt, html, md, csv, docx, latex, pdf) — all locally, no cloud. The app uses an Electron + React frontend, a multi-threaded worker pool for conversions, and SQLite (via sql.js WASM) for workspace metadata.

This copy (`Papyrus_Fixed`) is the **original V1 codebase** where all bugs, security issues, and missing features were audited and fixed. It served as the stable foundation that was later forked into **Papyrus V2** (which adds Ollama-powered OCR).

## Goal (V1)

Deliver a production-ready, stable desktop document converter with:
- No crashes on edge cases (null paths, missing files, empty workspaces)
- No security holes (path traversal, shell injection, CSP bypass)
- Clean code (no dead Three.js code, no duplicate logic, no fire-and-forget promises)
- Working migrations (atomic per-step, safe rollback)
- Proper DOCX inline formatting (bold, italic, code, links)
- Mermaid → DOCX/LaTeX/PDF conversion routes
- All 8 packages compiling with zero TypeScript errors

## Progress Overview

| Area | Status |
|------|--------|
| Phase 1 — Initial audit fixes | Complete (50+ fixes) |
| Phase 2 — Targeted 21 issues | Complete (all resolved) |
| Full build | ✅ All 8 packages pass |
| Missing features inventory | Complete (Three.js removed, routes added) |
| DOCX inline formatting | Fixed (mdInlineToDocxXml) |
| Mermaid → DOCX/LaTeX/PDF | Added |
| PDF fallback inline rendering | Fixed (renderInline in pdfkit) |
| Forked to V2 | Done |

## What Was Done

### Phase 1 — Initial Audits (50+ fixes)
- Three.js 3D theme removed (no source files remain)
- `converter.ts` bugs (mammoth type cast, `execFileSync` path sanitization, dead code)
- `main.ts` null checks, file watcher ignores `.papyrus/`, workspace isolation fallback
- `ExportPreview` double-render, `SearchBar`/`ProgressBar` a11y attributes
- Dead code elimination (unused `localStorage` writes, duplicate helper functions)
- Package deduplication in root `package.json`
- README written from scratch

### Phase 2 — 21 Targeted Issues

**Critical**:
- **C1**: File upsert deduplication — `ON CONFLICT(workspace_id, path)` with unique composite index + pre-lookup (`repositories/file.ts`, `migrations.ts` v5)
- **C2**: Pipeline completion moved out of fire-and-forget IIFE — now properly awaited (`main.ts`)

**High**:
- **H1**: File watcher ignores `.papyrus/` directory (`main.ts`)
- **H2**: `isWithinWorkspace` fallback checks `path.sep` before `startsWith` (`main.ts`)
- **H3**: Production CSP comment corrected (`main.ts`)
- **H4**: `sanitizeFilename` preserves Unicode characters (`filename.ts`)
- **H5**: `window.confirm` replaced with React modal overlay (`FileEditor.tsx`)
- **H6**: Crash dump capped at 20 files, oldest pruned on launch (`main.ts`)
- **H7**: Redundant `localStorage` theme write removed (`initialization.ts`)

**Medium**:
- **M1**: `generateFilename`/`getOutputPath` converted to async (`export-manager.ts`)
- **M2**: `getRecentWorkspaces`/`setRecentWorkspaces`/`removeRecentWorkspace` helpers extracted, all call sites updated (`main.ts`)
- **M3**: Migration steps wrapped per-step (no rollback); backup restored on failure (`migrations.ts`)
- **M4**: Vite dev URLs confirmed production-gated — false positive, no change
- **M5**: ClockWidget listener fire guarded with try-catch + stable listener copy (`ClockWidget.tsx`)
- **M6**: `listenerMap` split per-channel to prevent channel collision (`preload.ts`)
- **M7**: `execFileSync` paths sanitized via `path.resolve` (`converter.ts`)
- **M8**: `app.quit()` inside `before-quit` → `app.exit(0)` (`main.ts`)

**Low**:
- **L1**: `addRecentWorkspace` null/undefined guard (`main.ts`)
- **L2**: `docx→pdf` conversion route added via LaTeX intermediate (`converter.ts`)
- **L3**: Unused `const m = mammoth as any` removed (`converter.ts`)
- **L4–L6**: Confirmed false positives (fields don't exist, CSP already correct)

### Feature Work
- **DOCX inline formatting**: `mdInlineToDocxXml()` replaces `stripInline()` — bold, italic, code, links, strikethrough now produce proper `<w:r><w:rPr>` Open XML runs (`converter.ts`)
- **Mermaid→DOCX/LaTeX/PDF**: 3 new conversion paths through Markdown intermediate (`converter.ts`)
- **PDF fallback**: `convertLatexToPdfViaHtml` gains `renderInline()` using pdfkit `continued: true` for bold/italic/code/links (`converter.ts`)
- **Three.js cleanup**: All source files removed, residual type strings (`'threejs'` in settings.ts, ipc.ts, Sidebar.tsx, ScribbleLoader.tsx) cleaned up

### Infrastructure
- All edits target `Papyrus1\Papyrus\` (the working copy)
- Source archive preserved in `source\` directory
- Forked to `C:\Users\KOLKATA\Desktop\opencode\Papyrus V2\` for V2 development

## Build Status

```
@papyrus/shared      — tsc      ✅ PASS
@papyrus/ir          — tsc      ✅ PASS
@papyrus/parsers     — tsc      ✅ PASS
@papyrus/workers     — tsc      ✅ PASS
@papyrus/orchestrator— tsc      ✅ PASS
@papyrus/database    — tsc      ✅ PASS
@papyrus/ui          — tsc      ✅ PASS
@papyrus/desktop     — vite     ✅ PASS (tested during Phase 2)
```

All 8 packages compile with zero TypeScript errors.

## V2 Fork

This codebase was forked to `C:\Users\KOLKATA\Desktop\opencode\Papyrus V2\` for the next phase:
- Ollama OCR pipeline (image → Markdown via local vision models)
- PDF → Markdown via Ollama
- Single-runtime AI architecture (Ollama only, no cloud APIs)

The V1 codebase here is considered **stable and complete** — no further changes planned.

## Architecture

```
monorepo/
├── apps/desktop/           Electron + React (renderer + main process)
│   ├── electron/           IPC handlers, file watcher, worker pool, export manager
│   └── src/                React UI (Zustand stores, views, components)
├── packages/
│   ├── shared/             Types, schemas (Zod), utilities (logger, sanitizeFilename)
│   ├── database/           SQLite (sql.js WASM), migrations (v1–v5), repositories
│   ├── parsers/            Markdown & CSV parsers
│   ├── ir/                 Intermediate Representation (pipeline core)
│   ├── workers/            Converter functions + worker thread entry
│   ├── orchestrator/       Pipeline execution, scheduler
│   └── ui/                 Shared React components (Sidebar, FileCard, etc.)
```

## Relevant Files

| File | Key Changes |
|------|-------------|
| `packages/database/src/repositories/file.ts` | C1 — Unique composite index upsert |
| `packages/database/src/migrations.ts` | C1 (v5), M3 — per-step migration safety |
| `apps/desktop/electron/main.ts` | C2, H1, H2, H3, H6, M2, M8, L1 — pipeline, watcher, CSP, crash dumps, helpers |
| `apps/desktop/electron/preload.ts` | M6 — per-channel listenerMap |
| `apps/desktop/electron/export-manager.ts` | M1 — async generateFilename |
| `apps/desktop/src/components/workspace/FileEditor.tsx` | H5 — React modal |
| `apps/desktop/src/app/initialization.ts` | H7 — redundant theme write removed |
| `packages/shared/src/utils/filename.ts` | H4 — Unicode-safe sanitizeFilename |
| `apps/desktop/src/components/widgets/ClockWidget.tsx` | M5 — guarded listener fire |
| `packages/workers/src/converter.ts` | M7, L2, L3, DOCX inline, Mermaid routes, PDF inline render |
