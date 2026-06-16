# Papyrus — Offline Document Transformation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)]()

Papyrus is an **offline-first desktop application** for transforming documents between formats. Convert Markdown, CSV, LaTeX, Mermaid diagrams, and DOCX files into HTML, PDF, DOCX, and more — all locally, no cloud dependency.

---

## Features

### 📄 Document Conversions

| From ↓ | To → | txt | html | md | csv | docx | latex | pdf |
|--------|:----:|:---:|:----:|:--:|:---:|:----:|:-----:|:---:|
| Markdown (.md) | | ✓ | ✓ | | ✓ | ✓ | ✓ | |
| CSV (.csv) | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Plain Text (.txt) | | | ✓ | ✓ | ✓ | ✓ | ✓ | |
| LaTeX (.tex) | | ✓ | ✓ | ✓ | | ✓ | | ✓ |
| Mermaid (.mmd) | | ✓ | ✓ | ✓ | ✓ | | | |
| Word (.docx) | | ✓ | ✓ | ✓ | ✓ | | ✓ | |

- **LaTeX → PDF**: Uses system `pdflatex` if available; falls back to pure-JS PDF generation via pdfkit
- **Batch conversion**: Select multiple files, convert to multiple formats in parallel
- **Cancellable**: Abort running conversions at any time

### 🖥️ User Interface

- **Three.js 3D theme**: Ancient papyrus-inspired quill, ink drops, gold particles, parchment ground
- **Intro animation**: "The Quill Awakens" — SVG quill draw + ink drop + letter-by-letter reveal
- **Workspace explorer**: Categorized file tree (Documents, Tables, Diagrams, Exports)
- **Dark / Light / System themes**: Papyrus-inspired warm-gold design tokens
- **Live progress**: Conversion pipeline visualization with phase indicators
- **Recent workspaces**: Quick access to last 10 opened workspaces

### 🔧 Architecture

```
monorepo/
├── apps/desktop/           Electron + React (renderer) + main process
│   ├── electron/           IPC handlers, file watcher, worker pool
│   └── src/                React UI (Zustand stores, views, components)
├── packages/
│   ├── shared/             Logger, types, utilities
│   ├── database/           SQLite (sql.js WASM) + migrations + repositories
│   ├── parsers/            Markdown & CSV parsers
│   ├── ir/                 Intermediate Representation (pipeline core)
│   ├── workers/            Converter functions + worker threads
│   ├── orchestrator/       Pipeline execution, scheduler
│   └── ui/                 Shared React components (Sidebar, FileCard, etc.)
```

### 🛡️ Security

- **Sandboxed**: Renderer process runs with `sandbox: true`
- **CSP**: Content Security Policy enforced (no `unsafe-inline`/`unsafe-eval` in production)
- **Workspace isolation**: All file operations validated via `isWithinWorkspace()`
- **No shell injection**: Uses `execFileSync` (not `execSync`) — args passed as array
- **No remote code**: All conversions run locally, no external API calls

### 🧪 Testing

| Suite | Tests | Status |
|-------|-------|--------|
| Converter | 31 | ✅ All passing |
| Database | 24 | ✅ All passing |
| **Total** | **55** | **✅ All passing** |

### 🎨 3D Theme

Ancient papyrus aesthetic — not cyberpunk:
- **Floating quill** with animated rotation
- **1200 warm-gold particles** with custom GLSL shader
- **30 falling ink drops** with splash effect
- **Parchment ground rings**
- **Custom cursor**: 6px gold dot + 32px ring + 80px glow trail
- **Glass-morphism UI**: `backdrop-filter: blur(20px)`, gold accents (`#C4A265`)

---

## Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | 18.x or later |
| npm | 9.x or later |
| OS | Windows 10+, macOS 12+, Ubuntu 20.04+ |

