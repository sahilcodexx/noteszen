import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import Onboarding from './components/Onboarding'
import QuickCapture from './components/QuickCapture'
import MobileView from './components/MobileView'
import FolderDialog from './components/FolderDialog'
import WorkspaceSidebar from './components/WorkspaceSidebar'
import HomeDashboard from './components/HomeDashboard'
import { getAPI } from './tauri-bridge'
import { filterNotesWithFuse } from './lib/search'
import { filterNotesByContext } from './lib/note-filters'

import { useNotesStore } from './store/useNotesStore'
const AIChatPanel = lazy(() => import('./components/AIChatPanel'))
const CommandPalette = lazy(() => import('./components/CommandPalette'))
const EditorShell = lazy(() => import('./components/EditorShell'))
const GlobalSearch = lazy(() => import('./components/GlobalSearch'))
const GraphView = lazy(() => import('./components/GraphView'))
const SettingsPanel = lazy(() => import('./components/SettingsPanel'))
const TrashView = lazy(() => import('./components/TrashView'))

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return 'some time ago'
  }
}

function MainApp() {
  const {
    notes,
    selectedNoteId,
    searchQuery,
    activeFolder,
    selectedTag,
    isCommandPaletteOpen,
    isGlobalSearchOpen,
    isGraphViewOpen,
    isZenMode,
    isSidebarCollapsed,
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
    deleteNote,
    restoreNote,
    emptyTrash,
    noteSort,
    mainView,
    isAIPanelOpen,
    aiPanelWidth,
    setAIPanelWidth,
    toggleAIPanel,
    openNote,
    isDarkMode,
    toggleDarkMode,
  } = useNotesStore()

  const [showSettings, setShowSettings] = useState(false)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false)
  const [isResizingAIPanel, setIsResizingAIPanel] = useState(false)

  const startAIPanelResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = aiPanelWidth

      const onMove = (ev: MouseEvent) => {
        setAIPanelWidth(startWidth + (startX - ev.clientX))
      }

      const onUp = () => {
        setIsResizingAIPanel(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      setIsResizingAIPanel(true)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [aiPanelWidth, setAIPanelWidth]
  )

  useEffect(() => {
    initApp()
  }, [initApp])

  const folderFilteredNotes = useMemo(
    () =>
      filterNotesByContext(notes, {
        activeFolder,
        selectedTag,
        folders,
        recentNoteIds,
      }),
    [notes, activeFolder, selectedTag, recentNoteIds, folders]
  )

  const filteredNotes = useMemo(
    () => filterNotesWithFuse(folderFilteredNotes, searchQuery),
    [folderFilteredNotes, searchQuery]
  )

  const sortNotes = (list: typeof filteredNotes) =>
    [...list].sort((a, b) => {
      if (noteSort === 'title') return (a.title || '').localeCompare(b.title || '')
      if (noteSort === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  const sortedNotes = useMemo(() => {
    const pinned = sortNotes(filteredNotes.filter((n) => n.isPinned))
    const unpinned = sortNotes(filteredNotes.filter((n) => !n.isPinned))
    return [...pinned, ...unpinned]
  }, [filteredNotes, noteSort])

  useEffect(() => {
    if (mainView === 'home' && activeFolder !== 'trash') return

    if (activeFolder === 'trash' || activeFolder === 'archive') {
      const inView = sortedNotes.some((n) => n.id === selectedNoteId)
      if (!inView) {
        setSelectedNoteId(sortedNotes.length > 0 ? sortedNotes[0].id : null)
      }
      return
    }

    if (sortedNotes.length > 0) {
      const inView = sortedNotes.some((n) => n.id === selectedNoteId)
      if (!inView) setSelectedNoteId(sortedNotes[0].id)
    } else if (selectedNoteId !== null) {
      setSelectedNoteId(null)
    }
  }, [activeFolder, selectedTag, sortedNotes, selectedNoteId, setSelectedNoteId, mainView])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        createNote()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!isCommandPaletteOpen)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('noteszen:focus-search'))
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault()
        setGlobalSearchOpen(!isGlobalSearchOpen)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        createDailyNote()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        if (selectedNoteId) togglePin(selectedNoteId)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
        e.preventDefault()
        toggleSidebar()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'b') {
        e.preventDefault()
        toggleAIPanel()
      }
      if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault()
        const activeIndex = sortedNotes.findIndex((n) => n.id === selectedNoteId)
        if (activeIndex === -1) return
        const nextIndex =
          e.key === 'ArrowDown'
            ? (activeIndex + 1) % sortedNotes.length
            : (activeIndex - 1 + sortedNotes.length) % sortedNotes.length
        const nextNote = sortedNotes[nextIndex]
        if (nextNote) openNote(nextNote.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    notes,
    selectedNoteId,
    sortedNotes,
    isCommandPaletteOpen,
    isGlobalSearchOpen,
    createNote,
    createDailyNote,
    togglePin,
    toggleSidebar,
    toggleAIPanel,
    openNote,
    setCommandPaletteOpen,
    setGlobalSearchOpen,
  ])

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
    <div className="relative flex flex-col h-screen w-screen overflow-hidden text-foreground workspace-shell">
      {showTitleBar && (
        <div className="fixed inset-x-0 top-0 z-50 flex h-8 items-center border-b border-border/30 bg-card/90 backdrop-blur-md drag-region">
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

      <div
        className={cn(
          'flex min-h-0 flex-1 w-full items-stretch overflow-hidden gap-1.5 p-1.5',
          showTitleBar ? 'pt-10' : 'pt-2'
        )}
      >
        {!isZenMode && !isSidebarCollapsed && (
          <div className="workspace-panel min-h-0 shrink-0 self-stretch w-[210px] !bg-sidebar">
            <WorkspaceSidebar
              onOpenSettings={() => setShowSettings(true)}
              onNewFolder={() => setShowFolderDialog(true)}
              onToggleDarkMode={toggleDarkMode}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        <main
          className={cn(
            'workspace-panel workspace-canvas flex min-h-0 flex-1 min-w-0 self-stretch flex-col',
            isZenMode && 'rounded-none border-0'
          )}
        >
          {isZenMode ? (
            <Suspense fallback={null}>
              <EditorShell
                sidebarCollapsed={isSidebarCollapsed}
                onExpandSidebar={toggleSidebar}
              />
            </Suspense>
          ) : activeFolder === 'trash' ? (
            <Suspense fallback={null}>
              <TrashView
                notes={trashNotes}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onEmptyTrash={() => setShowEmptyTrashConfirm(true)}
                onRestore={restoreNote}
                onDelete={deleteNote}
                formatRelativeTime={formatRelativeTime}
              />
            </Suspense>
          ) : mainView === 'home' ? (
            <HomeDashboard
              notes={folderFilteredNotes}
              sidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />
          ) : (
            <Suspense fallback={null}>
              <EditorShell
                sidebarCollapsed={isSidebarCollapsed}
                onExpandSidebar={toggleSidebar}
              />
            </Suspense>
          )}
        </main>

        {!isZenMode && isAIPanelOpen && activeFolder !== 'trash' && (
          <div
            className={cn(
              'workspace-panel relative min-h-0 shrink-0 self-stretch',
              isResizingAIPanel && 'select-none'
            )}
            style={{ width: aiPanelWidth }}
          >
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize AI panel"
              className="absolute left-0 top-0 bottom-0 z-10 w-1.5 -translate-x-1/2 cursor-col-resize hover:bg-primary/25 active:bg-primary/40 transition-colors"
              onMouseDown={startAIPanelResize}
            />
            <Suspense fallback={null}>
              <AIChatPanel onClose={toggleAIPanel} />
            </Suspense>
          </div>
        )}

        {!isZenMode && !isAIPanelOpen && activeFolder !== 'trash' && (
          <Button
            variant="outline"
            size="icon-sm"
            className="fixed bottom-6 right-6 z-30 rounded-full shadow-lg size-10 bg-card"
            onClick={toggleAIPanel}
            title="Open AI panel (Ctrl+Shift+B)"
          >
            <Sparkles className="size-4 text-primary" />
          </Button>
        )}
      </div>

      <Suspense fallback={null}>
        {isCommandPaletteOpen && <CommandPalette />}
        {isGlobalSearchOpen && <GlobalSearch />}
        {isGraphViewOpen && <GraphView />}
      </Suspense>
      <Onboarding />

      {showSettings && (
        <Suspense fallback={null}>
          <SettingsPanel open={showSettings} onOpenChange={setShowSettings} />
        </Suspense>
      )}

      <FolderDialog open={showFolderDialog} onOpenChange={setShowFolderDialog} />

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
            <Button variant="outline" size="sm" onClick={() => setShowEmptyTrashConfirm(false)}>
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
