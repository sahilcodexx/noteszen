# NotesZen

**Version 0.1.0** — A macOS-inspired Markdown note-taking desktop application built with Tauri 2, React 19, TypeScript, SQLite, and Tailwind CSS v4. Designed for a premium writing experience on Linux and other desktop environments.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
  - [Web Development Server](#web-development-server)
  - [Desktop Application](#desktop-application)
  - [Testing](#testing)
  - [Linting](#linting)
  - [Production Build](#production-build)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Storage](#storage)
  - [Database Schema](#database-schema)
  - [Image Storage](#image-storage)
- [Sync](#sync)
- [Configuration](#configuration)
  - [Tauri Configuration](#tauri-configuration)
  - [AI Integration](#ai-integration)
  - [Spell Check](#spell-check)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

NotesZen is a feature-rich note-taking application that combines the aesthetic polish of macOS design with the power of a local-first, privacy-conscious architecture. Notes are stored in a local SQLite database with full-text search, version history, and automatic backups. The application supports both rich text (WYSIWYG) and raw Markdown editing, with additional features including wikilinks, graph visualization, templates, tags, and a plugin system for callouts and diagrams.

The application operates in two modes:

- **Desktop application** via Tauri 2 (Rust backend with native performance)
- **Web application** via Vite dev server (for development or browser usage)

---

## Features

### Editor

- **Rich Text Editing**: TipTap-based WYSIWYG editor with slash commands, bubble menu, text highlighting, task lists, and code blocks with syntax highlighting (lowlight)
- **Markdown Mode**: Toggle between rich text and raw Markdown editing at any time
- **Wikilinks**: `[[Note Title]]` syntax with autocomplete and automatic backlink tracking
- **Mermaid Diagrams**: Render Mermaid diagrams inline within notes via slash commands
- **Callout Blocks**: Custom callout/alert blocks for emphasized content
- **Image Support**: Paste or upload images with automatic disk storage and data URL fallback
- **Spell Check**: Hunspell-based spell checking with bundled English dictionary

### Organization

- **Folders**: System views (All Notes, Favorites, Archive, Trash) plus custom user-defined folders with color labels
- **Tags**: Lightweight tagging system for cross-cutting organization
- **Pins and Favorites**: Pin important notes and mark favorites for quick access
- **Archive and Trash**: Soft delete with configurable auto-purge (runs hourly)
- **Multiple Vaults**: Isolated workspaces for different contexts or projects

### Search and Navigation

- **Full-Text Search**: SQLite FTS5 with prefix matching, stemming (porter tokenizer), and snippet highlighting
- **Fuzzy Search**: Fuse.js client-side fuzzy search as a fallback and enhancement
- **Global Search**: `Ctrl+Shift+F` to search across all notes from anywhere
- **Command Palette**: `Ctrl+K` for quick actions and navigation
- **Backlink Panel**: View all notes that link to the current note
- **Graph View**: Interactive visualization of note connections and relationships

### Version History

- Automatic snapshots on every save (up to 50 versions per note)
- Side-by-side restoration from any previous version
- Timestamped version entries with content preview

### Templates

- Built-in daily note template and meeting note template
- Custom template creation with predefined title, content, and tags
- Template gallery for quick insertion

### AI Integration

- AI-powered chat panel for assistance while writing
- OpenRouter API integration with configurable models
- AI-generated content with preview before saving
- Typing indicator for responsive AI interaction

### User Interface

- **macOS Premium UI**: Frameless window, traffic light controls (close, minimize, maximize), glassmorphic sidebars
- **Split View**: Resizable panels for multi-tasking
- **Zen Mode**: Distraction-free writing with minimal UI
- **Note Tabs**: Open multiple notes in tabbed interface
- **Quick Capture**: Global shortcut `Ctrl+Shift+Space` opens a minimal capture window from anywhere
- **System Tray**: Minimize to tray with quick access menu (Show, Quick Capture, Quit)
- **Mobile Companion**: Read-only mobile view at `index.html#mobile`
- **Onboarding**: First-run setup experience
- **Dark Mode**: Full dark theme support with OKLCH color space

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.6 | UI framework |
| TypeScript | 6.0.2 | Language |
| Vite | 8.0.12 | Build tool |
| Tailwind CSS | 4.3.1 | Utility CSS framework |
| shadcn/ui | 0.1.0 | Accessible component library (Radix-based) |
| TipTap | 3.27.1 | Rich text WYSIWYG editor |
| Zustand | 5.0.14 | State management |
| Jotai | 2.20.1 | Atomic state (supplemental) |
| Fuse.js | 7.4.2 | Client-side fuzzy search |
| Mermaid | 11.16.0 | Diagram rendering |
| Recharts | 3.8.0 | Charts and data visualization |
| date-fns | 4.4.0 | Date utilities |
| Motion | 12.42.0 | Animations |
| Sonner | 2.0.7 | Toast notifications |
| cmdk | 1.1.1 | Command palette |
| Lucide React | 1.21.0 | Icons |
| nspell | 2.1.5 | Hunspell-based spell checking |
| class-variance-authority | 0.7.1 | Component variant management |
| tailwind-merge | 3.6.0 | Tailwind class merging |

### Backend (Tauri / Rust)

| Technology | Version | Purpose |
|---|---|---|
| Tauri | 2.11.3 | Desktop application framework |
| Rust | 2021 edition | Backend language |
| rusqlite (bundled) | 0.31 | SQLite database driver |
| serde / serde_json | 1.0 | Serialization |
| chrono | 0.4 | Date and time handling |
| tauri-plugin-global-shortcut | 2 | Global keyboard shortcut registration |
| tauri-plugin-log | 2 | Logging (debug builds) |

### Development Tools

| Technology | Version | Purpose |
|---|---|---|
| ESLint | 10.3.0 | Code linting |
| Vitest | 3.2.4 | Unit testing |
| @tauri-apps/cli | 2.11.3 | Tauri CLI |

---

## Architecture

NotesZen follows a hybrid architecture with a Rust backend (Tauri) managing data persistence and system integration, and a React/TypeScript frontend handling the user interface and editing experience.

### Data Flow

```
User Input
    |
    v
React Frontend (TipTap Editor / UI)
    |
    v
Zustand Store (State Management)
    |
    v
Tauri Bridge (tauri-bridge.ts)
    |
    v
Rust Backend (Tauri Commands)
    |
    v
SQLite Database (rusqlite)
```

### Dual-Mode Operation

The application detects whether it is running inside Tauri via `__TAURI_INTERNALS__`. When running in Tauri, all data operations go through Tauri IPC commands to the Rust backend. When running as a standalone web application (development mode), the application falls back to `localStorage` for persistence via a client-side implementation of the same API.

### Backend Architecture (Rust)

The Rust backend (`src-tauri/src/lib.rs`) registers Tauri commands that the frontend invokes for all data operations. The database layer (`src-tauri/src/db.rs`) handles SQLite schema initialization, migrations, CRUD operations, full-text search, and data synchronization.

#### Lifecycle

1. **Startup**: Initialize SQLite database, run migrations, seed default data (vault, templates), register global shortcut (`Ctrl+Shift+Space`), setup system tray, spawn trash auto-purge thread (hourly)
2. **Runtime**: Handle Tauri commands from frontend, manage window state (main window minimize/maximize/close-to-tray, quick-capture toggle)
3. **Shutdown**: Clean shutdown via system tray quit

---

## Prerequisites

- **Node.js** 22.x or later
- **npm** 10.x or later
- **Rust** 1.77.2 or later (for Tauri desktop builds)
- **Linux Dependencies** (for Tauri desktop builds on Linux):
  - `libwebkit2gtk-4.1-dev`
  - `libappindicator3-dev`
  - `librsvg2-dev`
  - `patchelf`

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/noteszen.git
cd noteszen
npm install
```

---

## Development

### Web Development Server

Run the frontend in a browser (hot-reload enabled):

```bash
npm run dev
```

Opens at `http://localhost:5173`. Data is persisted in `localStorage` when running outside Tauri.

### Desktop Application

Run the full desktop application with hot-reload:

```bash
npm run tauri dev
```

Requires Rust and Linux dependencies to be installed (see Prerequisites).

### Testing

Run unit tests (Vitest):

```bash
npm test
```

### Linting

Run ESLint across the codebase:

```bash
npm run lint
```

### Production Build

Build the frontend for production:

```bash
npm run build
```

Output is written to `dist/`.

Package the desktop application binaries:

```bash
npm run tauri build
```

Produces `.deb`, `.rpm`, and `.AppImage` packages in `src-tauri/target/release/bundle/`.

---

## Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| New Note | `Ctrl+N` |
| Daily Note | `Ctrl+D` |
| Command Palette | `Ctrl+K` |
| Search in Note List | `Ctrl+F` |
| Global Search | `Ctrl+Shift+F` |
| Pin Note | `Ctrl+P` |
| Toggle Sidebar | `Ctrl+B` |
| Toggle Note List | `Ctrl+Shift+B` |
| Navigate Notes | `Alt+Up` / `Alt+Down` |
| Quick Capture | `Ctrl+Shift+Space` |
| Star Note (palette) | `Ctrl+Shift+S` |
| Archive (palette) | `Ctrl+Shift+A` |

---

## Storage

### Database Schema

All note data is stored in a local SQLite database at the application data directory. The schema includes the following tables:

| Table | Description |
|---|---|
| `notes` | Core notes with title, content, folder, metadata (icon, cover, status), editor mode, and vault association |
| `tags` | Many-to-many tag associations per note |
| `backlinks` | Wiki-style link relationships (`sourceId` -> `targetId`) |
| `folders` | Custom user-defined folders with name, color, and sort order |
| `templates` | Note templates with title, content, and tags |
| `note_versions` | Version history snapshots (up to 50 per note) |
| `vaults` | Multiple workspace definitions |
| `settings` | Key-value application settings |
| `notes_fts` | FTS5 virtual table for full-text search (porter tokenizer) |

The database is initialized with automatic migrations that safely add columns to existing tables. On first run, it seeds a default vault, a daily template, and a meeting template.

### Image Storage

Images are saved to the filesystem under `{appDataDir}/images/{noteId}/` with timestamp-based filenames. Supported formats include PNG, WebP, GIF, and JPG.

---

## Sync

NotesZen supports vault synchronization via JSON export and import:

1. Navigate to **Settings > Sync Export**
2. Save the exported JSON file to a sync folder (Syncthing, Dropbox, Nextcloud, etc.)
3. On another machine, use **Import JSON** to load the vault

This provides a manual, privacy-preserving sync mechanism without requiring a proprietary cloud service.

---

## Configuration

### Tauri Configuration

The Tauri application is configured in `src-tauri/tauri.conf.json`:

- **Main window**: 1200x800, minimum 900x650, frameless, resizable
- **Quick capture window**: 500x200, frameless, non-resizable, always-on-top, hidden by default
- **Bundle targets**: All platforms with icons for all sizes
- **Security**: Asset protocol enabled with scope restricted to `$APPDATA/**/*`

### AI Integration

The AI features (chat panel, content generation) use the OpenRouter API. Configure your API key in a `.env.local` file:

```
VITE_OPENROUTER_API_KEY=your_api_key_here
```

AI settings (model selection, preferences) are configurable from within the application.

### Spell Check

Hunspell dictionaries are bundled in `public/dictionaries/en/` and loaded by `nspell` for client-side spell checking. Additional language dictionaries can be added to the same directory.

---

## Project Structure

```
noteszen/
├── public/                         # Static assets
│   ├── dictionaries/en/            # Hunspell spell check dictionaries
│   ├── favicon.ico
│   ├── favicon.png
│   └── appicon.png
├── src/                            # Frontend source (React/TypeScript)
│   ├── App.tsx                     # Root component with routing
│   ├── main.tsx                    # React entry point
│   ├── index.css                   # Tailwind imports and custom styles
│   ├── types.ts                    # TypeScript interfaces
│   ├── tauri-bridge.ts             # Tauri IPC bridge
│   ├── assets/                     # Static images
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui primitives (60+ components)
│   │   ├── Editor.tsx              # TipTap rich text editor
│   │   ├── EditorShell.tsx         # Editor layout wrapper
│   │   ├── WorkspaceSidebar.tsx    # Main sidebar with folders
│   │   ├── CommandPalette.tsx      # Ctrl+K command palette
│   │   ├── GlobalSearch.tsx        # Full-text search dialog
│   │   ├── GraphView.tsx           # Note connections visualization
│   │   ├── HomeDashboard.tsx       # Main dashboard
│   │   ├── SettingsPanel.tsx       # Application settings
│   │   ├── QuickCapture.tsx        # Quick capture popup
│   │   ├── VersionHistorySheet.tsx # Note version history
│   │   ├── AIChatPanel.tsx         # AI assistant panel
│   │   ├── TemplateGallery.tsx     # Template picker
│   │   ├── MobileView.tsx          # Mobile companion view
│   │   └── ...                     # Additional components
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-copy-to-clipboard.ts
│   │   ├── use-mobile.ts
│   │   └── useLiveClock.ts
│   ├── lib/                        # Utilities and business logic
│   │   ├── search.ts               # Fuse.js search integration
│   │   ├── tiptap-extensions.ts    # Custom TipTap extensions
│   │   ├── ai-output.ts            # AI content processing
│   │   ├── ai-settings.ts          # AI configuration
│   │   ├── openrouter.ts           # OpenRouter API client
│   │   ├── plugins.ts              # Plugin system
│   │   ├── spellcheck.ts           # Spell check integration
│   │   ├── note-versions.ts        # Client-side version history
│   │   ├── image-utils.ts          # Image handling utilities
│   │   └── utils.ts                # General utilities
│   ├── store/                      # Zustand state management
│   │   └── useNotesStore.ts        # Global application store
│   └── types/                      # Additional type declarations
├── src-tauri/                      # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs                 # Rust entry point
│   │   ├── lib.rs                  # Tauri commands and app setup
│   │   └── db.rs                   # SQLite database layer
│   ├── tauri.conf.json             # Tauri configuration
│   ├── Cargo.toml                  # Rust dependencies
│   ├── capabilities/default.json   # Tauri capability permissions
│   └── icons/                      # Application icons
├── .github/workflows/ci.yml        # CI pipeline
├── components.json                 # shadcn/ui configuration
├── eslint.config.js                # ESLint configuration
├── vite.config.ts                  # Vite build configuration
├── vitest.config.ts                # Vitest test configuration
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.app.json               # TypeScript app configuration
└── tsconfig.node.json              # TypeScript node configuration
```

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Create a Pull Request

### Development Workflow

- Run `npm run lint` to check code style
- Run `npm test` to verify existing tests pass
- Add tests for new functionality
- Ensure the CI pipeline passes (see `.github/workflows/ci.yml`)

---

## License

This project is licensed under the terms specified in the LICENSE file. (License file not yet included.)