For LaTeX → PDF with system `pdflatex`: [TeX Live](https://www.tug.org/texlive/) or [MiKTeX](https://miktex.org/) (optional — pure-JS fallback built in)

---

## Quick Start

```bash
# Clone
git clone https://github.com/<your-org>/papyrus.git
cd papyrus

# Install
npm install

# Run in dev mode (HMR + hot reload)
npm run dev

# Run tests
npm test

# Build all packages
npm run build

# Package installer
npm run build:win     # Windows NSIS installer
npm run build:mac     # macOS DMG
```

The Electron window opens automatically with the intro animation. Select a workspace (any folder with `.md`, `.csv`, `.tex`, `.mmd`, `.docx` files) and start converting.

### Try the Sample Workspace

```bash
# In the app: File → Open Workspace → select sample-workspace/
npm run dev  # then open sample-workspace/
```

---

## Production Build & Installer

```bash
npm run build
npm run build:win
```

Output: `apps/desktop/dist/build/Papyrus-Setup-{version}.exe` (~80 MB)

The NSIS installer features:
- Step-by-step checklist wizard (✓ animated steps)
- Custom Start Menu & Desktop shortcuts
- `.papyrus-workspace` file association
- Uninstaller with registry cleanup

---

## Architecture

### Data Flow

```
Source File → Parser → IR Builder → Validator → Worker Pool → Export
```

1. **Parser**: Converts source files to standardized Intermediate Representation (IR)
2. **IR Layer**: Validates structure, transforms nodes, serializes
3. **Orchestrator**: Schedules tasks across worker threads
4. **Worker Pool**: Multi-threaded conversions (up to 2 workers) with auto-respawn on crash
5. **Export Manager**: Deduplicates filenames, writes manifests, tracks history

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 28 |
| UI | React 18 + Zustand + Framer Motion |
| Styling | Tailwind CSS + PostCSS |
| 3D | Three.js (lazy-loaded, saved 528 kB) |
| Database | sql.js (WASM-based SQLite) |
| Worker Threads | Node.js `worker_threads` |
| Build | Vite 5 + vite-plugin-electron |
| Packaging | electron-builder |
| Test | Vitest |

### Database Migrations

Versioned migration system (v1–v4):
- **v1**: Initial schema — workspaces, files, embeddings, traces, exports
- **v2**: Added `source_path`, `worker_name`, `duration_ms` to exports
- **v3**: Added `name`, `size`, `modified_at` columns to files
- **v4**: Composite indexes for fast lookups

Backup before any migration; per-step error diagnostics.

---

## Project Structure

```
papyrus/
├── apps/desktop/
│   ├── electron/           Main process
│   │   ├── main.ts         IPC handlers, window, worker pool, file watcher
│   │   └── preload.ts      Context bridge (37+ typed API methods)
│   ├── src/                Renderer (React)
│   │   ├── app/            Shell, Bootstrap, router
│   │   ├── components/     Reusable UI components
│   │   ├── stores/         Zustand stores
│   │   ├── views/          Page-level views
│   │   └── vite-env.d.ts   window.papyrus type declarations
│   └── build/              Installer resources (icons, NSIS script)
├── packages/
│   ├── shared/             Logger, types, utilities
│   ├── database/           SQLite adapter, migrations, repositories
│   ├── parsers/            Parser implementations
│   ├── ir/                 IR builder, validator, traversal
│   ├── workers/            Converter functions + worker thread entry
│   ├── orchestrator/       Pipeline orchestration
│   └── ui/                 Shared react components
└── sample-workspace/       Demo workspace

```

---

## Configuration

### env

No environment variables required. All dependencies are local.

### electron-builder

Configured in `apps/desktop/electron-builder.yml`:
- Windows: NSIS with custom wizard
- macOS: DMG
- Linux: AppImage

### CSP

Content Security Policy is set in `main.ts`. In dev mode, connections to Vite HMR and Mermaid CDN are allowed. In production, `script-src` is strict (`'self'` only).

---

## Known Limitations (v1)

| Limitation | Details |
|------------|---------|
| PDF Preview | PDF files open externally — no in-app viewer |
| Search | Filename/path search only — no full-text content search |
| CSV Parsing | Quoted fields with commas may not render correctly in preview |
| LaTeX Math | Math notation converted to plain text in pdfkit fallback |
| AI Features | Disabled in v1 (Ollama, RAG, semantic search) |
| Mermaid Rendering | Diagrams shown as code text, not rendered |
| Auto-Update | Users must download new versions manually |

## v2 Roadmap

- **Microsoft MarkItDown**: Support PDF, DOCX, PPTX, XLSX, HTML as input
- **Full-text search**: Index document content for search
- **Mermaid rendering**: Live diagram preview in app
- **Plugin system**: Extensible worker and parser architecture

---

## Development

```bash
# Type check
npx tsc --noEmit

# Run tests
npx vitest run

# Watch mode
npm run test:watch

# Build specific package
npm run build --workspace=@papyrus/workers

# Lint (future)
# npm run lint
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `converter-thread.js` not found | Run `npm run build` first |
| `pdflatex not found` | Install TeX Live/MiKTeX, or use built-in JS fallback |
| `workspace.db.tmp` leftover | Fixed — stale `.tmp` files cleaned on DB open |
| DevTools opens in dev mode | Fixed — removed from `createWindow()` |
| Worker crash loop | Fixed — crash counter stops after 3 consecutive failures |

### Debugging

- Main process logs: visible in terminal running `npm run dev`
- Renderer logs: Electron DevTools (Ctrl+Shift+I)
- Crash reports: stored in `%APPDATA%/Papyrus/crashes/`
- Database: `{workspace}/.papyrus/workspace.db`

---

## License

MIT License — see [LICENSE](LICENSE).

---

## Acknowledgments

- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) for DOCX conversion
- [pdfkit](https://github.com/foliojs/pdfkit) for pure-JS PDF generation
- [Three.js](https://threejs.org/) for 3D rendering
- [sql.js](https://github.com/sql-js/sql.js/) for WASM-based SQLite
- [Mermaid](https://mermaid.js.org/) for diagram support
- [Framer Motion](https://www.framer.com/motion/) for animations
