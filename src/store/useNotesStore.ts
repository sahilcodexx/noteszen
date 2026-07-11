import { create } from 'zustand'
import type { AppSettings, Folder, Note, NoteVersion, Template, Vault } from '../types'
import { getAPI } from '../tauri-bridge'
import {
  getLocalNoteVersions,
  restoreLocalNoteVersion,
  saveLocalNoteVersion,
} from '../lib/note-versions'
import { stripAiDraftBannerFromHtml } from '../lib/ai-output'
import {
  addTodoToStore,
  clearCompletedTodosFromStore,
  deleteTodoFromStore,
  extractAllOpenTodos,
  getTodosForNote,
  loadNoteTodosStorage,
  removeTodosForNote,
  saveNoteTodosStorage,
  toggleTodoInStore,
  type NoteTodoWithMeta,
  type SidebarTodo,
} from '../lib/todos'

interface NotesState {
  notes: Note[]
  folders: Folder[]
  templates: Template[]
  vaults: Vault[]
  activeVaultId: string
  selectedNoteId: string | null
  searchQuery: string
  activeFolder: string
  selectedTag: string | null
  isSidebarCollapsed: boolean
  isNoteListCollapsed: boolean
  isCommandPaletteOpen: boolean
  isGlobalSearchOpen: boolean
  isGraphViewOpen: boolean
  saveStatus: 'saved' | 'saving' | 'error'
  isZenMode: boolean
  isSplitView: boolean
  splitViewNoteId: string | null
  recentNoteIds: string[]
  appSettings: AppSettings

  editorFont: 'sans' | 'serif' | 'mono'
  editorFontSize: number
  colorTheme: string
  noteSort: 'updated' | 'created' | 'title'
  openNoteTabs: string[]
  noteListWidth: number
  mainView: 'home' | 'editor'
  isAIPanelOpen: boolean
  aiPanelWidth: number
  isAIPanelExpanded: boolean
  homeViewMode: 'grid' | 'list'
  isDarkMode: boolean
  noteTodosByNoteId: Record<string, SidebarTodo[]>

  fetchNotes: () => Promise<void>
  ensureNoteContent: (noteId: string) => Promise<void>
  fetchFolders: () => Promise<void>
  fetchTemplates: () => Promise<void>
  fetchVaults: () => Promise<void>
  fetchSettings: () => Promise<void>
  initApp: () => Promise<void>
  setSelectedNoteId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setActiveFolder: (folder: string) => void
  setSelectedTag: (tag: string | null) => void
  toggleSidebar: () => void
  toggleNoteList: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setGlobalSearchOpen: (open: boolean) => void
  setGraphViewOpen: (open: boolean) => void
  setSaveStatus: (status: 'saved' | 'saving' | 'error') => void
  setZenMode: (zen: boolean) => void
  toggleSplitView: () => void
  setSplitViewNoteId: (id: string | null) => void
  setEditorFont: (font: 'sans' | 'serif' | 'mono') => void
  setEditorFontSize: (size: number) => void
  setColorTheme: (theme: string) => void
  setNoteSort: (sort: 'updated' | 'created' | 'title') => void
  addOpenTab: (noteId: string) => void
  removeOpenTab: (noteId: string) => void
  setNoteListWidth: (width: number) => void
  setMainView: (view: 'home' | 'editor') => void
  goHome: () => void
  openNote: (noteId: string) => void
  toggleAIPanel: () => void
  setAIPanelWidth: (width: number) => void
  toggleAIPanelExpanded: () => void
  setHomeViewMode: (mode: 'grid' | 'list') => void
  setDarkMode: (dark: boolean) => void
  toggleDarkMode: () => void
  setAppSettings: (settings: Partial<AppSettings>) => void
  setActiveVault: (vaultId: string) => Promise<void>
  createVault: (name: string) => Promise<void>

  createNote: (initialFields?: Partial<Note>) => void
  createNoteFromTemplate: (templateId: string) => void
  createDailyNote: () => void
  updateNote: (id: string, fields: Partial<Note>) => void
  /** Stage editor HTML without re-rendering the full notes list every keystroke. */
  stageNoteContent: (id: string, content: string) => void
  /** Flush staged content into the store + disk. Omit id to flush all drafts. */
  flushNoteContent: (id?: string) => void
  unloadInactiveNoteContent: () => void
  deleteNote: (id: string) => void
  restoreNote: (id: string) => void
  emptyTrash: () => void
  togglePin: (id: string) => void
  toggleFavorite: (id: string) => void
  toggleArchive: (id: string) => void
  importNotes: (notes: Note[], merge: boolean) => Promise<number>
  exportSyncData: () => Promise<string>
  importSyncData: (data: string, merge: boolean) => Promise<number>
  createFolder: (name: string, color?: string) => void
  deleteFolder: (id: string) => void
  saveTemplate: (template: Template) => void
  deleteTemplate: (id: string) => void
  getNoteVersions: (noteId: string) => Promise<NoteVersion[]>
  restoreVersion: (versionId: string) => Promise<Note | null | void>
  trackRecent: (noteId: string) => void
  getNoteTodos: (noteId: string) => SidebarTodo[]
  addNoteTodo: (noteId: string, text: string) => void
  toggleNoteTodo: (noteId: string, todoId: string) => void
  deleteNoteTodo: (noteId: string, todoId: string) => void
  clearCompletedNoteTodos: (noteId: string) => void
  getAllOpenNoteTodos: (excludeNoteId?: string) => NoteTodoWithMeta[]
}

