import { Suspense, lazy, useEffect, useState, useMemo, useRef } from 'react'
import { Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import Onboarding from './components/Onboarding'
import QuickCapture from './components/QuickCapture'
import SettingsPanel from './components/SettingsPanel'
import MobileView from './components/MobileView'
import FolderDialog from './components/FolderDialog'
import WorkspaceSidebar from './components/WorkspaceSidebar'
import HomeDashboard from './components/HomeDashboard'
import AIChatPanel from './components/AIChatPanel'
import EditorShell from './components/EditorShell'
import TrashView from './components/TrashView'
import { getAPI } from './tauri-bridge'
import { filterNotesWithFuse } from './lib/search'

// State Store
import { useNotesStore } from './store/useNotesStore'
const CommandPalette = lazy(() => import('./components/CommandPalette'))
const GlobalSearch = lazy(() => import('./components/GlobalSearch'))
const GraphView = lazy(() => import('./components/GraphView'))

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

function MainApp() {
  // State bindings from Zustand Store
  const {
    notes,
    selectedNoteId,
    searchQuery,
    activeFolder,
    selectedTag,
    isCommandPaletteOpen,
    isGlobalSearchOpen,
    isZenMode,
    folders,
    recentNoteIds,
    initApp,
    setSelectedNoteId,
    setSearchQuery,
    toggleSidebar,
    setCommandPaletteOpen,
    setGlobalSearchOpen,
    createNote,
    createDailyNote,
    togglePin,
    colorTheme,
    deleteNote,
    restoreNote,
    emptyTrash,
    noteSort,
    mainView,
    isAIPanelOpen,
    toggleAIPanel,
  } = useNotesStore()

  const [showSettings, setShowSettings] = useState(false)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initApp()
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

  // Apply color theme
  useEffect(() => {
    const root = window.document.documentElement
    root.setAttribute('data-theme', colorTheme)
  }, [colorTheme])

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

      if (activeFolder === 'recent') {
        return recentNoteIds.includes(note.id)
      }

      if (folders.some((f) => f.id === activeFolder)) {
        return note.folder === activeFolder
      }

      return true
    })
  }, [notes, activeFolder, selectedTag, recentNoteIds, folders])

  const filteredNotes = useMemo(() => {
    return filterNotesWithFuse(folderFilteredNotes, searchQuery)
  }, [folderFilteredNotes, searchQuery])

  const sortNotes = (list: typeof filteredNotes) => {
    return [...list].sort((a, b) => {
      if (noteSort === 'title') return (a.title || '').localeCompare(b.title || '')
      if (noteSort === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }

  const pinnedNotes = useMemo(() => {
    return sortNotes(filteredNotes.filter((n) => n.isPinned))
  }, [filteredNotes, noteSort])

  const unpinnedNotes = useMemo(() => {
    return sortNotes(filteredNotes.filter((n) => !n.isPinned))
  }, [filteredNotes, noteSort])

  const sortedNotes = useMemo(() => [...pinnedNotes, ...unpinnedNotes], [pinnedNotes, unpinnedNotes])

  // Sync selected note when active view changes (skip on home dashboard)
  useEffect(() => {
    if (mainView === 'home' && activeFolder !== 'trash') return

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
  }, [activeFolder, selectedTag, sortedNotes, selectedNoteId, setSelectedNoteId, mainView])

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
      // 7.5. Ctrl + Shift + B (Toggle AI panel)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'b') {
        e.preventDefault()
        toggleAIPanel()
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
  const api = getAPI()
  const handleWinMin = () => api?.minimize()
  const handleWinMax = () => api?.maximize()
  const handleWinClose = () => api?.close()



  const showTitleBar = !isZenMode
  const trashNotes = useMemo(
    () => sortedNotes.filter((n) => n.folder === 'trash'),
    [sortedNotes]
  )

  return (
    <div
      className={cn(
        'relative flex flex-col h-screen w-screen overflow-hidden text-foreground',
        darkMode && 'dark',
        'bg-[#e8ecef] dark:bg-background'
      )}
    >
      {/* Window title bar */}
      {showTitleBar && (
        <div className="fixed inset-x-0 top-0 z-50 flex h-8 items-center border-b border-border/30 bg-background/80 backdrop-blur-md drag-region">
          <div className="flex items-center gap-2 pl-4 no-drag shrink-0">
            <button
              onClick={handleWinClose}
              className="size-3 rounded-full bg-[#ff5f56] hover:bg-[#e04f46] flex items-center justify-center group transition-all cursor-default"
              title="Close"
            >
              <span className="text-[7px] text-[#4c0002] font-bold opacity-0 group-hover:opacity-100 select-none">✕</span>
            </button>
            <button
              onClick={handleWinMin}
              className="size-3 rounded-full bg-[#ffbd2e] hover:bg-[#e0a324] flex items-center justify-center group transition-all cursor-default"
              title="Minimize"
            >
              <span className="text-[7px] text-[#5c3e00] font-bold opacity-0 group-hover:opacity-100 select-none">−</span>
            </button>
            <button
              onClick={handleWinMax}
              className="size-3 rounded-full bg-[#27c93f] hover:bg-[#1aab2f] flex items-center justify-center group transition-all cursor-default"
              title="Maximize"
            >
              <span className="text-[7px] text-[#004d05] font-bold opacity-0 group-hover:opacity-100 select-none">⤢</span>
            </button>
          </div>
        </div>
      )}

      {/* Cansaas 3-column layout */}
      <div
        className={cn(
          'flex flex-1 min-h-0 w-full overflow-hidden gap-0 p-2',
          showTitleBar ? 'pt-10' : 'pt-2'
        )}
      >
        {!isZenMode && (
          <div className="shrink-0 rounded-xl overflow-hidden shadow-sm border border-border/30 bg-card/80">
            <WorkspaceSidebar
              onOpenSettings={() => setShowSettings(true)}
              onNewFolder={() => setShowFolderDialog(true)}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          </div>
        )}

        <main
          className={cn(
            'flex flex-1 min-w-0 flex-col overflow-hidden rounded-xl',
            'border border-border/30 bg-card/90 shadow-sm mx-2',
            isZenMode && 'mx-0 rounded-none border-0'
          )}
        >
          {isZenMode ? (
            <EditorShell />
          ) : activeFolder === 'trash' ? (
            <TrashView
              notes={trashNotes}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onEmptyTrash={() => setShowEmptyTrashConfirm(true)}
              onRestore={restoreNote}
              onDelete={deleteNote}
              formatRelativeTime={formatRelativeTime}
            />
          ) : mainView === 'home' ? (
            <HomeDashboard />
          ) : (
            <EditorShell />
          )}
        </main>

        {!isZenMode && isAIPanelOpen && activeFolder !== 'trash' && (
          <div className="w-[min(340px,28vw)] shrink-0 rounded-xl overflow-hidden shadow-sm border border-border/30">
            <AIChatPanel onClose={toggleAIPanel} />
          </div>
        )}

        {!isZenMode && !isAIPanelOpen && activeFolder !== 'trash' && (
          <Button
            variant="outline"
            size="icon-sm"
            className="fixed bottom-6 right-6 z-30 rounded-full shadow-lg size-10"
            onClick={toggleAIPanel}
            title="Open AI panel"
          >
            <Sparkles className="size-4 text-primary" />
          </Button>
        )}
      </div>

      {/* OVERLAY MENUS & ONBOARDINGS */}
      <Suspense fallback={null}>
        {isCommandPaletteOpen && <CommandPalette />}
        {isGlobalSearchOpen && <GlobalSearch />}
        <GraphView />
      </Suspense>
      <Onboarding />

      <SettingsPanel
        open={showSettings}
        onOpenChange={setShowSettings}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <FolderDialog open={showFolderDialog} onOpenChange={setShowFolderDialog} />

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

export default function App() {
  const hash = window.location.hash
  if (hash === '#quick-capture') return <QuickCapture />
  if (hash === '#mobile') return <MobileView />
  return <MainApp />
}
