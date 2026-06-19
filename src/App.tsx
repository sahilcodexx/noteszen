import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  FileText,
  Star,
  Calendar,
  Tag,
  Archive,
  Settings,
  Search,
  Pin,
  Plus,
  Moon,
  Sun,
  Trash2,
  Menu,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  Command,
  X,
  CheckCircle
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// App Components
import Editor from './components/Editor'
import CommandPalette from './components/CommandPalette'
import GlobalSearch from './components/GlobalSearch'
import Onboarding from './components/Onboarding'
import QuickCapture from './components/QuickCapture'

// State Store
import { useNotesStore } from './store/useNotesStore'

export default function App() {
  const isQuickCaptureWindow = window.location.hash === '#quick-capture'

  // If this window is the Quick Capture popup, render the capture screen directly
  if (isQuickCaptureWindow) {
    return <QuickCapture />
  }

  // State bindings from Zustand Store
  const {
    notes,
    selectedNoteId,
    searchQuery,
    activeFolder,
    selectedTag,
    isSidebarCollapsed,
    isCommandPaletteOpen,
    isGlobalSearchOpen,
    saveStatus,
    fetchNotes,
    setSelectedNoteId,
    setSearchQuery,
    setActiveFolder,
    setSelectedTag,
    toggleSidebar,
    setCommandPaletteOpen,
    setGlobalSearchOpen,
    createNote,
    createDailyNote,
    togglePin,
    toggleFavorite,
    toggleArchive,
    deleteNote,
    restoreNote,
    updateNote
  } = useNotesStore()

  // Local React states
  const [tagFilterInput, setTagFilterInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load notes on mount
  useEffect(() => {
    fetchNotes()
  }, [])

  // Manage Dark Mode styles
  useEffect(() => {
    const root = window.document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [darkMode])

  // All unique tags extracted from non-trash notes
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    notes.forEach(note => {
      if (note.folder !== 'trash' && note.tags) {
        note.tags.forEach(tag => tagsSet.add(tag))
      }
    })
    return Array.from(tagsSet)
  }, [notes])

  // Filter notes list by Folder and selected tag
  const folderFilteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // 1. Tag filter override
      if (selectedTag) {
        return note.folder !== 'trash' && note.tags && note.tags.includes(selectedTag)
      }

      // 2. Folder matching
      if (activeFolder === 'trash') {
        return note.folder === 'trash'
      }
      
      if (note.folder === 'trash') return false

      if (activeFolder === 'archive') {
        return note.isArchived
      }
      
      if (note.isArchived) return false

      if (activeFolder === 'favorites') {
        return note.isFavorite
      }

      if (activeFolder === 'daily') {
        return note.folder === 'daily'
      }

      // 'notes' folder matches everything non-archived, non-trash
      return true
    })
  }, [notes, activeFolder, selectedTag])

  // Fuzzy match query local filter over the list
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return folderFilteredNotes
    const q = searchQuery.toLowerCase().trim()
    return folderFilteredNotes.filter((note) => {
      return (
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        (note.tags && note.tags.some(t => t.toLowerCase().includes(q)))
      )
    })
  }, [folderFilteredNotes, searchQuery])

  // Sort notes: Pinned notes always at the top, then by updatedAt descending
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [filteredNotes])

  // Selected note object helper
  const activeNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || null
  }, [notes, selectedNoteId])

  // Global Keyboard shortcuts trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl + N (New Note)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        createNote()
      }
      // 2. Ctrl + K (Command Palette)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!isCommandPaletteOpen)
      }
      // 3. Ctrl + F (Search locally in list)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // 4. Ctrl + Shift + F (Global Search Overlay)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault()
        setGlobalSearchOpen(!isGlobalSearchOpen)
      }
      // 5. Ctrl + D (Daily Note)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        createDailyNote()
      }
      // 6. Ctrl + P (Pin selected note toggle)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        if (selectedNoteId) togglePin(selectedNoteId)
      }
      // 7. Ctrl + B (Toggle Sidebar expand)
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
      // 8. Alt + ArrowUp / ArrowDown (Navigate list notes)
      if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault()
        const activeIndex = sortedNotes.findIndex(n => n.id === selectedNoteId)
        if (activeIndex === -1) return
        
        let nextIndex = activeIndex
        if (e.key === 'ArrowDown') {
          nextIndex = (activeIndex + 1) % sortedNotes.length
        } else {
          nextIndex = (activeIndex - 1 + sortedNotes.length) % sortedNotes.length
        }
        
        const nextNote = sortedNotes[nextIndex]
        if (nextNote) {
          setSelectedNoteId(nextNote.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [notes, selectedNoteId, sortedNotes, isCommandPaletteOpen, isGlobalSearchOpen])

  // Custom Electron window controls handlers
  const handleWinMin = () => window.electronAPI?.minimize()
  const handleWinMax = () => window.electronAPI?.maximize()
  const handleWinClose = () => window.electronAPI?.close()

  // Backup data function
  const handleLocalBackup = () => {
    try {
      const dataStr = JSON.stringify(notes, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `noteszen-backup-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Backup failed: ' + e)
    }
  }

  // Tags list update helper
  const handleAddTagToActiveNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeNote || !tagFilterInput.trim()) return
    const tag = tagFilterInput.trim().toLowerCase()
    if (!activeNote.tags.includes(tag)) {
      const updatedTags = [...activeNote.tags, tag]
      updateNote(activeNote.id, { tags: updatedTags })
    }
    setTagFilterInput('')
  }

  const handleRemoveTagFromActiveNote = (tag: string) => {
    if (!activeNote) return
    const updatedTags = activeNote.tags.filter(t => t !== tag)
    updateNote(activeNote.id, { tags: updatedTags })
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${darkMode ? 'dark bg-[#141416] text-[#e3e3e6]' : 'bg-[#f5f5f7] text-[#1c1c1f]'}`}>
      
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`flex flex-col border-r border-black/5 dark:border-white/5 shrink-0 drag-region transition-all duration-300 backdrop-blur-md
          ${isSidebarCollapsed ? 'w-0 opacity-0 -translate-x-[200px] overflow-hidden' : 'w-[220px] opacity-100 translate-x-0'}
          ${darkMode ? 'bg-[#18181c]/90' : 'bg-[#eef0f3]/95'}`}
      >
        {/* macOS Custom Traffic lights window triggers */}
        <div className="h-12 flex items-center pl-4 gap-2 no-drag shrink-0">
          <button 
            onClick={handleWinClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#e04f46] flex items-center justify-center group transition-all"
            title="Close"
          >
            <span className="text-[7px] text-[#4c0002] font-bold opacity-0 group-hover:opacity-100 select-none">✕</span>
          </button>
          <button 
            onClick={handleWinMin}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#e0a324] flex items-center justify-center group transition-all"
            title="Minimize"
          >
            <span className="text-[7px] text-[#5c3e00] font-bold opacity-0 group-hover:opacity-100 select-none">−</span>
          </button>
          <button 
            onClick={handleWinMax}
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#1aab2f] flex items-center justify-center group transition-all"
            title="Maximize"
          >
            <span className="text-[7px] text-[#004d05] font-bold opacity-0 group-hover:opacity-100 select-none">⤢</span>
          </button>
        </div>

        {/* Brand header title */}
        <div className="px-4 py-1.5 flex items-center justify-between no-drag">
          <span className="text-base font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent flex items-center gap-1.5 font-sans tracking-tight">
            <Sparkles className="w-4 h-4 text-amber-500" />
            NotesZen
          </span>
        </div>

        {/* Sidebar Nav Actions (Shadcn Custom Scroll Container) */}
        <ScrollArea className="flex-grow px-2 py-3 space-y-1.5 no-drag select-none scrollbar-none">
          <p className="text-[9px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase px-2.5 mb-1.5">Views</p>
          
          <div className="space-y-0.5">
            {[
              { id: 'notes', name: 'Notes', icon: FileText, color: 'text-amber-500/90' },
              { id: 'favorites', name: 'Favorites', icon: Star, color: 'text-yellow-500/90' },
              { id: 'daily', name: 'Daily Notes', icon: Calendar, color: 'text-green-500/90' },
              { id: 'archive', name: 'Archive', icon: Archive, color: 'text-blue-500/90' },
              { id: 'trash', name: 'Trash', icon: Trash2, color: 'text-red-500/90' }
            ].map((folder) => {
              const Icon = folder.icon
              const isSelected = activeFolder === folder.id && !selectedTag
              const count = notes.filter(n => {
                if (folder.id === 'trash') return n.folder === 'trash'
                if (n.folder === 'trash') return false
                if (folder.id === 'archive') return n.isArchived
                if (n.isArchived) return false
                if (folder.id === 'favorites') return n.isFavorite
                if (folder.id === 'daily') return n.folder === 'daily'
                return true
              }).length

              return (
                <Button
                  key={folder.id}
                  variant={isSelected ? 'default' : 'ghost'}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`w-full justify-between h-8 px-2.5 text-xs font-semibold rounded-lg transition-all group
                    ${isSelected 
                      ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 shadow-amber-500/10' 
                      : darkMode 
                        ? 'text-gray-400 hover:bg-white/5 hover:text-white' 
                        : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : folder.color}`} />
                    <span>{folder.name}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md transition-all
                    ${isSelected 
                      ? 'bg-white/20 text-white' 
                      : 'bg-black/10 dark:bg-white/5 text-gray-400 dark:text-gray-500 group-hover:text-gray-300'}`}>
                    {count}
                  </span>
                </Button>
              )
            })}
          </div>

          {/* Sidebar Tags view */}
          {allTags.length > 0 && (
            <div className="pt-4 space-y-0.5">
              <p className="text-[9px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase px-2.5 mb-1.5">Tags</p>
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag
                const tagCount = notes.filter(n => n.folder !== 'trash' && n.tags && n.tags.includes(tag)).length
                
                return (
                  <Button
                    key={tag}
                    variant={isSelected ? 'default' : 'ghost'}
                    onClick={() => setSelectedTag(tag)}
                    className={`w-full justify-between h-8 px-2.5 text-xs font-semibold rounded-lg transition-all
                      ${isSelected 
                        ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-700 shadow-amber-600/10' 
                        : darkMode 
                          ? 'text-gray-400 hover:bg-white/5 hover:text-white' 
                          : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-amber-500/80'}`} />
                      <span className="truncate max-w-[120px]">{tag}</span>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-gray-400">
                      {tagCount}
                    </span>
                  </Button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Sidebar settings controls */}
        <div className="p-3.5 border-t border-black/5 dark:border-white/5 no-drag flex items-center justify-between shrink-0 select-none">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowSettings(true)}
            className="h-7 px-2 text-xs font-semibold text-gray-400 hover:text-white rounded-lg hover:bg-white/5 flex items-center gap-1.5"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </aside>

      {/* 2. NOTE LIST PANEL */}
      <section className={`w-[270px] flex flex-col border-r border-black/5 dark:border-white/5 shrink-0 transition-colors duration-300
        ${darkMode ? 'bg-[#18181b]' : 'bg-white'}`}>
        
        {/* Note List Header controls */}
        <div className="h-14 px-4 flex items-center gap-2 border-b border-black/5 dark:border-white/5 shrink-0 select-none">
          {isSidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-lg text-gray-400"
              title="Expand Sidebar"
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}

          <div className="relative flex-grow flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-7 h-7.5 text-xs outline-none border-0 rounded-lg transition-all focus-visible:ring-1 focus-visible:ring-amber-500/40
                ${darkMode ? 'bg-black/35 text-white placeholder-gray-500' : 'bg-[#eef0f3] text-gray-800 placeholder-gray-400'}`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <Button
            onClick={() => createNote()}
            disabled={activeFolder === 'trash'}
            className="w-7.5 h-7.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 shrink-0"
            size="icon"
            title="Create Note"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Note List Items (Shadcn Scroll Area) */}
        <ScrollArea className="flex-1 divide-y divide-black/5 dark:divide-white/5">
          {sortedNotes.length === 0 ? (
            <div className="p-8 text-center text-gray-500 mt-12 select-none">
              <FileText className="w-8 h-8 mx-auto text-gray-600 mb-2 opacity-50" />
              <p className="text-xs font-semibold">No notes found</p>
              <p className="text-[10px] text-gray-600 mt-1">Press ⌘N to make a new note</p>
            </div>
          ) : (
            sortedNotes.map((note) => {
              const isSelected = note.id === selectedNoteId
              const previewText = note.content
                ? note.content.replace(/<[^>]*>/g, '').replace(/[#*`>_\-]/g, '').substring(0, 70)
                : 'No additional text'
              
              const dateObj = new Date(note.updatedAt)
              const formattedDate = dateObj.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric' 
              })

              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-3.5 cursor-pointer relative transition-all group border-l-2
                    ${isSelected 
                      ? 'bg-amber-500/10 border-amber-500' 
                      : 'border-transparent hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'}`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className={`font-semibold text-xs truncate flex-grow ${isSelected ? 'text-amber-500 dark:text-amber-400' : ''}`}>
                      {note.title || 'Untitled Note'}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0 select-none">
                      {note.isPinned && (
                        <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNote(note.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 w-4 h-4 text-gray-400 hover:text-red-500 transition-opacity flex items-center justify-center"
                        title={activeFolder === 'trash' ? 'Delete permanently' : 'Move to Trash'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] line-clamp-2 mb-2 text-gray-500 leading-normal font-normal">
                    {previewText}
                  </p>

                  <div className="flex items-center justify-between select-none">
                    <span className="text-[9px] text-gray-400 font-medium">
                      {formattedDate}
                    </span>

                    {/* Tag list within item card */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-1 max-w-[120px] overflow-hidden">
                        {note.tags.slice(0, 2).map(tag => (
                          <span 
                            key={tag}
                            className="text-[8px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-gray-400 truncate"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {note.folder === 'trash' && (
                    <Button
                      variant="link"
                      onClick={(e: any) => {
                        e.stopPropagation()
                        restoreNote(note.id)
                      }}
                      className="absolute right-3 top-3 text-[9px] h-auto p-0 text-amber-500 hover:underline"
                    >
                      Restore
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </ScrollArea>
      </section>

      {/* 3. MAIN EDITOR PANEL */}
      <main className="flex-grow flex flex-col min-w-0 bg-[#ffffff] dark:bg-[#151518] transition-colors duration-300">
        
        {/* Editor panel toolbar */}
        <div className="h-14 px-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            {/* Collapse / Expand Toggle */}
            {isSidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="w-8 h-8 rounded-lg text-gray-400"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            {!isSidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="w-8 h-8 rounded-lg text-gray-400"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}

            {/* Auto-save indicators */}
            {activeNote && (
              <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1.5">
                {saveStatus === 'saving' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Autosaving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    Saved local
                  </>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions trigger command palette */}
            <Button
              variant="outline"
              onClick={() => setCommandPaletteOpen(true)}
              className="h-8 px-2.5 rounded-lg border-black/5 dark:border-white/5 text-gray-400 flex items-center gap-1.5 text-xs"
              title="Command Palette (⌘K)"
            >
              <Command className="w-3.5 h-3.5" />
              <kbd className="font-mono text-[9px] bg-black/5 dark:bg-white/5 px-1 rounded">⌘K</kbd>
            </Button>

            {activeNote && activeNote.folder !== 'trash' && (
              <>
                {/* Pin note */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => togglePin(activeNote.id)}
                  className={`w-8 h-8 rounded-lg border-black/5 dark:border-white/5
                    ${activeNote.isPinned ? 'text-amber-500 hover:bg-amber-500/10' : 'text-gray-400 hover:bg-white/5'}`}
                  title="Pin Note (⌘P)"
                >
                  <Pin className={`w-4 h-4 ${activeNote.isPinned ? 'fill-amber-500' : ''}`} />
                </Button>

                {/* Favorite Note */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleFavorite(activeNote.id)}
                  className={`w-8 h-8 rounded-lg border-black/5 dark:border-white/5
                    ${activeNote.isFavorite ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-gray-400 hover:bg-white/5'}`}
                  title="Favorite Note"
                >
                  <Star className={`w-4 h-4 ${activeNote.isFavorite ? 'fill-yellow-500' : ''}`} />
                </Button>

                {/* Archive Note */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleArchive(activeNote.id)}
                  className={`w-8 h-8 rounded-lg border-black/5 dark:border-white/5
                    ${activeNote.isArchived ? 'text-blue-500 hover:bg-blue-500/10' : 'text-gray-400 hover:bg-white/5'}`}
                  title="Archive Note"
                >
                  <Archive className={`w-4 h-4 ${activeNote.isArchived ? 'fill-blue-500' : ''}`} />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Note Editor Area */}
        {activeNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Big Note Title Input */}
            <div className="px-10 pt-8 pb-3 shrink-0">
              <input
                type="text"
                placeholder="Untitled Note"
                value={activeNote.title}
                onChange={(e: any) => updateNote(activeNote.id, { title: e.target.value })}
                disabled={activeNote.folder === 'trash'}
                className="w-full bg-transparent text-2xl font-bold border-0 shadow-none outline-none placeholder-gray-400 focus:ring-0 focus:ring-offset-0 p-0"
              />

              {/* Tags editor row */}
              <div className="flex items-center flex-wrap gap-1.5 mt-3 select-none">
                <Tag className="w-3.5 h-3.5 text-gray-500" />
                {activeNote.tags && activeNote.tags.map(t => (
                  <span 
                    key={t}
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/15"
                  >
                    {t}
                    {activeNote.folder !== 'trash' && (
                      <button 
                        onClick={() => handleRemoveTagFromActiveNote(t)}
                        className="hover:text-amber-700 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ))}

                {activeNote.folder !== 'trash' && (
                  <form onSubmit={handleAddTagToActiveNote} className="inline-flex items-center">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={tagFilterInput}
                      onChange={(e) => setTagFilterInput(e.target.value)}
                      className="border-none bg-transparent text-[11px] text-gray-500 outline-none w-16 focus:w-24 transition-all focus:ring-0 placeholder-gray-600 py-0"
                    />
                  </form>
                )}
              </div>
            </div>

            {/* TipTap Rich Editor */}
            <Editor />
          </div>
        ) : (
          /* Premium Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
            <div className="p-4 rounded-full bg-amber-500/5 text-amber-500 mb-4 animate-pulse">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold mb-1">Focus your thoughts</h2>
            <p className="text-xs text-gray-500 max-w-sm text-center mb-6 leading-relaxed">
              Create a new note or double-click to start a Daily log inbox. Everything is saved locally.
            </p>

            <div className="w-[300px] border border-black/5 dark:border-white/5 rounded-xl bg-black/[0.01] dark:bg-white/[0.01] p-3 space-y-1.5 text-[10px] text-gray-400 font-medium">
              <div className="flex justify-between p-1 bg-black/10 dark:bg-white/5 rounded px-2">
                <span>New Note</span>
                <kbd className="font-mono bg-black/20 dark:bg-white/10 px-1 rounded text-[9px]">⌘N</kbd>
              </div>
              <div className="flex justify-between p-1 bg-black/10 dark:bg-white/5 rounded px-2">
                <span>Daily Log</span>
                <kbd className="font-mono bg-black/20 dark:bg-white/10 px-1 rounded text-[9px]">⌘D</kbd>
              </div>
              <div className="flex justify-between p-1 bg-black/10 dark:bg-white/5 rounded px-2">
                <span>Command Palette</span>
                <kbd className="font-mono bg-black/20 dark:bg-white/10 px-1 rounded text-[9px]">⌘K</kbd>
              </div>
              <div className="flex justify-between p-1 bg-black/10 dark:bg-white/5 rounded px-2">
                <span>Global Search</span>
                <kbd className="font-mono bg-black/20 dark:bg-white/10 px-1 rounded text-[9px]">⌘⇧F</kbd>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* OVERLAY MENUS & ONBOARDINGS */}
      <CommandPalette />
      <GlobalSearch />
      <Onboarding />

      {/* Settings Modal (Shadcn Dialog Component overlay) */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className={`max-w-[450px] border shadow-2xl flex flex-col no-drag
          ${darkMode ? 'bg-[#1a1a1f] border-white/10 text-gray-200' : 'bg-white border-black/10 text-gray-800'}`}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 select-none">
              <Settings className="w-5 h-5 text-amber-500" />
              NotesZen Preferences
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 select-none">
            <div className="flex items-center justify-between border-b pb-3 border-black/5 dark:border-white/5">
              <div>
                <p className="text-xs font-semibold">Local SQLite File Sync</p>
                <p className="text-[10px] text-gray-500">
                  {window.electronAPI ? 'Offline SQLite Database active' : 'Web storage caching active'}
                </p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold
                ${window.electronAPI ? 'bg-green-500/10 text-green-500 border border-green-500/10' : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'}`}>
                {window.electronAPI ? 'SQLITE STORAGE' : 'WEB FALLBACK'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b pb-3 border-black/5 dark:border-white/5">
              <div>
                <p className="text-xs font-semibold">Local Data Backup</p>
                <p className="text-[10px] text-gray-500">Download backup JSON copy of notes</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLocalBackup}
                className="text-[10px] px-2.5 font-bold transition-all border-black/10 dark:border-white/10"
              >
                Export JSON
              </Button>
            </div>

            <div className="flex items-center justify-between border-b pb-3 border-black/5 dark:border-white/5">
              <div>
                <p className="text-xs font-semibold">Appearance Theme</p>
                <p className="text-[10px] text-gray-500">Switch editor theme interface</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="text-[10px] px-3 font-semibold transition-all border-black/10 dark:border-white/10"
              >
                {darkMode ? 'Switch to Light' : 'Switch to Dark'}
              </Button>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-normal font-normal">
                Quick Capture toggles anywhere on your Arch system via <kbd className="font-mono bg-black/20 dark:bg-white/10 px-1.5 rounded">Ctrl+Shift+Space</kbd>.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowSettings(false)}
            className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  )
}