const MAX_LOADED_NOTE_BODIES = 8
const CONTENT_SAVE_DEBOUNCE_MS = 800
const NOTES_CHANGED_DEBOUNCE_MS = 1200
const LOCAL_SAVE_SUPPRESS_MS = 1800

let saveTimeout: ReturnType<typeof setTimeout> | null = null
let contentSaveTimeout: ReturnType<typeof setTimeout> | null = null
let notesChangedTimeout: ReturnType<typeof setTimeout> | null = null
let lastLocalSaveAt = 0
const contentDrafts = new Map<string, string>()

function getContentDraft(noteId: string): string | undefined {
  return contentDrafts.get(noteId)
}

function buildTitleIndex(notes: Note[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const note of notes) {
    if (note.folder === 'trash') continue
    const key = note.title.trim().toLowerCase()
    if (key) map.set(key, note.id)
  }
  return map
}

function extractBacklinks(content: string, titleIndex: Map<string, string>): string[] {
  const linkRegex = /\[\[(.*?)\]\]/g
  const targetIds: string[] = []
  let match: RegExpExecArray | null
  while ((match = linkRegex.exec(content)) !== null) {
    const title = match[1]?.trim().toLowerCase()
    if (!title) continue
    const targetId = titleIndex.get(title)
    if (targetId) targetIds.push(targetId)
  }
  return Array.from(new Set(targetIds))
}

function toPreviewContent(content: string, max = 320): string {
  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function sanitizeLoadedNotes(notes: Note[]): Note[] {
  return notes.map((note) => {
    const content = stripAiDraftBannerFromHtml(note.content)
    return content !== note.content ? { ...note, content } : note
  })
}

function mergePreviewNotes(incoming: Note[], existing: Note[]): Note[] {
  const existingById = new Map(existing.map((note) => [note.id, note]))
  const keep = keepIdsForContent()
  return incoming.map((note) => {
    const previous = existingById.get(note.id)
    const draft = getContentDraft(note.id)

    if (draft !== undefined) {
      return { ...note, content: draft, contentLoaded: true }
    }

    if (previous?.contentLoaded && keep.has(note.id)) {
      return { ...note, content: previous.content, contentLoaded: true }
    }

    if (previous?.contentLoaded && previous.updatedAt === note.updatedAt) {
      return { ...note, content: previous.content, contentLoaded: true }
    }

    return { ...note, contentLoaded: false }
  })
}

function keepIdsForContent(): Set<string> {
  const { selectedNoteId, openNoteTabs, splitViewNoteId } = useNotesStore.getState()
  const keep = new Set<string>(openNoteTabs)
  if (selectedNoteId) keep.add(selectedNoteId)
  if (splitViewNoteId) keep.add(splitViewNoteId)
  return keep
}

function unloadNotesOutsideKeep(notes: Note[], keep: Set<string>): Note[] {
  let loaded = 0
  for (const note of notes) {
    if (note.contentLoaded) loaded++
  }
  if (loaded <= MAX_LOADED_NOTE_BODIES) {
    return notes.map((note) => {
      if (keep.has(note.id) || !note.contentLoaded) return note
      return note
    })
  }

  return notes.map((note) => {
    if (keep.has(note.id) || !note.contentLoaded) return note
    return {
      ...note,
      content: toPreviewContent(note.content),
      contentLoaded: false,
    }
  })
}

function persistNote(note: Note, previousNote?: Note) {
  if (note.contentLoaded === false) {
    console.warn('Skipped saving unloaded note preview:', note.id)
    return
  }

  lastLocalSaveAt = Date.now()
  const api = getAPI()
  if (api) {
    api.saveNote(note, true).catch((err) => console.error('Failed to save note:', err))
  } else {
    if (
      previousNote &&
      (previousNote.title !== note.title || previousNote.content !== note.content)
    ) {
      saveLocalNoteVersion(previousNote)
    }
    const notes = useNotesStore.getState().notes
    localStorage.setItem('noteszen-db-notes', JSON.stringify(notes))
  }
}

function persistAllNotes(notes: Note[]) {
  const api = getAPI()
  if (api) {
    notes.forEach((n) => api.saveNote(n, false).catch(console.error))
  } else {
    localStorage.setItem('noteszen-db-notes', JSON.stringify(notes))
  }
}

const initialEditorFont = (localStorage.getItem('noteszen-pref-font') || 'sans') as 'sans' | 'serif' | 'mono'
const initialEditorFontSize = (() => {
  const stored = localStorage.getItem('noteszen-pref-size')
  if (!stored) return 16
  const parsed = parseInt(stored, 10)
  return isNaN(parsed) ? 16 : parsed
})()
const initialColorTheme = localStorage.getItem('noteszen-color-theme') || 'default'
const initialNoteSort = (localStorage.getItem('noteszen-note-sort') || 'updated') as 'updated' | 'created' | 'title'
const initialNoteListWidth = (() => {
  const stored = localStorage.getItem('noteszen-note-list-width')
  if (!stored) return 270
  const parsed = parseInt(stored, 10)
  return isNaN(parsed) ? 270 : Math.min(500, Math.max(200, parsed))
})()
const initialHomeViewMode = (localStorage.getItem('noteszen-home-view') || 'grid') as 'grid' | 'list'
const initialAIPanelOpen = localStorage.getItem('noteszen-ai-panel') !== 'false'
const initialAIPanelWidth = (() => {
  const stored = localStorage.getItem('noteszen-ai-panel-width')
  if (!stored) return 320
  const parsed = parseInt(stored, 10)
  return isNaN(parsed) ? 320 : Math.min(640, Math.max(280, parsed))
})()
const AI_PANEL_EXPANDED_WIDTH = 520
const AI_PANEL_DEFAULT_WIDTH = 320
const initialDarkMode = (() => {
  const stored = localStorage.getItem('noteszen-dark-mode')
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})()

function applyDarkModeClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}
applyDarkModeClass(initialDarkMode)

