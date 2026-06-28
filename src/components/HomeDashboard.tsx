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
  Plus,
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-8 pt-7 pb-5">
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

        <div className="relative mx-auto w-full max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground/60" />
          <Input
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search something or use AI"
            className="h-9 pl-9 pr-9 rounded-3xl border-border bg-card text-foreground shadow-md"
          />
          <button
            type="button"
            onClick={() => {
              if (!isAIPanelOpen) toggleAIPanel()
              else setGlobalSearchOpen(true)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
            title="Open AI or global search"
          >
            <Sparkles className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-none">
        {filtered.length === 0 && !searchQuery ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-muted-foreground">No notes here yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Start with an idea, research note, or draft
            </p>
            <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
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
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
            {SECTIONS.map((section) => {
              const Icon = section.icon
              const items = sectionNotes[section.id]
              if (items.length === 0) return null
              return (
                <section key={section.id}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('size-4', section.iconClass)} />
                      <h2 className="text-sm font-semibold">{section.title}</h2>
                      <span className="text-xs text-muted-foreground">({items.length})</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNewInSection(section.id)}
                    >
                      <Plus data-icon="inline-start" />
                      New note
                    </Button>
                  </div>

                  <div
                    className={cn(
                      homeViewMode === 'grid'
                        ? 'grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3'
                        : 'flex flex-col gap-3'
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