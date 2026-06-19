import { useState, useEffect, useMemo, useRef } from 'react'
import { useNotesStore } from '../store/useNotesStore'
import {
  FileText,
  Plus,
  Pin,
  Star,
  Archive,
  Trash,
  Search,
  Sparkles
} from 'lucide-react'
import { cn } from "@/lib/utils"

export default function CommandPalette() {
  const {
    notes,
    selectedNoteId,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    createNote,
    createDailyNote,
    setSelectedNoteId,
    togglePin,
    toggleFavorite,
    toggleArchive,
    deleteNote
  } = useNotesStore()

  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)

  const activeNote = notes.find(n => n.id === selectedNoteId) || null

  // System actions available in palette
  const systemActions = [
    {
      id: 'create-note',
      title: 'Create New Note',
      category: 'Actions',
      icon: Plus,
      shortcut: '⌘N',
      action: () => {
        createNote()
        setCommandPaletteOpen(false)
      }
    },
    {
      id: 'daily-note',
      title: 'Open Daily Note',
      category: 'Actions',
      icon: FileText,
      shortcut: '⌘D',
      action: () => {
        createDailyNote()
        setCommandPaletteOpen(false)
      }
    },
    {
      id: 'toggle-pin',
      title: activeNote?.isPinned ? 'Unpin Selected Note' : 'Pin Selected Note',
      category: 'Actions',
      icon: Pin,
      shortcut: '⌘P',
      action: () => {
        if (selectedNoteId) {
          togglePin(selectedNoteId)
          setCommandPaletteOpen(false)
        }
      }
    },
    {
      id: 'toggle-fav',
      title: activeNote?.isFavorite ? 'Remove Selected Note from Favorites' : 'Add Selected Note to Favorites',
      category: 'Actions',
      icon: Star,
      shortcut: '⌘F',
      action: () => {
        if (selectedNoteId) {
          toggleFavorite(selectedNoteId)
          setCommandPaletteOpen(false)
        }
      }
    },
    {
      id: 'archive-note',
      title: activeNote?.isArchived ? 'Unarchive Selected Note' : 'Archive Selected Note',
      category: 'Actions',
      icon: Archive,
      shortcut: '⌘A',
      action: () => {
        if (selectedNoteId) {
          toggleArchive(selectedNoteId)
          setCommandPaletteOpen(false)
        }
      }
    },
    {
      id: 'delete-note',
      title: 'Delete Selected Note',
      category: 'Actions',
      icon: Trash,
      shortcut: '⌘⌫',
      action: () => {
        if (selectedNoteId) {
          deleteNote(selectedNoteId)
          setCommandPaletteOpen(false)
        }
      }
    }
  ]

  // Filter actions and notes based on search query
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim()
    
    // Actions match
    const matchedActions = systemActions.filter(action => 
      action.title.toLowerCase().includes(q)
    )

    // Notes match (excluding trash notes)
    const matchedNotes = notes
      .filter(n => n.folder !== 'trash' && n.title.toLowerCase().includes(q))
      .map(n => ({
        id: `note-${n.id}`,
        title: `Go to: ${n.title}`,
        category: 'Notes',
        icon: FileText,
        shortcut: 'Enter',
        action: () => {
          setSelectedNoteId(n.id)
          setCommandPaletteOpen(false)
        }
      }))

    return [...matchedActions, ...matchedNotes]
  }, [search, notes, selectedNoteId])

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Handle keyboard navigation inside command palette
  useEffect(() => {
    if (!isCommandPaletteOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setCommandPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCommandPaletteOpen, filteredItems, selectedIndex])

  // Handle clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setCommandPaletteOpen(false)
      }
    }
    if (isCommandPaletteOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCommandPaletteOpen])

  if (!isCommandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-xs select-none">
      <div 
        ref={modalRef}
        className="w-[550px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden bg-popover text-popover-foreground border-border"
      >
        {/* Search header bar */}
        <div className="flex items-center px-4 py-3 gap-2 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Type a command or search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow bg-transparent border-0 outline-none text-sm placeholder-muted-foreground focus:ring-0"
            autoFocus
          />
        </div>

        {/* Results list */}
        <div className="max-h-[330px] overflow-y-auto p-2 scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-semibold">
              No actions or notes found matching "{search}"
            </div>
          ) : (
            <div>
              {/* Group items by category */}
              {['Actions', 'Notes'].map(cat => {
                const catItems = filteredItems.filter(item => item.category === cat)
                if (catItems.length === 0) return null
                
                return (
                  <div key={cat} className="space-y-0.5">
                    <p className="text-[9px] font-bold tracking-wider text-muted-foreground/80 uppercase px-2 py-1 mt-1">{cat}</p>
                    {catItems.map((item) => {
                      const absoluteIndex = filteredItems.indexOf(item)
                      const isSelected = absoluteIndex === selectedIndex
                      const Icon = item.icon

                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left",
                            isSelected 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0 opacity-80" />
                            <span className="truncate max-w-[340px]">{item.title}</span>
                          </div>
                          <kbd className={cn(
                            "font-mono text-[9px] px-1.5 py-0.5 rounded",
                            isSelected 
                              ? "bg-primary-foreground/20 text-primary-foreground" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {item.shortcut}
                          </kbd>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Command palette footer info */}
        <div className="px-4 py-2 bg-muted/20 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Search or command via keyboard-first flow</span>
          </div>
          <div className="flex gap-2">
            <span>Navigate: <kbd className="font-mono">↑↓</kbd></span>
            <span>Select: <kbd className="font-mono">Enter</kbd></span>
          </div>
        </div>
      </div>
    </div>
  )
}
