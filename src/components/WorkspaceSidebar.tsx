import {
  Star,
  Archive,
  Trash2,
  Settings,
  FolderPlus,
  Folder,
  FileText,
  Plus,
  Moon,
  Sun,
  PanelLeftClose,
  Inbox,
  MoreHorizontal,
  Trash,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNotesStore } from '../store/useNotesStore'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WorkspaceSidebarProps {
  onOpenSettings: () => void
  onNewFolder: () => void
  onToggleDarkMode: () => void
  isDarkMode: boolean
}

export default function WorkspaceSidebar({
  onOpenSettings,
  onNewFolder,
  onToggleDarkMode,
  isDarkMode,
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
    deleteFolder,
    vaults,
    activeVaultId,
    toggleSidebar,
  } = useNotesStore(
    useShallow((s) => ({
      notes: s.notes,
      activeFolder: s.activeFolder,
      selectedTag: s.selectedTag,
      folders: s.folders,
      recentNoteIds: s.recentNoteIds,
      setActiveFolder: s.setActiveFolder,
      setSelectedTag: s.setSelectedTag,
      goHome: s.goHome,
      openNote: s.openNote,
      createNote: s.createNote,
      deleteFolder: s.deleteFolder,
      vaults: s.vaults,
      activeVaultId: s.activeVaultId,
      toggleSidebar: s.toggleSidebar,
    }))
  )

  const workspaceName =
    vaults.find((v) => v.id === activeVaultId)?.name ?? 'Default Vault'

  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const note of notes) {
      if (note.folder === 'trash') {
        counts.trash = (counts.trash || 0) + 1
        continue
      }
      if (note.isArchived) {
        counts.archive = (counts.archive || 0) + 1
        continue
      }
      counts.notes = (counts.notes || 0) + 1
      if (note.isFavorite) counts.favorites = (counts.favorites || 0) + 1
      if (note.folder && !['notes', 'favorites', 'daily', 'recent', 'archive', 'trash'].includes(note.folder)) {
        counts[note.folder] = (counts[note.folder] || 0) + 1
      }
    }
    return counts
  }, [notes])

  const countFor = (folderId: string) => noteCounts[folderId] || 0

  const recentNotes = recentNoteIds
    .map((id) => notes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n && n.folder !== 'trash'))
    .slice(0, 5)

  const goToFolder = (id: string) => {
    setActiveFolder(id)
    setSelectedTag(null)
    goHome()
  }

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    const noteCount = countFor(folderId)
    const message =
      noteCount > 0
        ? `Delete "${folderName}"? ${noteCount} note${noteCount === 1 ? '' : 's'} will move back to All Notes.`
        : `Delete "${folderName}"?`
    if (!window.confirm(message)) return
    deleteFolder(folderId)
  }

  const navButton = (
    id: string,
    label: string,
    icon: React.ReactNode,
    options?: { count?: number; indent?: boolean }
  ) => {
    const active = activeFolder === id && !selectedTag
    const count = options?.count ?? 0

    return (
      <button
        key={id}
        type="button"
        onClick={() => goToFolder(id)}
        className={cn(
          'flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[12px] font-medium transition-colors',
          options?.indent && 'pl-7',
          active
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        {count > 0 && (
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{count}</span>
        )}
      </button>
    )
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-3 py-2.5">
        <p className="min-w-0 truncate text-sm font-semibold">{workspaceName}</p>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onOpenSettings} title="Settings">
            <Settings className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={toggleSidebar} title="Hide sidebar (Ctrl+B)">
            <PanelLeftClose className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-none">
        <div className="flex flex-col gap-0.5">
          {navButton('notes', 'All Notes', <Inbox className="size-3.5 shrink-0" />, {
            count: countFor('notes'),
          })}
          {navButton('favorites', 'Starred', <Star className="size-3.5 shrink-0 text-amber-500" />, {
            count: countFor('favorites'),
          })}

          {folders.map((folder) =>
            <div key={folder.id} className="group/folder relative flex items-center">
              <button
                type="button"
                onClick={() => goToFolder(folder.id)}
                className={cn(
                  'flex h-8 w-full min-w-0 items-center gap-2 rounded-lg pl-7 pr-8 text-[12px] font-medium transition-colors',
                  activeFolder === folder.id && !selectedTag
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Folder className={cn('size-3.5 shrink-0', folder.color || 'text-primary')} />
                <span className="min-w-0 flex-1 truncate text-left">{folder.name}</span>
                {countFor(folder.id) > 0 && (
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {countFor(folder.id)}
                  </span>
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background/60 hover:text-foreground focus:opacity-100 group-hover/folder:opacity-100',
                      activeFolder === folder.id && 'opacity-100'
                    )}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Folder actions for ${folder.name}`}
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => handleDeleteFolder(folder.id, folder.name)}
                  >
                    <Trash className="size-4" />
                    Delete folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <button
            type="button"
            onClick={onNewFolder}
            className="mt-1 flex h-8 w-full items-center gap-2 rounded-lg border border-dashed border-sidebar-border px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
          >
            <FolderPlus className="size-3.5 shrink-0" />
            New folder
          </button>
        </div>

        <Separator className="my-2" />

        <div className="flex flex-col gap-0.5">
          {navButton('archive', 'Archive', <Archive className="size-3.5 shrink-0" />, {
            count: countFor('archive'),
          })}
          {navButton('trash', 'Trash', <Trash2 className="size-3.5 shrink-0 text-destructive" />, {
            count: countFor('trash'),
          })}
        </div>

        {recentNotes.length > 0 && (
          <>
            <Separator className="my-2" />
            <p className="mb-1 px-2.5 text-[10px] font-medium text-muted-foreground">Recent</p>
            <div className="flex flex-col gap-0.5">
              {recentNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => openNote(note.id)}
                  className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {note.isFavorite ? (
                    <Star className="size-3 shrink-0 fill-amber-500 text-amber-500" />
                  ) : (
                    <FileText className="size-3 shrink-0 opacity-50" />
                  )}
                  <span className="truncate">{note.title || 'Untitled'}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-2.5">
        <Button size="sm" className="w-full gap-1.5" onClick={() => createNote()}>
          <Plus className="size-3.5" />
          New note
        </Button>
      </div>
    </aside>
  )
}
