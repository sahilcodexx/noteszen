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
  Moon,
  Sun,
  PanelLeftClose,
} from 'lucide-react'
import { useNotesStore } from '../store/useNotesStore'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'


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
    vaults,
    activeVaultId,
    toggleSidebar,
  } = useNotesStore()

  const [workspacesOpen, setWorkspacesOpen] = useState(true)

  const workspaceName =
    vaults.find((v) => v.id === activeVaultId)?.name ?? 'Default Vault'

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
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        <Badge variant="secondary" className="text-[9px] h-4 min-w-4 px-1.5 font-normal">
          {count}
        </Badge>
      </button>
    )
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="flex shrink-0 items-center justify-between border-b border-sidebar-border px-4 py-3">
        <p className="text-[11px] font-semibold text-muted-foreground truncate">{workspaceName}</p>
        <Button variant="ghost" size="icon-xs" onClick={toggleSidebar} title="Hide sidebar (Ctrl+B)">
          <PanelLeftClose className="size-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 scrollbar-none">
        <div className="flex flex-col gap-0.5">
          {navItem('favorites', 'Starred', <Star className="size-3.5 text-amber-500" />, countFor('favorites'))}
          {navItem('archive', 'Archive', <Archive className="size-3.5 text-indigo-500" />, countFor('archive'))}
          {navItem('trash', 'Trash', <Trash2 className="size-3.5 text-destructive" />, countFor('trash'))}

          <button
            type="button"
            className="w-full flex items-center justify-between h-8 px-3 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-accent"
          >
            <span className="flex items-center gap-2.5">
              <Bell className="size-3.5" />
              Notifications
            </span>
            <Badge variant="secondary" className="text-[9px] h-4 min-w-4 px-1.5 font-normal">0</Badge>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 h-8 px-3 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Settings className="size-3.5" />
            Settings
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            className="w-full flex items-center gap-2.5 h-8 px-3 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {isDarkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            {isDarkMode ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setWorkspacesOpen(!workspacesOpen)}
            className="w-full flex items-center gap-1.5 px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70"
          >
            {workspacesOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            {workspaceName.toUpperCase()}
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
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent'
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
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent'
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
                  className="w-full flex items-center gap-2 h-8 px-3 rounded-lg text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground text-left"
                >
                  {note.isFavorite && <Star className="size-3 text-amber-500 fill-amber-500 shrink-0" />}
                  {!note.isFavorite && <FileText className="size-3 shrink-0 opacity-50" />}
                  <span className="truncate">{note.title || 'Untitled'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={() => createNote()}
        >
          <Plus className="size-3.5" />
          New note
        </Button>
      </div>
    </aside>
  )
}