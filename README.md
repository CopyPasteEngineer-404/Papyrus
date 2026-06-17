# Papyrus

**Offline-first intelligent multi-format document transformation harness**

Papyrus is a desktop application for authoring, viewing, and converting documents across multiple formats. It provides a pipeline-based transformation engine, a rich workspace UI with file management, and support for Markdown, CSV, LaTeX, DOCX, Mermaid diagrams, and plain text.

## Features

- **Multi-format conversion** — Convert between Markdown, CSV, plain text, LaTeX, DOCX, Mermaid, HTML, and PDF with 30 supported conversion paths
- **Pipeline export** — Transform a single source file into multiple output formats simultaneously (PDF, Markdown, HTML, TXT)
- **Workspace management** — Open, index, and browse local directories as workspaces with file tree navigation
- **Rich document viewer** — View Markdown (rendered), CSV (tables), LaTeX (structure/source), Mermaid (diagrams), HTML (sandboxed iframe), PDF (embedded), and plain text
- **File editor** — Inline editing of workspace files with save support
- **Search** — Full-text search across workspace files with filter tabs (All/Documents/Tables/Exports)
- **Task history** — Track conversion pipeline execution with status, timing, and cancellation
- **Export management** — Browse and open exported files with system viewer integration
- **Theme system** — Four visual skins (Papyrus, Halftone, Isometric, Minimal Art) with light/dark/system color modes
- **Setup wizard** — First-launch onboarding for theme, layout, and workspace configuration
- **Keyboard shortcuts** — Quick navigation between views (`Ctrl+1`–`Ctrl+6`), layout toggle (`Ctrl+Shift+L`)
- **Diagnostics** — Built-in smoke test to verify all subsystems

## Supported Formats

| Source | Target |
|--------|--------|
| Markdown (`.md`, `.markdown`) | TXT, HTML, CSV, DOCX, LaTeX |
| CSV (`.csv`) | TXT, HTML, MD, DOCX, LaTeX |
| Plain Text (`.txt`, `.text`) | MD, HTML, CSV, DOCX, LaTeX |
| Mermaid (`.mmd`, `.mermaid`) | TXT, MD, HTML, CSV |
| LaTeX (`.tex`, `.latex`) | MD, HTML, TXT, DOCX, PDF |
| DOCX (`.docx`) | TXT, MD, HTML, CSV, LaTeX, PDF |

## Architecture

Papyrus is structured as an npm monorepo with these packages:

| Package | Description |
|---------|-------------|
| `apps/desktop` | Electron desktop application (React UI + main process) |
| `packages/shared` | Shared types, utilities, schemas, IPC protocols |
| `packages/parsers` | Format-specific parsers (Markdown, CSV) |
| `packages/ir` | Intermediate Representation — builder, validator, serializer |
| `packages/workers` | Export workers, file converter, worker pool, converter thread |
| `packages/orchestrator` | Pipeline scheduler and executor |
| `packages/database` | SQLite database, migrations, repositories |
| `packages/ui` | Shared UI components (Sidebar, SearchBar, FileCard, etc.) |

The conversion pipeline flows as:

```
Source File → Format Parser → Intermediate Representation (IR) → Workers → Export Files
```

A direct converter path is also available for single-format "Save As" operations.

## Prerequisites

- Node.js >= 18
- npm >= 9
- For LaTeX-to-PDF: `pdflatex` on system PATH (optional — falls back to pdfkit)

## Getting Started

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start development
npm run dev
```

## Build

```bash
# Build all packages
npm run build

# Build only packages (skip desktop electron build)
npm run build:packages

# Build only desktop
npm run build:desktop
```

## Test

```bash
npm test
npm run test:watch
```

## License

MIT


## Contributions

Contributions are welcomed (๑ᵕ◡ᵕ)
Feel free to contribute (ˆ◡ˆc)






