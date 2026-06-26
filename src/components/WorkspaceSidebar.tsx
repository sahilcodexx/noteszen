import { useState } from 'react'
import {
  Star,
  Archive,
  Trash2,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FileText,
  Plus,
} from 'lucide-react'
import { useNotesStore } from '../store/useNotesStore'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import VaultSwitcher from './VaultSwitcher'

interface WorkspaceSidebarProps {
  onOpenSettings: () => void
  onNewFolder: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export default function WorkspaceSidebar({
  onOpenSettings,
  onNewFolder,
}: WorkspaceSidebarProps) {
  const {
    notes,
    activeFolder,
    selectedTag,
    folders,
    recentNoteIds,
    setActiveFolder,
    setSelectedTag,
    goHome,
    openNote,
    createNote,
    vaults,
    activeVaultId,
  } = useNotesStore()

  const [workspacesOpen, setWorkspacesOpen] = useState(true)

  const workspaceName =
    vaults.find((v) => v.id === activeVaultId)?.name ?? 'NotesZen'

  const countFor = (folderId: string) =>
    notes.filter((n) => {
      if (folderId === 'trash') return n.folder === 'trash'
      if (n.folder === 'trash') return false
      if (folderId === 'archive') return n.isArchived
      if (n.isArchived) return false
      if (folderId === 'favorites') return n.isFavorite
      if (folders.some((f) => f.id === folderId)) return n.folder === folderId
      return false
    }).length

  const recentNotes = recentNoteIds
    .map((id) => notes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n && n.folder !== 'trash'))

  const navItem = (id: string, label: string, icon: React.ReactNode, count: number) => {
    const active = activeFolder === id && !selectedTag
    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          setActiveFolder(id)
          setSelectedTag(null)
          goHome()
        }}
        className={cn(
          'w-full flex items-center justify-between h-8 px-3 rounded-lg text-[12px] font-medium transition-colors',
          active
            ? 'bg-primary/10 text-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        )}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        <Badge variant="secondary" className="text-[9px] h-4 min-w-4 px-1">
          {count}
        </Badge>
      </button>
    )
  }

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-border/40 bg-sidebar/90">
      <div className="px-4 py-3 border-b border-border/30">
        <VaultSwitcher collapsed={false} />
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <div className="flex flex-col gap-0.5">
          {navItem('favorites', 'Starred', <Star className="size-3.5 text-amber-500" />, countFor('favorites'))}
          {navItem('archive', 'Archive', <Archive className="size-3.5 text-indigo-500" />, countFor('archive'))}
          {navItem('trash', 'Trash', <Trash2 className="size-3.5 text-destructive" />, countFor('trash'))}

          <button
            type="button"
            className="w-full flex items-center justify-between h-8 px-3 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-muted/60"
          >
            <span className="flex items-center gap-2.5">
              <Bell className="size-3.5" />
              Notifications
            </span>
            <Badge variant="destructive" className="text-[9px] h-4 min-w-4 px-1">
              0
            </Badge>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 h-8 px-3 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <Settings className="size-3.5" />
            Settings
          </button>
        </div>

        {/* Workspaces */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setWorkspacesOpen(!workspacesOpen)}
            className="w-full flex items-center gap-1.5 px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70"
          >
            {workspacesOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            {workspaceName}
          </button>
          {workspacesOpen && (
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setActiveFolder('notes')
                  setSelectedTag(null)
                  goHome()
                }}
                className={cn(
                  'w-full text-left h-8 px-3 pl-6 rounded-lg text-[12px] font-medium truncate',
                  activeFolder === 'notes' && !selectedTag
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60'
                )}
              >
                All Notes
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setActiveFolder(folder.id)
                    setSelectedTag(null)
                    goHome()
                  }}
                  className={cn(
                    'w-full text-left h-8 px-3 pl-6 rounded-lg text-[12px] font-medium truncate',
                    activeFolder === folder.id && !selectedTag
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60'
                  )}
                >
                  {folder.name}
                </button>
              ))}
              <button
                type="button"
                onClick={onNewFolder}
                className="w-full flex items-center gap-2 h-8 px-3 pl-6 rounded-lg text-[11px] text-muted-foreground hover:text-foreground"
              >
                <FolderPlus className="size-3.5" />
                New workspace
              </button>
            </div>
          )}
        </div>

        {/* Recent notes */}
        {recentNotes.length > 0 && (
          <div className="mt-5">
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Recent Notes
            </p>
            <div className="flex flex-col gap-0.5">
              {recentNotes.slice(0, 8).map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => openNote(note.id)}
                  className="w-full flex items-center gap-2 h-8 px-3 rounded-lg text-[11px] text-muted-foreground hover:bg-muted/60 hover:text-foreground text-left"
                >
                  {note.isFavorite && <Star className="size-3 text-amber-500 fill-amber-500 shrink-0" />}
                  {!note.isFavorite && <FileText className="size-3 shrink-0 opacity-50" />}
                  <span className="truncate">{note.title || 'Untitled'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-border/30">
        <Button size="sm" className="w-full gap-1.5" onClick={() => createNote()}>
          <Plus className="size-3.5" />
          New note
        </Button>
      </div>
    </aside>
  )
}