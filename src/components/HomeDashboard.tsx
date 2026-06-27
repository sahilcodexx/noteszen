import { useEffect, useMemo, useRef } from 'react'
import {
  Lightbulb,
  Search as SearchIcon,
  FileEdit,
  LayoutGrid,
  List,
  Share2,
  Sparkles,
  PanelLeft,
} from 'lucide-react'
import { useNotesStore } from '../store/useNotesStore'
import type { Note } from '../types'
import NoteCard from './NoteCard'
import NewNoteCard from './NewNoteCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { filterNotesWithFuse } from '../lib/search'
import { notify } from '../lib/toast'
import { useLiveClock } from '../hooks/useLiveClock'

const SECTIONS = [
  {
    id: 'ideas' as const,
    title: 'Ideas',
    icon: Lightbulb,
    iconClass: 'text-sky-500',
    match: (n: { status?: string | null; tags: string[] }) =>
      !n.status || n.status === 'draft' || n.tags.includes('idea'),
  },
  {
    id: 'research' as const,
    title: 'Research',
    icon: SearchIcon,
    iconClass: 'text-violet-500',
    match: (n: { status?: string | null; tags: string[] }) =>
      n.status === 'todo' || n.tags.includes('research'),
  },
  {
    id: 'drafts' as const,
    title: 'Drafts',
    icon: FileEdit,
    iconClass: 'text-amber-500',
    match: (n: { status?: string | null }) =>
      n.status === 'in-progress' || n.status === 'completed',
  },
]

function getFolderLabel(activeFolder: string, folders: { id: string; name: string }[]) {
  if (activeFolder === 'favorites') return 'Starred'
  if (activeFolder === 'archive') return 'Archive'
  if (activeFolder === 'daily') return 'Daily Notes'
  if (activeFolder === 'recent') return 'Recent'
  const folder = folders.find((f) => f.id === activeFolder)
  if (folder) return folder.name
  return 'All Notes'
}

interface HomeDashboardProps {
  notes: Note[]
  sidebarCollapsed?: boolean
  onExpandSidebar?: () => void
}

export default function HomeDashboard({
  notes,
  sidebarCollapsed,
  onExpandSidebar,
}: HomeDashboardProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const { time, greeting } = useLiveClock()
  const {
    searchQuery,
    setSearchQuery,
    setGlobalSearchOpen,
    homeViewMode,
    setHomeViewMode,
    openNote,
    createNote,
    deleteNote,
    toggleFavorite,
    vaults,
    activeVaultId,
    activeFolder,
    folders,
    toggleAIPanel,
    isAIPanelOpen,
  } = useNotesStore()

  const workspaceName =
    vaults.find((v) => v.id === activeVaultId)?.name ?? 'Default Vault'
  const folderLabel = getFolderLabel(activeFolder, folders)

  const activeNotes = useMemo(
    () => notes.filter((n) => n.folder !== 'trash' && !n.isArchived),
    [notes]
  )

  const filtered = useMemo(
    () => filterNotesWithFuse(activeNotes, searchQuery),
    [activeNotes, searchQuery]
  )

  const sectionNotes = useMemo(() => {
    const assigned = new Set<string>()
    const result: Record<string, typeof filtered> = { ideas: [], research: [], drafts: [] }

    for (const section of SECTIONS) {
      for (const note of filtered) {
        if (assigned.has(note.id)) continue
        if (section.match(note)) {
          result[section.id].push(note)
          assigned.add(note.id)
        }
      }
    }

    for (const note of filtered) {
      if (!assigned.has(note.id)) result.ideas.push(note)
    }

    return result
  }, [filtered])

  useEffect(() => {
    const handler = () => searchRef.current?.focus()
    window.addEventListener('noteszen:focus-search', handler)
    return () => window.removeEventListener('noteszen:focus-search', handler)
  }, [])

  const handleNewInSection = (sectionId: 'ideas' | 'research' | 'drafts') => {
    const statusMap = { ideas: 'draft', research: 'todo', drafts: 'in-progress' } as const
    const tagsMap = { ideas: ['idea'], research: ['research'], drafts: [] } as const
    createNote({
      status: statusMap[sectionId],
      tags: [...tagsMap[sectionId]],
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      <div className="shrink-0 px-8 pt-7 pb-5 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3 min-w-0">
            {sidebarCollapsed && onExpandSidebar && (
              <Button
                variant="outline"
                size="icon-sm"
                className="size-8 shrink-0 mt-0.5 rounded-lg border-border"
                onClick={onExpandSidebar}
                title="Show sidebar (Ctrl+B)"
              >
                <PanelLeft className="size-4" />
              </Button>
            )}
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                {workspaceName} · {folderLabel}
              </p>
              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-0.5 mt-1">
                <h1 className="text-[26px] font-semibold tracking-tight leading-tight">
                  {greeting} 👋
                </h1>
                <span className="text-sm text-muted-foreground tabular-nums font-medium">
                  {time}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => notify.info('Sharing coming soon')}
            >
              <Share2 className="size-3.5" />
              Share
            </Button>
            <div className="flex items-center rounded-lg border border-border p-0.5">
              <Button
                variant={homeViewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setHomeViewMode('grid')}
              >
                <LayoutGrid className="size-3.5" />
              </Button>
              <Button
                variant={homeViewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={() => setHomeViewMode('list')}
              >
                <List className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search something or use AI"
            className="pl-10 pr-10 h-11 rounded-xl bg-muted border-border text-sm shadow-none"
          />
          <button
            type="button"
            onClick={() => {
              if (!isAIPanelOpen) toggleAIPanel()
              else setGlobalSearchOpen(true)
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition-colors"
            title="Open AI or global search"
          >
            <Sparkles className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-none">
        {filtered.length === 0 && !searchQuery ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
            <p className="text-sm font-medium text-muted-foreground">No notes here yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1 mb-6">
              Start with an idea, research note, or draft
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {SECTIONS.map((section) => (
                <NewNoteCard
                  key={section.id}
                  layout="grid"
                  label={`New ${section.title.toLowerCase().slice(0, -1)}`}
                  onClick={() => handleNewInSection(section.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-5xl">
            {SECTIONS.map((section) => {
              const Icon = section.icon
              const items = sectionNotes[section.id]
              if (items.length === 0 && searchQuery) return null
              return (
                <section key={section.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn('size-4', section.iconClass)} />
                    <h2 className="text-sm font-semibold">{section.title}</h2>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>

                  <div
                    className={cn(
                      homeViewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
                        : 'flex flex-col gap-2'
                    )}
                  >
                    {items.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        section={section.id}
                        layout={homeViewMode}
                        onOpen={() => openNote(note.id)}
                        onToggleFavorite={() => toggleFavorite(note.id)}
                        onDelete={() => deleteNote(note.id)}
                      />
                    ))}
                    <NewNoteCard
                      layout={homeViewMode}
                      onClick={() => handleNewInSection(section.id)}
                    />
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}