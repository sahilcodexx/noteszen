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
  ChevronLeft,
  ChevronRight,
  Info,
  Command,
  X,
  CheckCircle,
  RotateCcw,
  Menu
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// App Components
import Editor from './components/Editor'
import CommandPalette from './components/CommandPalette'
import GlobalSearch from './components/GlobalSearch'
import Onboarding from './components/Onboarding'
import QuickCapture from './components/QuickCapture'

// State Store
import { useNotesStore } from './store/useNotesStore'

// Helper function to format relative times beautifully
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) {
      return 'just now'
    } else if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }
  } catch (e) {
    return 'some time ago'
  }
}

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
    isNoteListCollapsed,
    isCommandPaletteOpen,
    isGlobalSearchOpen,
    saveStatus,
    fetchNotes,
    setSelectedNoteId,
    setSearchQuery,
    setActiveFolder,
    setSelectedTag,
    toggleSidebar,
    toggleNoteList,
    setCommandPaletteOpen,
    setGlobalSearchOpen,
    createNote,
    createDailyNote,
    togglePin,
    toggleFavorite,
    toggleArchive,
    deleteNote,
    restoreNote,
    updateNote,
    emptyTrash
  } = useNotesStore()

  // Local React states
  const [tagFilterInput, setTagFilterInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false)
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

  // Sync selected note when active view changes
  useEffect(() => {
    if (activeFolder === 'trash' || activeFolder === 'archive') {
      const isCurrentNoteInView = sortedNotes.some(n => n.id === selectedNoteId)
      if (!isCurrentNoteInView) {
        setSelectedNoteId(sortedNotes.length > 0 ? sortedNotes[0].id : null)
      }
      return
    }

    if (sortedNotes.length > 0) {
      const isCurrentNoteInView = sortedNotes.some(n => n.id === selectedNoteId)
      if (!isCurrentNoteInView) {
        setSelectedNoteId(sortedNotes[0].id)
      }
    } else {
      if (selectedNoteId !== null) {
        setSelectedNoteId(null)
      }
    }
  }, [activeFolder, selectedTag, sortedNotes, selectedNoteId, setSelectedNoteId])

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
        e.preventDefault()
        toggleSidebar()
      }
      // 7.5. Ctrl + Shift + B (Toggle Note List expand)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'b') {
        e.preventDefault()
        toggleNoteList()
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
    <div className={`flex h-screen w-screen overflow-hidden bg-background text-foreground ${darkMode ? 'dark' : ''}`}>
      
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <aside 
        className={cn(
          "flex flex-col border-r border-border shrink-0 drag-region transition-all duration-300 backdrop-blur-md bg-sidebar overflow-hidden",
          isSidebarCollapsed ? 'w-[80px]' : 'w-[220px]'
        )}
      >
        {/* macOS Custom Traffic lights window triggers */}
        <div className="h-12 flex items-center pl-5 gap-2 no-drag shrink-0">
          <button 
            onClick={handleWinClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#e04f46] flex items-center justify-center group transition-all cursor-default"
            title="Close"
          >
            <span className="text-[7px] text-[#4c0002] font-bold opacity-0 group-hover:opacity-100 select-none">✕</span>
          </button>
          <button 
            onClick={handleWinMin}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#e0a324] flex items-center justify-center group transition-all cursor-default"
            title="Minimize"
          >
            <span className="text-[7px] text-[#5c3e00] font-bold opacity-0 group-hover:opacity-100 select-none">−</span>
          </button>
          <button 
            onClick={handleWinMax}
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#1aab2f] flex items-center justify-center group transition-all cursor-default"
            title="Maximize"
          >
            <span className="text-[7px] text-[#004d05] font-bold opacity-0 group-hover:opacity-100 select-none">⤢</span>
          </button>
        </div>

        {/* Brand header title */}
        <div className={cn(
          "py-1.5 flex items-center no-drag transition-all duration-300",
          isSidebarCollapsed ? 'px-1 justify-center' : 'px-4 justify-between'
        )}>
          {isSidebarCollapsed ? (
            <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-sans tracking-tight animate-in fade-in duration-200">
              NZ
            </span>
          ) : (
            <span className="text-base font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-sans tracking-tight animate-in fade-in duration-200">
              NotesZen
            </span>
          )}
        </div>

        {/* Sidebar Nav Actions (Shadcn Custom Scroll Container) */}
        <ScrollArea className="flex-grow px-2 py-3 space-y-1.5 no-drag select-none scrollbar-none">
          {!isSidebarCollapsed && (
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-3 mb-2 animate-in fade-in duration-200">Views</p>
          )}
          
          <div className="space-y-1">
            {[
              { id: 'notes', name: 'Notes', icon: FileText, color: 'text-primary' },
              { id: 'favorites', name: 'Favorites', icon: Star, color: 'text-amber-500' },
              { id: 'daily', name: 'Daily Notes', icon: Calendar, color: 'text-emerald-500' },
              { id: 'archive', name: 'Archive', icon: Archive, color: 'text-indigo-500' },
              { id: 'trash', name: 'Trash', icon: Trash2, color: 'text-destructive' }
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
                  variant={isSelected ? 'secondary' : 'ghost'}
                  onClick={() => setActiveFolder(folder.id)}
                  className={cn(
                    "w-full flex items-center h-8 rounded-lg text-xs font-medium transition-all group/item",
                    isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                  )}
                  title={isSidebarCollapsed ? folder.name : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-3.5 h-3.5 shrink-0", isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    {!isSidebarCollapsed && (
                      <span className={isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover/item:text-foreground'}>
                        {folder.name}
                      </span>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <Badge 
                      variant={isSelected ? "default" : "secondary"}
                      className="text-[9px] font-medium h-4.5 px-1.5"
                    >
                      {count}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Sidebar Tags view */}
          {allTags.length > 0 && (
            <div className="pt-4 space-y-1">
              {!isSidebarCollapsed && (
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-3 mb-2 animate-in fade-in duration-200">Tags</p>
              )}
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag
                const tagCount = notes.filter(n => n.folder !== 'trash' && n.tags && n.tags.includes(tag)).length
                
                return (
                  <Button
                    key={tag}
                    variant={isSelected ? 'secondary' : 'ghost'}
                    onClick={() => setSelectedTag(tag)}
                    className={cn(
                      "w-full flex items-center h-8 rounded-lg text-xs font-medium transition-all group/item",
                      isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                    )}
                    title={isSidebarCollapsed ? tag : undefined}
                  >
                    <div className="flex items-center gap-2.5">
                      <Tag className={cn("w-3.5 h-3.5 shrink-0", isSelected ? 'text-primary' : 'text-muted-foreground')} />
                      {!isSidebarCollapsed && (
                        <span className={isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover/item:text-foreground truncate max-w-[120px]'}>
                          {tag}
                        </span>
                      )}
                    </div>
                    {!isSidebarCollapsed && (
                      <Badge 
                        variant={isSelected ? "default" : "secondary"}
                        className="text-[9px] font-medium h-4.5 px-1.5"
                      >
                        {tagCount}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Sidebar settings controls */}
        <div className={cn(
          "p-4 border-t border-border/40 no-drag flex shrink-0 select-none bg-sidebar/80 backdrop-blur-md transition-all duration-300",
          isSidebarCollapsed ? 'flex-col items-center gap-3 px-2 py-4' : 'flex-row items-center justify-between'
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="text-muted-foreground hover:text-foreground shrink-0"
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size={isSidebarCollapsed ? "icon" : "default"}
            onClick={() => setShowSettings(true)}
            className="text-muted-foreground hover:text-foreground shrink-0"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            {!isSidebarCollapsed && <span>Settings</span>}
          </Button>
        </div>
      </aside>
      {activeFolder === 'trash' ? (
        <main className="flex-grow flex flex-col min-w-0 bg-background">
          {/* Trash Header Controls */}
          <div className="h-14 px-6 border-b border-border/40 flex items-center justify-between shrink-0 select-none bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {/* Collapse / Expand Toggle */}
              {isSidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  title="Expand Sidebar"
                >
                  <ChevronRight data-icon="inline-start" />
                </Button>
              )}
              {!isSidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  title="Collapse Sidebar"
                >
                  <ChevronLeft data-icon="inline-start" />
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-destructive" />
                <h1 className="text-sm font-bold text-foreground">Trash Bin</h1>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  {sortedNotes.length} {sortedNotes.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Local Search inside Trash */}
              <div className="relative w-48 md:w-64 flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground/75" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search in trash..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 h-8 text-xs border border-border/60 rounded-lg bg-card/45 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/50 text-foreground placeholder-muted-foreground/80 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {sortedNotes.length > 0 && (
                <Button
                  onClick={() => setShowEmptyTrashConfirm(true)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 data-icon="inline-start" />
                  Empty Trash
                </Button>
              )}
            </div>
          </div>

          {/* Trash Cards Content Grid */}
          <ScrollArea className="flex-grow p-6 animate-in fade-in duration-200">
            {sortedNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 mt-16 select-none text-center">
                <div className="p-4 rounded-full bg-destructive/5 text-destructive/80 mb-4 animate-pulse">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h2 className="text-sm font-bold text-foreground/80 tracking-tight">Trash is empty</h2>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                  Notes you delete will appear here. Trashed notes can be restored or permanently deleted.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                {sortedNotes.map((note) => {
                  const previewText = note.content
                    ? note.content.replace(/<[^>]*>/g, '').replace(/[#*`>_\-]/g, '').trim().substring(0, 160)
                    : 'No additional text'
                  const formattedDate = formatRelativeTime(note.updatedAt)

                  return (
                    <div
                      key={note.id}
                      className="group relative flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:bg-card/75 hover:border-destructive/30 hover:scale-[1.01] hover:shadow-md transition-all duration-200"
                    >
                      <div className="mb-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-xs text-foreground/95 line-clamp-1 flex-grow">
                            {note.title || 'Untitled Note'}
                          </h3>
                          <span className="text-[9px] text-muted-foreground/80 font-medium shrink-0 mt-0.5">
                            {formattedDate}
                          </span>
                        </div>
                        
                        <p className="text-[11px] line-clamp-4 text-muted-foreground leading-normal font-normal break-words">
                          {previewText}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 mt-auto">
                        {/* Tags inside card if any */}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {note.tags.slice(0, 3).map(tag => (
                              <Badge 
                                key={tag}
                                variant="secondary"
                                className="text-[8px] h-4 px-1.5 rounded truncate"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1.5 border-t border-border/40 pt-3">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => restoreNote(note.id)}
                          >
                            <RotateCcw data-icon="inline-start" />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="xs"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 data-icon="inline-start" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </main>
      ) : (
        <>
          {/* 3. MAIN EDITOR PANEL */}
          <main className="flex-grow flex flex-col min-w-0 bg-background">
            
            {/* Editor panel toolbar */}
            <div className="h-14 px-6 border-b border-border/40 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-3">
                {/* Collapse / Expand Toggle */}
                {isSidebarCollapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="text-muted-foreground hover:text-foreground"
                    title="Expand Sidebar"
                  >
                    <ChevronRight data-icon="inline-start" />
                  </Button>
                )}
                {!isSidebarCollapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="text-muted-foreground hover:text-foreground"
                    title="Collapse Sidebar"
                  >
                    <ChevronLeft data-icon="inline-start" />
                  </Button>
                )}

                {/* Auto-save indicators */}
                {activeNote && (
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
                    {saveStatus === 'saving' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                        Autosaving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-primary/80" />
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
                  title="Command Palette (⌘K)"
                >
                  <Command data-icon="inline-start" />
                  <kbd className="font-mono text-[9px] bg-secondary/80 px-1 rounded ml-1">⌘K</kbd>
                </Button>

                {activeNote && activeNote.folder !== 'trash' && (
                  <>
                    {/* Pin note */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => togglePin(activeNote.id)}
                      className={cn(
                        activeNote.isPinned 
                          ? "text-primary bg-primary/10 hover:bg-primary/20" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Pin Note (⌘P)"
                    >
                      <Pin className={cn(activeNote.isPinned && "fill-primary")} data-icon="inline-start" />
                    </Button>

                    {/* Favorite Note */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleFavorite(activeNote.id)}
                      className={cn(
                        activeNote.isFavorite 
                          ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Favorite Note"
                    >
                      <Star className={cn(activeNote.isFavorite && "fill-amber-500")} data-icon="inline-start" />
                    </Button>

                    {/* Archive Note */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleArchive(activeNote.id)}
                      className={cn(
                        activeNote.isArchived 
                          ? "text-primary bg-primary/10 hover:bg-primary/20" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Archive Note"
                    >
                      <Archive className={cn(activeNote.isArchived && "fill-primary")} data-icon="inline-start" />
                    </Button>
                  </>
                )}

                {/* Toggle Note List (Right Sidebar) */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleNoteList}
                  className="text-muted-foreground hover:text-foreground"
                  title={isNoteListCollapsed ? "Expand Note List (⌘⇧B)" : "Collapse Note List (⌘⇧B)"}
                >
                  {isNoteListCollapsed ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Note Editor Area */}
            {activeNote ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {activeNote.folder === 'trash' && (
                  <div className="bg-destructive/10 border-b border-destructive/20 px-10 py-2.5 flex items-center justify-between text-destructive text-xs select-none shrink-0 animate-in slide-in-from-top duration-200 font-semibold">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-destructive/80 animate-pulse" />
                      <span>This note is in the Trash. Restore it to edit.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        size="xs" 
                        variant="outline" 
                        onClick={() => restoreNote(activeNote.id)}
                      >
                        Restore
                      </Button>
                      <Button 
                        size="xs" 
                        variant="destructive" 
                        onClick={() => deleteNote(activeNote.id)}
                      >
                        Delete Permanently
                      </Button>
                    </div>
                  </div>
                )}

                {/* Big Note Title Input */}
                <div className="px-10 pt-8 pb-3 shrink-0">
                  <input
                    type="text"
                    placeholder="Untitled Note"
                    value={activeNote.title}
                    onChange={(e: any) => updateNote(activeNote.id, { title: e.target.value })}
                    disabled={activeNote.folder === 'trash'}
                    className="w-full bg-transparent text-2xl font-bold border-0 shadow-none outline-none placeholder-muted-foreground/50 focus:ring-0 focus:ring-offset-0 p-0 text-foreground tracking-tight"
                  />

                  {/* Tags editor row */}
                  <div className="flex items-center flex-wrap gap-1.5 mt-3 select-none">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground/60" />
                    {activeNote.tags && activeNote.tags.map(t => (
                      <span 
                        key={t}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/10"
                      >
                        {t}
                        {activeNote.folder !== 'trash' && (
                          <button 
                            onClick={() => handleRemoveTagFromActiveNote(t)}
                            className="hover:text-primary/70 transition-colors"
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
                          className="border-none bg-transparent text-[11px] text-muted-foreground outline-none w-16 focus:w-24 transition-all focus:ring-0 placeholder-muted-foreground/60 py-0"
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
                <h2 className="text-sm font-bold text-foreground/80 tracking-tight mb-6">Create a new note</h2>

                <div className="w-[320px] border border-border/50 rounded-xl bg-card p-5 flex flex-col gap-3 text-xs text-muted-foreground shadow-sm animate-in fade-in duration-300">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="font-medium text-foreground/80">New Note</span>
                    <kbd className="font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded text-[11px] shadow-xs">⌘N</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="font-medium text-foreground/80">Daily Note</span>
                    <kbd className="font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded text-[11px] shadow-xs">⌘D</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="font-medium text-foreground/80">Command Palette</span>
                    <kbd className="font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded text-[11px] shadow-xs">⌘K</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="font-medium text-foreground/80">Global Search</span>
                    <kbd className="font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded text-[11px] shadow-xs">⌘⇧F</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="font-medium text-foreground/80">Toggle Sidebar</span>
                    <kbd className="font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded text-[11px] shadow-xs">⌘B</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="font-medium text-foreground/80">Toggle Note List</span>
                    <kbd className="font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded text-[11px] shadow-xs">⌘⇧B</kbd>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* 2. NOTE LIST PANEL */}
          <section className={cn(
            "flex flex-col border-l border-border shrink-0 bg-background/50 backdrop-blur-sm transition-all duration-300",
            isNoteListCollapsed ? "w-0 opacity-0 border-l-0 overflow-hidden" : "w-[270px] opacity-100 animate-in slide-in-from-right duration-200"
          )}>
            
            {/* Note List Header controls */}
            <div className="h-14 px-4 flex items-center gap-2 border-b border-border/40 shrink-0 select-none">
              <div className="relative flex-grow flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground/75" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 h-8 text-xs border border-border/60 rounded-lg bg-card/45 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/50 text-foreground placeholder-muted-foreground/80 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <Button
                onClick={() => createNote()}
                size="icon"
                title="Create Note"
              >
                <Plus data-icon="inline-start" />
              </Button>
            </div>

            {/* Note List Items (Shadcn Scroll Area) */}
            <ScrollArea className="flex-grow py-2">
              {sortedNotes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground/60 mt-12 select-none">
                  <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-55" />
                  <p className="text-xs font-bold text-foreground/80">No notes found</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Press ⌘N to make a new note</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1 px-2">
                  {sortedNotes.map((note) => {
                    const isSelected = note.id === selectedNoteId
                    const previewText = note.content
                      ? note.content.replace(/<[^>]*>/g, '').replace(/[#*`>_\-]/g, '').trim().substring(0, 80)
                      : 'No additional text'
                    
                    const formattedDate = formatRelativeTime(note.updatedAt)

                    return (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNoteId(note.id)}
                        className={cn(
                          "p-3 cursor-pointer relative transition-all rounded-lg border flex flex-col gap-1.5",
                          isSelected 
                            ? "bg-card border-border shadow-xs scale-[1.01]" 
                            : "border-transparent bg-transparent hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-start justify-between gap-1 mb-0.5">
                          <h3 className={cn(
                            "font-semibold text-xs truncate flex-grow",
                            isSelected ? "text-primary" : "text-foreground/90"
                          )}>
                            {note.title || 'Untitled Note'}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0 select-none">
                            {note.isPinned && (
                              <Pin className="w-3 h-3 text-primary fill-primary" />
                            )}
                            
                            {activeFolder !== 'trash' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNote(note.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 w-4 h-4 text-muted-foreground hover:text-destructive transition-opacity flex items-center justify-center"
                                title="Move to Trash"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] line-clamp-2 text-muted-foreground leading-normal font-normal">
                          {previewText}
                        </p>

                        <div className="flex items-center justify-between select-none mt-1">
                          <span className="text-[9px] text-muted-foreground/80 font-medium">
                            {formattedDate}
                          </span>

                          {/* Tag list within item card */}
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex gap-1 max-w-[120px] overflow-hidden">
                              {note.tags.slice(0, 2).map(tag => (
                                <Badge 
                                  key={tag}
                                  variant={isSelected ? "outline" : "secondary"}
                                  className="text-[8px] h-4 px-1 rounded truncate"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </section>
        </>
      )}

      {/* OVERLAY MENUS & ONBOARDINGS */}
      <CommandPalette />
      <GlobalSearch />
      <Onboarding />

      {/* Settings Modal (Shadcn Dialog Component overlay) */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-[450px] border shadow-2xl flex flex-col no-drag">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 select-none">
              <Settings className="w-5 h-5 text-primary" />
              NotesZen Preferences
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 select-none">
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div>
                <p className="text-xs font-semibold">Local SQLite File Sync</p>
                <p className="text-[10px] text-muted-foreground">
                  {window.electronAPI ? 'Offline SQLite Database active' : 'Web storage caching active'}
                </p>
              </div>
              <Badge variant={window.electronAPI ? "default" : "outline"} className="text-[9px] font-bold">
                {window.electronAPI ? 'SQLITE STORAGE' : 'WEB FALLBACK'}
              </Badge>
            </div>

            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div>
                <p className="text-xs font-semibold">Local Data Backup</p>
                <p className="text-[10px] text-muted-foreground">Download backup JSON copy of notes</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLocalBackup}
              >
                Export JSON
              </Button>
            </div>

            <div className="flex items-center justify-between border-b pb-3 border-border">
              <div>
                <p className="text-xs font-semibold">Appearance Theme</p>
                <p className="text-[10px] text-muted-foreground">Switch editor theme interface</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? 'Switch to Light' : 'Switch to Dark'}
              </Button>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted border border-border">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-normal font-normal">
                Quick Capture toggles anywhere on your Arch system via <kbd className="font-mono bg-muted-foreground/20 px-1.5 rounded">Ctrl+Shift+Space</kbd>.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowSettings(false)}
            variant="default"
            className="mt-4 w-full"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* Empty Trash Confirmation Dialog */}
      <Dialog open={showEmptyTrashConfirm} onOpenChange={setShowEmptyTrashConfirm}>
        <DialogContent className="max-w-[400px] border shadow-2xl flex flex-col no-drag">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive select-none">
              <Trash2 className="w-5 h-5 text-destructive" />
              Empty Trash Bin?
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-xs text-muted-foreground select-none leading-relaxed">
            Are you sure you want to permanently delete all items in the Trash? This action cannot be undone and notes will be permanently erased.
          </div>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmptyTrashConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                emptyTrash()
                setShowEmptyTrashConfirm(false)
              }}
            >
              Empty Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
