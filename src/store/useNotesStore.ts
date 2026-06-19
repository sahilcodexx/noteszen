import { create } from 'zustand'
import type { Note } from '../electron'

interface NotesState {
  notes: Note[]
  selectedNoteId: string | null
  searchQuery: string
  activeFolder: string // 'notes' | 'favorites' | 'daily' | 'archive' | 'settings' | 'trash'
  selectedTag: string | null
  isSidebarCollapsed: boolean
  isCommandPaletteOpen: boolean
  isGlobalSearchOpen: boolean
  saveStatus: 'saved' | 'saving' | 'error'
  
  // Actions
  fetchNotes: () => Promise<void>
  setSelectedNoteId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setActiveFolder: (folder: string) => void
  setSelectedTag: (tag: string | null) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setGlobalSearchOpen: (open: boolean) => void
  setSaveStatus: (status: 'saved' | 'saving' | 'error') => void
  
  createNote: (initialFields?: Partial<Note>) => void
  createDailyNote: () => void
  updateNote: (id: string, fields: Partial<Note>) => void
  deleteNote: (id: string) => void
  restoreNote: (id: string) => void
  togglePin: (id: string) => void
  toggleFavorite: (id: string) => void
  toggleArchive: (id: string) => void
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null

// Helper to parse backlinks in text (extracts titles in [[Title]])
function extractBacklinks(content: string, allNotes: Note[]): string[] {
  const linkRegex = /\[\[(.*?)\]\]/g
  const matches = [...content.matchAll(linkRegex)]
  const targetIds: string[] = []

  for (const match of matches) {
    const title = match[1]?.trim().toLowerCase()
    if (title) {
      const targetNote = allNotes.find(n => n.title.toLowerCase() === title)
      if (targetNote) {
        targetIds.push(targetNote.id)
      }
    }
  }
  return Array.from(new Set(targetIds)) // unique target ids
}

// Helper to save to Disk (Electron) or LocalStorage (Browser fallback)
function persistNote(note: Note, notesList: Note[]) {
  if (window.electronAPI) {
    window.electronAPI.saveNote(note).catch(err => {
      console.error('Failed to save note to SQLite:', err)
    })
  } else {
    localStorage.setItem('noteszen-db-notes', JSON.stringify(notesList))
  }
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  selectedNoteId: null,
  searchQuery: '',
  activeFolder: 'notes',
  selectedTag: null,
  isSidebarCollapsed: false,
  isCommandPaletteOpen: false,
  isGlobalSearchOpen: false,
  saveStatus: 'saved',

  fetchNotes: async () => {
    if (window.electronAPI) {
      const fetched = await window.electronAPI.getNotes()
      set({ notes: fetched })
      if (fetched.length > 0 && !get().selectedNoteId) {
        // Find first non-archived, non-trash note
        const first = fetched.find(n => n.folder !== 'trash' && !n.isArchived)
        if (first) set({ selectedNoteId: first.id })
      }
    } else {
      const local = localStorage.getItem('noteszen-db-notes')
      if (local) {
        try {
          const parsed = JSON.parse(local) as Note[]
          set({ notes: parsed })
          if (parsed.length > 0 && !get().selectedNoteId) {
            const first = parsed.find(n => n.folder !== 'trash' && !n.isArchived)
            if (first) set({ selectedNoteId: first.id })
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  },

  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFolder: (folder) => set({ activeFolder: folder, selectedTag: null }),
  setSelectedTag: (tag) => set({ selectedTag: tag, activeFolder: 'notes' }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setGlobalSearchOpen: (open) => set({ isGlobalSearchOpen: open }),
  setSaveStatus: (status) => set({ saveStatus: status }),

  createNote: (initialFields = {}) => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 11),
      title: initialFields.title || 'Untitled Note',
      content: initialFields.content || '',
      folder: initialFields.folder || 'personal',
      tags: initialFields.tags || [],
      backlinks: initialFields.backlinks || [],
      isPinned: initialFields.isPinned || false,
      isFavorite: initialFields.isFavorite || false,
      isArchived: initialFields.isArchived || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedNotes = [newNote, ...get().notes]
    set({ notes: updatedNotes, selectedNoteId: newNote.id })
    persistNote(newNote, updatedNotes)
  },

  createDailyNote: () => {
    const todayStr = new Date().toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    // Check if daily note already exists
    const dailyNote = get().notes.find(
      n => n.title === `Daily Note - ${todayStr}` && n.folder !== 'trash'
    )

    if (dailyNote) {
      set({ selectedNoteId: dailyNote.id, activeFolder: 'daily' })
    } else {
      get().createNote({
        title: `Daily Note - ${todayStr}`,
        content: `## Daily Log: ${todayStr}\n\n- [ ] Task 1...\n- [ ] Task 2...\n\n### Thoughts today:\n- `,
        folder: 'daily',
        tags: ['daily']
      })
      set({ activeFolder: 'daily' })
    }
  },

  updateNote: (id, fields) => {
    set((state) => {
      const updatedNotes = state.notes.map((note) => {
        if (note.id === id) {
          const content = fields.content !== undefined ? fields.content : note.content
          const backlinks = fields.content !== undefined 
            ? extractBacklinks(content, state.notes)
            : note.backlinks

          const updated = {
            ...note,
            ...fields,
            backlinks,
            updatedAt: new Date().toISOString()
          }

          // Debounce actual save to SQL
          set({ saveStatus: 'saving' })
          if (saveTimeout) clearTimeout(saveTimeout)
          saveTimeout = setTimeout(() => {
            persistNote(updated, get().notes)
            set({ saveStatus: 'saved' })
          }, 600)

          return updated
        }
        return note
      })
      return { notes: updatedNotes }
    })
  },

  deleteNote: (id) => {
    const target = get().notes.find(n => n.id === id)
    if (!target) return

    let updatedNotes: Note[] = []

    if (target.folder === 'trash') {
      // Permanent delete
      updatedNotes = get().notes.filter(n => n.id !== id)
      set({ notes: updatedNotes })
      if (get().selectedNoteId === id) {
        set({ selectedNoteId: updatedNotes[0]?.id || null })
      }
      if (window.electronAPI) {
        window.electronAPI.deleteNote(id).catch(err => console.error(err))
      } else {
        localStorage.setItem('noteszen-db-notes', JSON.stringify(updatedNotes))
      }
    } else {
      // Move to Trash
      updatedNotes = get().notes.map((note) => {
        if (note.id === id) {
          return {
            ...note,
            folder: 'trash',
            isPinned: false,
            isFavorite: false,
            updatedAt: new Date().toISOString()
          }
        }
        return note
      })
      set({ notes: updatedNotes })
      if (get().selectedNoteId === id) {
        set({ selectedNoteId: null })
      }
      const noteToSave = updatedNotes.find(n => n.id === id)
      if (noteToSave) {
        persistNote(noteToSave, updatedNotes)
      }
    }
  },

  restoreNote: (id) => {
    const updatedNotes = get().notes.map((note) => {
      if (note.id === id) {
        return {
          ...note,
          folder: 'personal',
          updatedAt: new Date().toISOString()
        }
      }
      return note
    })
    set({ notes: updatedNotes, selectedNoteId: id })
    const noteToSave = updatedNotes.find(n => n.id === id)
    if (noteToSave) {
      persistNote(noteToSave, updatedNotes)
    }
  },

  togglePin: (id) => {
    const updatedNotes = get().notes.map((note) => {
      if (note.id === id) {
        const updated = {
          ...note,
          isPinned: !note.isPinned,
          updatedAt: new Date().toISOString()
        }
        persistNote(updated, get().notes)
        return updated
      }
      return note
    })
    set({ notes: updatedNotes })
  },

  toggleFavorite: (id) => {
    const updatedNotes = get().notes.map((note) => {
      if (note.id === id) {
        const updated = {
          ...note,
          isFavorite: !note.isFavorite,
          updatedAt: new Date().toISOString()
        }
        persistNote(updated, get().notes)
        return updated
      }
      return note
    })
    set({ notes: updatedNotes })
  },

  toggleArchive: (id) => {
    const updatedNotes = get().notes.map((note) => {
      if (note.id === id) {
        const updated = {
          ...note,
          isArchived: !note.isArchived,
          updatedAt: new Date().toISOString()
        }
        persistNote(updated, get().notes)
        return updated
      }
      return note
    })
    set({ notes: updatedNotes })
    // If archived note was selected, deselect it
    if (get().selectedNoteId === id) {
      set({ selectedNoteId: null })
    }
  }
}))