const initialRecent = (() => {
  try {
    return JSON.parse(localStorage.getItem('noteszen-recent') || '[]') as string[]
  } catch {
    return []
  }
})()

const defaultSettings: AppSettings = {
  trashAutoPurgeDays: 30,
  spellCheckLanguage: 'en',
  syncFolderPath: '',
  enableCustomSpellcheck: false,
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  folders: [],
  templates: [],
  vaults: [],
  activeVaultId: 'default',
  selectedNoteId: null,
  searchQuery: '',
  activeFolder: 'notes',
  selectedTag: null,
  isSidebarCollapsed: localStorage.getItem('noteszen-sidebar-collapsed') === 'true',
  isNoteListCollapsed: true,
  isCommandPaletteOpen: false,
  isGlobalSearchOpen: false,
  isGraphViewOpen: false,
  saveStatus: 'saved',
  isZenMode: false,
  isSplitView: false,
  splitViewNoteId: null,
  recentNoteIds: initialRecent,
  appSettings: defaultSettings,
  editorFont: initialEditorFont,
  editorFontSize: initialEditorFontSize,
  colorTheme: initialColorTheme,
  noteSort: initialNoteSort,
  openNoteTabs: [],
  noteListWidth: initialNoteListWidth,
  mainView: 'home',
  isAIPanelOpen: initialAIPanelOpen,
  aiPanelWidth: initialAIPanelWidth,
  isAIPanelExpanded: initialAIPanelWidth >= AI_PANEL_EXPANDED_WIDTH,
  homeViewMode: initialHomeViewMode,
  isDarkMode: initialDarkMode,
  noteTodosByNoteId: loadNoteTodosStorage(),

  getNoteTodos: (noteId) => getTodosForNote(get().noteTodosByNoteId, noteId),

  addNoteTodo: (noteId, text) => {
    const next = addTodoToStore(get().noteTodosByNoteId, noteId, text)
    saveNoteTodosStorage(next)
    set({ noteTodosByNoteId: next })
  },

  toggleNoteTodo: (noteId, todoId) => {
    const next = toggleTodoInStore(get().noteTodosByNoteId, noteId, todoId)
    saveNoteTodosStorage(next)
    set({ noteTodosByNoteId: next })
  },

  deleteNoteTodo: (noteId, todoId) => {
    const next = deleteTodoFromStore(get().noteTodosByNoteId, noteId, todoId)
    saveNoteTodosStorage(next)
    set({ noteTodosByNoteId: next })
  },

  clearCompletedNoteTodos: (noteId) => {
    const next = clearCompletedTodosFromStore(get().noteTodosByNoteId, noteId)
    saveNoteTodosStorage(next)
    set({ noteTodosByNoteId: next })
  },

  getAllOpenNoteTodos: (excludeNoteId) =>
    extractAllOpenTodos(get().notes, get().noteTodosByNoteId, excludeNoteId),

  setMainView: (view) => set({ mainView: view }),

  goHome: () => {
    window.dispatchEvent(new CustomEvent('noteszen:flush-editor'))
    get().flushNoteContent()
    set({ mainView: 'home' })
    get().unloadInactiveNoteContent()
  },

  setDarkMode: (dark) => {
    localStorage.setItem('noteszen-dark-mode', String(dark))
    applyDarkModeClass(dark)
    set({ isDarkMode: dark })
  },

  toggleDarkMode: () => {
    const next = !get().isDarkMode
    get().setDarkMode(next)
  },

  openNote: (noteId) => {
    window.dispatchEvent(new CustomEvent('noteszen:flush-editor'))
    get().flushNoteContent()
    get().trackRecent(noteId)
    get().addOpenTab(noteId)
    set({ selectedNoteId: noteId, mainView: 'editor' })
    void get().ensureNoteContent(noteId)
    get().unloadInactiveNoteContent()
  },

  toggleAIPanel: () => {
    const next = !get().isAIPanelOpen
    localStorage.setItem('noteszen-ai-panel', String(next))
    set({ isAIPanelOpen: next })
  },

  setAIPanelWidth: (width) => {
    const clamped = Math.min(640, Math.max(280, width))
    localStorage.setItem('noteszen-ai-panel-width', String(clamped))
    set({
      aiPanelWidth: clamped,
      isAIPanelExpanded: clamped >= AI_PANEL_EXPANDED_WIDTH,
    })
  },

  toggleAIPanelExpanded: () => {
    const expanded = !get().isAIPanelExpanded
    const width = expanded ? AI_PANEL_EXPANDED_WIDTH : AI_PANEL_DEFAULT_WIDTH
    localStorage.setItem('noteszen-ai-panel-width', String(width))
    set({ aiPanelWidth: width, isAIPanelExpanded: expanded })
  },

  setHomeViewMode: (mode) => {
    localStorage.setItem('noteszen-home-view', mode)
    set({ homeViewMode: mode })
  },

  setNoteSort: (sort) => {
    localStorage.setItem('noteszen-note-sort', sort)
    set({ noteSort: sort })
  },

  addOpenTab: (noteId) => {
    const tabs = get().openNoteTabs.filter((id) => id !== noteId)
    tabs.unshift(noteId)
    set({ openNoteTabs: tabs.slice(0, 8) })
  },

  removeOpenTab: (noteId) => {
    contentDrafts.delete(noteId)
    const tabs = get().openNoteTabs.filter((id) => id !== noteId)
    const { selectedNoteId } = get()
    if (selectedNoteId === noteId) {
      if (tabs.length > 0) {
        set({ openNoteTabs: tabs, selectedNoteId: tabs[0], mainView: 'editor' })
      } else {
        set({ openNoteTabs: tabs, selectedNoteId: null, mainView: 'home' })
      }
    } else {
      set({ openNoteTabs: tabs })
    }
    get().unloadInactiveNoteContent()
  },

  setNoteListWidth: (width) => {
    const clamped = Math.min(500, Math.max(200, width))
    localStorage.setItem('noteszen-note-list-width', String(clamped))
    set({ noteListWidth: clamped })
  },

  initApp: async () => {
    await get().fetchVaults()
    const activeVaultId = get().activeVaultId
    await Promise.all([
      get().fetchSettings(),
      get().fetchNotes(),
      get().fetchFolders(),
    ])
    if (activeVaultId === get().activeVaultId) {
      void get().fetchTemplates()
    }

    const api = getAPI()
    if (api?.onNotesChanged) {
      api.onNotesChanged(() => {
        // Ignore our own autosave echoes and coalesce external updates.
        if (Date.now() - lastLocalSaveAt < LOCAL_SAVE_SUPPRESS_MS) return
        if (notesChangedTimeout) clearTimeout(notesChangedTimeout)
        notesChangedTimeout = setTimeout(() => {
          if (Date.now() - lastLocalSaveAt < LOCAL_SAVE_SUPPRESS_MS) return
          void get().fetchNotes()
        }, NOTES_CHANGED_DEBOUNCE_MS)
      })
    }
  },

  fetchNotes: async () => {
    const api = getAPI()
    const vaultId = get().activeVaultId
    if (api) {
      const raw = await api.getNotePreviews(vaultId)
      const fetched = sanitizeLoadedNotes(raw)
      const notes = mergePreviewNotes(fetched, get().notes)
      set({ notes })
      if (notes.length > 0 && !get().selectedNoteId) {
        const first = notes.find((n) => n.folder !== 'trash' && !n.isArchived)
        if (first) set({ selectedNoteId: first.id })
      }
    } else {
      const local = localStorage.getItem('noteszen-db-notes')
      if (local) {
        try {
          const raw = JSON.parse(local) as Note[]
          const parsed = sanitizeLoadedNotes(raw)
          parsed.forEach((note, i) => {
            if (note.content !== raw[i]?.content) persistNote(note)
          })
          set({ notes: parsed.map((n) => ({ ...n, contentLoaded: true })) })
          if (parsed.length > 0 && !get().selectedNoteId) {
            const first = parsed.find((n) => n.folder !== 'trash' && !n.isArchived)
            if (first) set({ selectedNoteId: first.id })
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  },

  ensureNoteContent: async (noteId) => {
    const existing = get().notes.find((note) => note.id === noteId)
    if (!existing) return

    const draft = getContentDraft(noteId)
    if (draft !== undefined) {
      set({
        notes: get().notes.map((note) =>
          note.id === noteId ? { ...note, content: draft, contentLoaded: true } : note
        ),
      })
      return
    }

    if (existing.contentLoaded) return

    const api = getAPI()
    if (!api?.getNote) {
      set({
        notes: get().notes.map((note) =>
          note.id === noteId ? { ...note, contentLoaded: true } : note
        ),
      })
      return
    }

    const fullNote = await api.getNote(noteId)
    if (!fullNote) return
    // Drop a stale load if the user navigated away while fetching.
    if (get().selectedNoteId !== noteId && !get().openNoteTabs.includes(noteId)) return
    const latestDraft = getContentDraft(noteId)
    if (latestDraft !== undefined) {
      set({
        notes: get().notes.map((note) =>
          note.id === noteId ? { ...note, content: latestDraft, contentLoaded: true } : note
        ),
      })
      return
    }
    const sanitized = sanitizeLoadedNotes([{ ...fullNote, contentLoaded: true }])[0]
    set({
      notes: unloadNotesOutsideKeep(
        get().notes.map((note) =>
          note.id === noteId ? { ...sanitized, contentLoaded: true } : note
        ),
        keepIdsForContent()
      ),
    })
  },

  unloadInactiveNoteContent: () => {
    const keep = keepIdsForContent()
    const next = unloadNotesOutsideKeep(get().notes, keep)
    if (next !== get().notes && next.some((n, i) => n !== get().notes[i])) {
      set({ notes: next })
    }
  },

  fetchFolders: async () => {
    const api = getAPI()
    if (api) {
      const folders = await api.getFolders(get().activeVaultId)
      set({ folders })
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('noteszen-folders') || '[]') as Folder[]
        set({ folders: stored })
      } catch {
        set({ folders: [] })
      }
    }
  },

  fetchTemplates: async () => {
    const api = getAPI()
    if (api) {
      const templates = await api.getTemplates()
      set({ templates })
    }
  },

  fetchVaults: async () => {
    const api = getAPI()
    if (api) {
      const vaults = await api.getVaults()
      const active = vaults.find((v) => v.isActive)?.id || 'default'
      set({ vaults, activeVaultId: active })
    }
  },

  fetchSettings: async () => {
    const api = getAPI()
    if (api) {
      const trashDays = await api.getSetting('trashAutoPurgeDays')
      const spellLang = await api.getSetting('spellCheckLanguage')
      const syncPath = await api.getSetting('syncFolderPath')
      const enableCustom = await api.getSetting('enableCustomSpellcheck')
      set({
        appSettings: {
          trashAutoPurgeDays: trashDays ? parseInt(trashDays, 10) : 30,
          spellCheckLanguage: spellLang || 'en',
          syncFolderPath: syncPath || '',
          enableCustomSpellcheck: enableCustom === 'true',
        },
      })
    }
  },

  setSelectedNoteId: (id) => {
    window.dispatchEvent(new CustomEvent('noteszen:flush-editor'))
    get().flushNoteContent()
    set({
      selectedNoteId: id,
      mainView: id ? 'editor' : get().mainView,
    })
    if (id) {
      get().trackRecent(id)
      get().addOpenTab(id)
      void get().ensureNoteContent(id)
    }
    get().unloadInactiveNoteContent()
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFolder: (folder) => set({ activeFolder: folder, selectedTag: null }),
  setSelectedTag: (tag) => set({ selectedTag: tag, ...(tag ? { activeFolder: 'notes' } : {}) }),
  toggleSidebar: () => {
    const next = !get().isSidebarCollapsed
    localStorage.setItem('noteszen-sidebar-collapsed', String(next))
    set({ isSidebarCollapsed: next })
  },
  toggleNoteList: () => set((s) => ({ isNoteListCollapsed: !s.isNoteListCollapsed })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setGlobalSearchOpen: (open) => set({ isGlobalSearchOpen: open }),
  setGraphViewOpen: (open) => set({ isGraphViewOpen: open }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setZenMode: (zen) => set({ isZenMode: zen }),
  toggleSplitView: () =>
    set((s) => ({
      isSplitView: !s.isSplitView,
      splitViewNoteId: !s.isSplitView
        ? s.notes.find((n) => n.id !== s.selectedNoteId && n.folder !== 'trash')?.id || null
        : null,
    })),
  setSplitViewNoteId: (id) => set({ splitViewNoteId: id }),

  setEditorFont: (font) => {
    localStorage.setItem('noteszen-pref-font', font)
    set({ editorFont: font })
  },
  setEditorFontSize: (size) => {
    localStorage.setItem('noteszen-pref-size', String(size))
    set({ editorFontSize: size })
  },
  setColorTheme: (theme) => {
    localStorage.setItem('noteszen-color-theme', theme)
    set({ colorTheme: theme })
  },

  setAppSettings: (settings) => {
    const merged = { ...get().appSettings, ...settings }
    set({ appSettings: merged })
    const api = getAPI()
    if (api) {
      if (settings.trashAutoPurgeDays !== undefined) {
        api.saveSetting('trashAutoPurgeDays', String(settings.trashAutoPurgeDays))
      }
      if (settings.spellCheckLanguage !== undefined) {
        api.saveSetting('spellCheckLanguage', settings.spellCheckLanguage)
      }
      if (settings.syncFolderPath !== undefined) {
        api.saveSetting('syncFolderPath', settings.syncFolderPath)
      }
      if (settings.enableCustomSpellcheck !== undefined) {
        api.saveSetting('enableCustomSpellcheck', String(settings.enableCustomSpellcheck))
      }
    }
  },

  setActiveVault: async (vaultId) => {
    const api = getAPI()
    if (api) await api.setActiveVault(vaultId)
    set({ activeVaultId: vaultId, selectedNoteId: null })
    await get().fetchNotes()
    await get().fetchFolders()
  },

  createVault: async (name) => {
    const id = Math.random().toString(36).substring(2, 11)
    const vault = { id, name, path: '', isActive: false }
    const api = getAPI()
    if (api) await api.createVault(vault)
    await get().fetchVaults()
  },

  createNote: (initialFields = {}) => {
    const activeFolder = get().activeFolder
    const systemFolders = ['notes', 'favorites', 'daily', 'recent', 'archive', 'trash']
    let folder = initialFields.folder
    if (!folder) {
      if (!systemFolders.includes(activeFolder)) folder = activeFolder
      else folder = 'personal'
    }

    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 11),
      title: initialFields.title || 'Untitled Note',
      content: initialFields.content || '',
      folder,
      tags: initialFields.tags || [],
      backlinks: initialFields.backlinks || [],
      isPinned: initialFields.isPinned || false,
      isFavorite: initialFields.isFavorite || false,
      isArchived: initialFields.isArchived || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: initialFields.icon ?? null,
      cover: initialFields.cover ?? null,
      status: initialFields.status ?? null,
      editorMode: initialFields.editorMode || 'wysiwyg',
      vaultId: get().activeVaultId,
      contentLoaded: true,
    }

    const updatedNotes = [newNote, ...get().notes]
    const resetView = ['favorites', 'recent', 'archive', 'daily', 'trash'].includes(activeFolder)
    set({
      notes: updatedNotes,
      selectedNoteId: newNote.id,
      selectedTag: null,
      mainView: 'editor',
      ...(resetView ? { activeFolder: 'notes' } : {}),
    })
    get().addOpenTab(newNote.id)
    persistNote(newNote)
    get().trackRecent(newNote.id)
  },

  createNoteFromTemplate: (templateId) => {
    const template = get().templates.find((t) => t.id === templateId)
    if (!template) return
    get().createNote({
      title: template.title,
      content: template.content,
      tags: template.tags,
    })
  },

  createDailyNote: () => {
    const todayStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const dailyNote = get().notes.find(
      (n) => n.title === `Daily Note - ${todayStr}` && n.folder !== 'trash'
    )
    if (dailyNote) {
      get().openNote(dailyNote.id)
      set({ activeFolder: 'daily' })
      return
    } else {
      const template = get().templates.find((t) => t.id === 'daily-template')
      get().createNote({
        title: `Daily Note - ${todayStr}`,
        content: template?.content || `## Daily Log: ${todayStr}\n\n- [ ] Task 1\n- [ ] Task 2`,
        folder: 'daily',
        tags: ['daily'],
      })
      set({ activeFolder: 'daily' })
    }
  },

  updateNote: (id, fields) => {
    const previousNote = get().notes.find((n) => n.id === id)
    const nextFields = { ...fields }
    if (nextFields.content !== undefined) {
      nextFields.content = stripAiDraftBannerFromHtml(nextFields.content)
      contentDrafts.delete(id)
    }
    let updatedNote: Note | null = null
    const titleIndex =
      nextFields.content !== undefined ? buildTitleIndex(get().notes) : null
    const updatedNotes = get().notes.map((note) => {
      if (note.id === id) {
        const content = nextFields.content !== undefined ? nextFields.content : note.content
        const backlinks =
          nextFields.content !== undefined && titleIndex
            ? extractBacklinks(content, titleIndex)
            : note.backlinks
        const updated = { ...note, ...nextFields, backlinks, updatedAt: new Date().toISOString() }
        if (nextFields.content !== undefined) updated.contentLoaded = true
        updatedNote = updated
        return updated
      }
      return note
    })

    if (updatedNote) {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        if (updatedNote) {
          persistNote(updatedNote, previousNote)
          set({ saveStatus: 'saved' })
        }
      }, 600)
      set({ notes: updatedNotes, saveStatus: 'saving' })
    }
  },

  stageNoteContent: (id, content) => {
    const cleaned = stripAiDraftBannerFromHtml(content)
    contentDrafts.set(id, cleaned)
    if (get().saveStatus !== 'saving') set({ saveStatus: 'saving' })
    if (contentSaveTimeout) clearTimeout(contentSaveTimeout)
    contentSaveTimeout = setTimeout(() => {
      get().flushNoteContent(id)
    }, CONTENT_SAVE_DEBOUNCE_MS)
  },

  flushNoteContent: (id) => {
    if (contentSaveTimeout) {
      clearTimeout(contentSaveTimeout)
      contentSaveTimeout = null
    }

    const ids = id ? [id] : Array.from(contentDrafts.keys())
    if (ids.length === 0) return

    const titleIndex = buildTitleIndex(get().notes)
    let notes = get().notes
    let didChange = false
    const toPersist: { note: Note; previous?: Note }[] = []

    for (const noteId of ids) {
      const draft = contentDrafts.get(noteId)
      if (draft === undefined) continue
      contentDrafts.delete(noteId)
      const previous = notes.find((n) => n.id === noteId)
      if (!previous) continue
      if (previous.content === draft && previous.contentLoaded) continue

      const updated: Note = {
        ...previous,
        content: draft,
        contentLoaded: true,
        backlinks: extractBacklinks(draft, titleIndex),
        updatedAt: new Date().toISOString(),
      }
      notes = notes.map((n) => (n.id === noteId ? updated : n))
      toPersist.push({ note: updated, previous })
      didChange = true
    }

    if (!didChange) {
      if (get().saveStatus !== 'saved') set({ saveStatus: 'saved' })
      return
    }

    set({ notes, saveStatus: 'saving' })
    for (const { note, previous } of toPersist) {
      persistNote(note, previous)
    }
    set({ saveStatus: 'saved' })
  },

  deleteNote: (id) => {
    const target = get().notes.find((n) => n.id === id)
    if (!target) return
    const api = getAPI()
    lastLocalSaveAt = Date.now()

    const tabs = get().openNoteTabs.filter((tabId) => tabId !== id)

    if (target.folder === 'trash') {
      const updatedNotes = get().notes.filter((n) => n.id !== id)
      const nextTodos = removeTodosForNote(get().noteTodosByNoteId, id)
      saveNoteTodosStorage(nextTodos)
      const wasSelected = get().selectedNoteId === id
      set({
        notes: updatedNotes,
        noteTodosByNoteId: nextTodos,
        openNoteTabs: tabs,
        ...(wasSelected ? { selectedNoteId: null, mainView: 'home' as const } : {}),
      })
      if (api) api.deleteNote(id).catch(console.error)
      else localStorage.setItem('noteszen-db-notes', JSON.stringify(updatedNotes))
    } else {
      const updatedNotes = get().notes.map((note) =>
        note.id === id
          ? {
              ...note,
              folder: 'trash',
              isPinned: false,
              isFavorite: false,
              trashedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : note
      )
      const wasSelected = get().selectedNoteId === id
      set({
        notes: updatedNotes,
        openNoteTabs: tabs,
        ...(wasSelected ? { selectedNoteId: null, mainView: 'home' as const } : {}),
      })
      const noteToSave = updatedNotes.find((n) => n.id === id)
      if (noteToSave) persistNote(noteToSave)
    }
  },

  restoreNote: (id) => {
    const updatedNotes = get().notes.map((note) =>
      note.id === id
        ? { ...note, folder: 'personal', trashedAt: null, updatedAt: new Date().toISOString() }
        : note
    )
    set({ notes: updatedNotes, activeFolder: 'notes' })
    const noteToSave = updatedNotes.find((n) => n.id === id)
    if (noteToSave) persistNote(noteToSave)
    get().openNote(id)
  },

  emptyTrash: () => {
    const trashNotes = get().notes.filter((n) => n.folder === 'trash')
    const updatedNotes = get().notes.filter((n) => n.folder !== 'trash')
    let nextTodos = get().noteTodosByNoteId
    for (const note of trashNotes) {
      nextTodos = removeTodosForNote(nextTodos, note.id)
    }
    saveNoteTodosStorage(nextTodos)
    lastLocalSaveAt = Date.now()
    set({ notes: updatedNotes, noteTodosByNoteId: nextTodos })
    if (get().selectedNoteId && trashNotes.some((n) => n.id === get().selectedNoteId)) {
      set({ selectedNoteId: null })
    }
    const api = getAPI()
    if (api) {
      Promise.all(trashNotes.map((n) => api.deleteNote(n.id))).catch(console.error)
    } else {
      localStorage.setItem('noteszen-db-notes', JSON.stringify(updatedNotes))
    }
  },

  togglePin: (id) => {
    const updatedNotes = get().notes.map((note) => {
      if (note.id === id) {
        const updated = { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() }
        persistNote(updated)
        return updated
      }
      return note
    })
    set({ notes: updatedNotes })
  },

  toggleFavorite: (id) => {
    const updatedNotes = get().notes.map((note) => {
      if (note.id === id) {
        const updated = { ...note, isFavorite: !note.isFavorite, updatedAt: new Date().toISOString() }
        persistNote(updated)
        return updated
      }
      return note
    })
    set({ notes: updatedNotes })
  },

  toggleArchive: (id) => {
    const updatedNotes = get().notes.map((note) => {
      if (note.id === id) {
        const updated = { ...note, isArchived: !note.isArchived, updatedAt: new Date().toISOString() }
        persistNote(updated)
        return updated
      }
      return note
    })
    set({ notes: updatedNotes })
    if (get().selectedNoteId === id) set({ selectedNoteId: null })
  },

  importNotes: async (notes, merge) => {
    const api = getAPI()
    if (api) {
      const count = await api.importNotes(notes, merge)
      await get().fetchNotes()
      return count
    }
    const existing = merge ? get().notes : []
    const merged = [...notes, ...existing.filter((e) => !notes.some((n) => n.id === e.id))]
    set({ notes: merged })
    persistAllNotes(merged)
    return notes.length
  },

  exportSyncData: async () => {
    const api = getAPI()
    if (api) return api.exportSyncData(get().activeVaultId)
    return JSON.stringify({ notes: get().notes, folders: get().folders })
  },

  importSyncData: async (data, merge) => {
    const api = getAPI()
    if (api) {
      const count = await api.importSyncData(data, merge)
      await get().fetchNotes()
      await get().fetchFolders()
      return count
    }
    try {
      const parsed = JSON.parse(data)
      if (parsed.notes) await get().importNotes(parsed.notes, merge)
      return parsed.notes?.length || 0
    } catch {
      return 0
    }
  },

  createFolder: (name, color = 'text-primary') => {
    const folder: Folder = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      color,
      sortOrder: get().folders.length,
      vaultId: get().activeVaultId,
    }
    const updated = [...get().folders, folder]
    set({ folders: updated })
    const api = getAPI()
    if (api) api.saveFolder(folder)
    else localStorage.setItem('noteszen-folders', JSON.stringify(updated))
  },

  deleteFolder: (id) => {
    const activeFolder = get().activeFolder
    const previousNotes = get().notes
    const updated = get().folders.filter((f) => f.id !== id)
    const updatedNotes = previousNotes.map((note) =>
      note.folder === id
        ? { ...note, folder: 'personal', updatedAt: new Date().toISOString() }
        : note
    )
    set({
      folders: updated,
      notes: updatedNotes,
      ...(activeFolder === id ? { activeFolder: 'notes', mainView: 'home' as const } : {}),
    })
    const api = getAPI()
    if (api) {
      api.deleteFolder(id).catch(console.error)
      updatedNotes
        .filter((note) =>
          note.folder === 'personal' &&
          previousNotes.some((old) => old.id === note.id && old.folder === id)
        )
        .forEach((note) => persistNote(note, previousNotes.find((old) => old.id === note.id)))
    } else {
      localStorage.setItem('noteszen-folders', JSON.stringify(updated))
      localStorage.setItem('noteszen-db-notes', JSON.stringify(updatedNotes))
    }
  },

  saveTemplate: (template) => {
    const existing = get().templates.find((t) => t.id === template.id)
    const updated = existing
      ? get().templates.map((t) => (t.id === template.id ? template : t))
      : [...get().templates, template]
    set({ templates: updated })
    getAPI()?.saveTemplate(template)
  },

  deleteTemplate: (id) => {
    set({ templates: get().templates.filter((t) => t.id !== id) })
    getAPI()?.deleteTemplate(id)
  },

  getNoteVersions: async (noteId) => {
    const api = getAPI()
    if (api) return api.getNoteVersions(noteId)
    return getLocalNoteVersions(noteId)
  },

  restoreVersion: async (versionId) => {
    const api = getAPI()
    if (api) {
      const note = await api.restoreVersion(versionId)
      if (note) {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === note.id ? { ...n, ...note } : n)),
          selectedNoteId: note.id,
        }))
      }
      return note
    }

    const restored = restoreLocalNoteVersion(versionId)
    if (restored) {
      set((state) => ({
        notes: state.notes.map((n) => (n.id === restored.id ? restored : n)),
        selectedNoteId: restored.id,
      }))
    }
    return restored
  },

  trackRecent: (noteId) => {
    const recent = [noteId, ...get().recentNoteIds.filter((id) => id !== noteId)].slice(0, 20)
    set({ recentNoteIds: recent })
    localStorage.setItem('noteszen-recent', JSON.stringify(recent))
  },
}))
