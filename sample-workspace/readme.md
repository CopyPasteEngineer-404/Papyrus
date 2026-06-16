# Papyrus — Document Transformation App

## Welcome

Papyrus is an offline-first desktop application for transforming documents between formats. It supports Markdown, CSV, Mermaid diagrams, and plain text files with exports to PDF, HTML, DOCX, and more.

## Key Features

### Multi-Format Support
Papyrus handles a variety of input and output formats:

- **Markdown** (.md) — Full support including tables, code blocks, and mermaid diagrams
- **CSV** (.csv) — Professional parsing with quoted field handling
- **Mermaid** (.mmd, .mermaid) — Diagram source code with rendering support
- **Plain Text** (.txt) — Clean text with smart paragraph detection

### Export Formats
Convert your documents to professional output formats:

1. **PDF** — Styled documents with table of contents, tables, and rendered diagrams
2. **HTML** — Self-contained web pages with embedded CSS and Mermaid.js
3. **DOCX** — Microsoft Word compatible documents with styled tables and headings
4. **CSV** — Extract table data from any format
5. **Markdown** — Clean markdown with proper syntax
6. **Plain Text** — Stripped formatting with aligned tables

### Four Beautiful Themes

| Theme | Style | Description |
|-------|-------|-------------|
| Papyrus | Manuscript & Parchment | Classic ink-on-parchment aesthetic with gold accents |
| Halftone | Newsprint & Retro Comic | Dot-patterned retro print style with teal highlights |
| Isometric | Professional 3D Depth | Clean professional look with subtle 3D elements |
| Minimal Art | Gallery & Exhibition | Minimalist gallery style with terracotta warmth |

### Pipeline Architecture

The transformation pipeline follows a clean architecture:

```
Source File → Parser → Intermediate Representation (IR) → Workers → Export Files
```

This design ensures:

- **Format-agnostic transformations** — The IR decouples input from output
- **Parallel worker execution** — Each output format is generated independently
- **Validation at every stage** — Data integrity checks throughout the pipeline

## Technical Stack

- **Electron** — Desktop application framework
- **React + Zustand** — UI with lightweight state management
- **SQLite (sql.js)** — Local database for workspace metadata
- **Tailwind CSS** — Utility-first styling with CSS custom properties
- **Chokidar** — File system watching for live workspace updates

## Getting Started

1. Open a workspace folder containing your documents
2. Select files you want to transform
3. Choose output formats in the right panel
4. Click **Export** to generate your converted documents

---

*Built with Papyrus — Offline Document Transformation*
