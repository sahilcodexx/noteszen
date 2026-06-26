# NotesZen

NotesZen is a premium, macOS-inspired Markdown note-taking desktop application built with **Tauri 2**, React 19, TypeScript, SQLite, and Tailwind CSS v4.

Designed for a gorgeous, seamless writing experience on Arch Linux and other Linux desktop environments.

## Features

- **macOS Premium UI**: Frameless window, traffic lights, glassmorphic sidebars
- **Rich Editor**: TipTap WYSIWYG with slash commands, bubble menu, code blocks, tasks
- **Markdown Mode**: Toggle between rich text and raw Markdown editing
- **Folders & Organization**: System views plus custom folders (Work, Personal, Ideas, etc.)
- **Tags, Pins, Favorites, Archive, Trash** with auto-purge settings
- **Wikilinks**: `[[Note Title]]` syntax with autocomplete and backlink panel
- **Graph View**: Visualize note connections
- **Full-Text Search**: SQLite FTS5 + Fuse.js fuzzy search
- **Version History**: Automatic snapshots on save with restore
- **Templates**: Built-in daily and meeting templates; create your own
- **Split View & Zen Mode**: Focused writing workflows
- **Quick Capture**: Global shortcut `Ctrl+Shift+Space`
- **Multiple Vaults**: Separate workspaces
- **Import/Export**: JSON backup and vault sync export
- **System Tray**: Minimize to tray, quick access menu
- **Mobile Companion**: Open `index.html#mobile` for read-only mobile view
- **Plugin Blocks**: Callouts, Mermaid, tables via slash commands

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New Note | `Ctrl+N` |
| Daily Note | `Ctrl+D` |
| Command Palette | `Ctrl+K` |
| Search in List | `Ctrl+F` |
| Global Search | `Ctrl+Shift+F` |
| Pin Note | `Ctrl+P` |
| Toggle Sidebar | `Ctrl+B` |
| Toggle Note List | `Ctrl+Shift+B` |
| Navigate Notes | `Alt+↑/↓` |
| Quick Capture | `Ctrl+Shift+Space` |
| Star Note (palette) | `Ctrl+Shift+S` |
| Archive (palette) | `Ctrl+Shift+A` |

## Development

```bash
npm install
npm run dev          # Web dev server
npm run tauri dev    # Desktop app
npm test             # Run unit tests
npm run build        # Production frontend build
npm run tauri build  # Package desktop binaries (.deb, .rpm, AppImage)
```

## Storage

Notes are stored in a local SQLite database at the app data directory. Images are saved to disk under `images/{noteId}/`. Metadata (covers, emojis, status) is stored in SQLite alongside notes.

## Sync

Export a vault from Settings → Sync Export, then copy the JSON to a sync folder (Syncthing, Dropbox, etc.). Import on another machine via Import JSON.