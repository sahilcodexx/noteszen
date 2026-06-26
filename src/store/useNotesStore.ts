import { create } from 'zustand'
import type { AppSettings, Folder, Note, NoteVersion, Template, Vault } from '../types'
import { getAPI } from '../tauri-bridge'

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

  fetchNotes: () => Promise<void>
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
  setAppSettings: (settings: Partial<AppSettings>) => void
  setActiveVault: (vaultId: string) => Promise<void>
  createVault: (name: string) => Promise<void>

  createNote: (initialFields?: Partial<Note>) => void
  createNoteFromTemplate: (templateId: string) => void
  createDailyNote: () => void
  updateNote: (id: string, fields: Partial<Note>) => void
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
  restoreVersion: (versionId: string) => Promise<void>
  trackRecent: (noteId: string) => void
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null

function extractBacklinks(content: string, allNotes: Note[]): string[] {
  const linkRegex = /\[\[(.*?)\]\]/g
  const matches = [...content.matchAll(linkRegex)]
  const targetIds: string[] = []
  for (const match of matches) {
    const title = match[1]?.trim().toLowerCase()
    if (title) {
      const targetNote = allNotes.find((n) => n.title.toLowerCase() === title)
      if (targetNote) targetIds.push(targetNote.id)
    }
  }
  return Array.from(new Set(targetIds))
}

function persistNote(note: Note) {
  const api = getAPI()
  if (api) {
    api.saveNote(note, true).catch((err) => console.error('Failed to save note:', err))
  } else {
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
  isSidebarCollapsed: true,
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

  initApp: async () => {
    await get().fetchVaults()
    await get().fetchSettings()
    await get().fetchNotes()
    await get().fetchFolders()
    await get().fetchTemplates()

    const api = getAPI()
    if (api?.onNotesChanged) {
      api.onNotesChanged(() => {
        get().fetchNotes()
      })
    }
  },

  fetchNotes: async () => {
    const api = getAPI()
    const vaultId = get().activeVaultId
    if (api) {
      const fetched = await api.getNotes(vaultId)
      set({ notes: fetched })
      if (fetched.length > 0 && !get().selectedNoteId) {
        const first = fetched.find((n) => n.folder !== 'trash' && !n.isArchived)
        if (first) set({ selectedNoteId: first.id })
      }
    } else {
      const local = localStorage.getItem('noteszen-db-notes')
      if (local) {
        try {
          const parsed = JSON.parse(local) as Note[]
          set({ notes: parsed })
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
      set({
        appSettings: {
          trashAutoPurgeDays: trashDays ? parseInt(trashDays, 10) : 30,
          spellCheckLanguage: spellLang || 'en',
          syncFolderPath: syncPath || '',
        },
      })
    }
  },

  setSelectedNoteId: (id) => {
    set({ selectedNoteId: id })
    if (id) get().trackRecent(id)
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFolder: (folder) => set({ activeFolder: folder, selectedTag: null }),
  setSelectedTag: (tag) => set({ selectedTag: tag, ...(tag ? { activeFolder: 'notes' } : {}) }),
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
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
    }

    const updatedNotes = [newNote, ...get().notes]
    const resetView = ['favorites', 'recent', 'archive', 'daily', 'trash'].includes(activeFolder)
    set({
      notes: updatedNotes,
      selectedNoteId: newNote.id,
      selectedTag: null,
      ...(resetView ? { activeFolder: 'notes' } : {}),
    })
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
      set({ selectedNoteId: dailyNote.id, activeFolder: 'daily' })
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
    let updatedNote: Note | null = null
    const updatedNotes = get().notes.map((note) => {
      if (note.id === id) {
        const content = fields.content !== undefined ? fields.content : note.content
        const backlinks =
          fields.content !== undefined ? extractBacklinks(content, get().notes) : note.backlinks
        const updated = { ...note, ...fields, backlinks, updatedAt: new Date().toISOString() }
        updatedNote = updated
        return updated
      }
      return note
    })

    if (updatedNote) {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        if (updatedNote) {
          persistNote(updatedNote)
          set({ saveStatus: 'saved' })
        }
      }, 600)
      set({ notes: updatedNotes, saveStatus: 'saving' })
    }
  },

  deleteNote: (id) => {
    const target = get().notes.find((n) => n.id === id)
    if (!target) return
    const api = getAPI()

    if (target.folder === 'trash') {
      const updatedNotes = get().notes.filter((n) => n.id !== id)
      set({ notes: updatedNotes })
      if (get().selectedNoteId === id) set({ selectedNoteId: updatedNotes[0]?.id || null })
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
      set({ notes: updatedNotes })
      if (get().selectedNoteId === id) set({ selectedNoteId: null })
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
    set({ notes: updatedNotes, selectedNoteId: id })
    const noteToSave = updatedNotes.find((n) => n.id === id)
    if (noteToSave) persistNote(noteToSave)
  },

  emptyTrash: () => {
    const trashNotes = get().notes.filter((n) => n.folder === 'trash')
    const updatedNotes = get().notes.filter((n) => n.folder !== 'trash')
    set({ notes: updatedNotes })
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
    const updated = get().folders.filter((f) => f.id !== id)
    set({ folders: updated })
    const api = getAPI()
    if (api) api.deleteFolder(id)
    else localStorage.setItem('noteszen-folders', JSON.stringify(updated))
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
    return []
  },

  restoreVersion: async (versionId) => {
    const api = getAPI()
    if (api) {
      const note = await api.restoreVersion(versionId)
      if (note) await get().fetchNotes()
    }
  },

  trackRecent: (noteId) => {
    const recent = [noteId, ...get().recentNoteIds.filter((id) => id !== noteId)].slice(0, 20)
    set({ recentNoteIds: recent })
    localStorage.setItem('noteszen-recent', JSON.stringify(recent))
  },
}))