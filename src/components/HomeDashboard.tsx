import { useMemo } from 'react'
import {
  Lightbulb,
  Search as SearchIcon,
  FileEdit,
  Plus,
  LayoutGrid,
  List,
  Share2,
  Sparkles,
} from 'lucide-react'
import { useNotesStore } from '../store/useNotesStore'
import NoteCard from './NoteCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { filterNotesWithFuse } from '../lib/search'

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

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomeDashboard() {
  const {
    notes,
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
  } = useNotesStore()

  const workspaceName =
    vaults.find((v) => v.id === activeVaultId)?.name ?? 'Default Vault'

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
      if (!assigned.has(note.id)) {
        result.ideas.push(note)
      }
    }

    return result
  }, [filtered])

  const handleNewInSection = (sectionId: 'ideas' | 'research' | 'drafts') => {
    const statusMap = { ideas: 'draft', research: 'todo', drafts: 'in-progress' } as const
    const tagsMap = { ideas: ['idea'], research: ['research'], drafts: [] } as const
    createNote({
      status: statusMap[sectionId],
      tags: [...tagsMap[sectionId]],
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-background">
      <div className="shrink-0 px-8 pt-7 pb-5">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">{workspaceName}</p>
            <h1 className="text-[26px] font-semibold tracking-tight mt-1">
              {getGreeting()} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 border-[#e5e9ec]">
              <Share2 className="size-3.5" />
              Share
            </Button>
            <div className="flex items-center rounded-lg border border-[#e5e9ec] p-0.5">
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setGlobalSearchOpen(true)}
            placeholder="Search something or use AI"
            className="pl-10 pr-10 h-11 rounded-xl bg-[#fafbfc] border-[#e5e9ec] text-sm shadow-none"
          />
          <Sparkles className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-primary/50" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-none">
        <div className="flex flex-col gap-8">
          {SECTIONS.map((section) => {
            const Icon = section.icon
            const items = sectionNotes[section.id]
            return (
              <section key={section.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={cn('size-4', section.iconClass)} />
                  <h2 className="text-sm font-semibold">{section.title}</h2>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>

                {items.length > 0 && (
                  <div
                    className={cn(
                      'mb-3',
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
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleNewInSection(section.id)}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#d5dbe0]',
                    'text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-[#fafbfc]',
                    'transition-colors text-xs font-medium h-11'
                  )}
                >
                  <Plus className="size-4" />
                  New note
                </button>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}