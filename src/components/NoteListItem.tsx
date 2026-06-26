import { memo } from 'react'
import { Pin, Star, Archive, Trash2 } from 'lucide-react'
import type { Note } from '../types'
import { useNotesStore } from '../store/useNotesStore'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function statusVariant(status?: string | null) {
  if (status === 'done') return 'secondary' as const
  if (status === 'in-progress') return 'default' as const
  if (status === 'todo') return 'outline' as const
  return 'outline' as const
}

function statusLabel(status?: string | null) {
  if (status === 'done') return 'Done'
  if (status === 'in-progress') return 'In Progress'
  if (status === 'todo') return 'Todo'
  return null
}

interface NoteListItemProps {
  note: Note
  isSelected: boolean
  onSelect: () => void
  togglePin: () => void
  toggleFavorite: () => void
  deleteNote: () => void
}

const NoteListItem = memo(function NoteListItem({
  note,
  isSelected,
  onSelect,
  togglePin,
  toggleFavorite,
  deleteNote,
}: NoteListItemProps) {
  const preview = note.content
    ? note.content.replace(/<[^>]*>/g, '').replace(/\[\[(.*?)\]\]/g, '$1').trim().substring(0, 80)
    : 'No content yet'
  const status = statusLabel(note.status)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            'w-full text-left px-3 py-2.5 cursor-pointer transition-all rounded-lg border flex flex-col gap-1 select-none',
            isSelected
              ? 'bg-card border-border shadow-xs scale-[1.01]'
              : 'border-transparent bg-transparent hover:bg-muted/40'
          )}
        >
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {note.icon && <span className="text-sm shrink-0">{note.icon}</span>}
              <h3
                className={cn(
                  'font-semibold text-xs truncate',
                  isSelected ? 'text-primary font-bold' : 'text-foreground/90'
                )}
              >
                {note.title || 'Untitled Note'}
              </h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {note.isPinned && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pin className="size-3 text-sky-500 fill-sky-500" />
                  </TooltipTrigger>
                  <TooltipContent>Pinned</TooltipContent>
                </Tooltip>
              )}
              {note.isFavorite && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Star className="size-3 text-amber-500 fill-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>Favorite</TooltipContent>
                </Tooltip>
              )}
              <span className="text-[9px] text-muted-foreground font-medium">
                {formatRelativeTime(note.updatedAt)}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed pl-0.5">
            {preview}
          </p>

          {(status || (note.tags && note.tags.length > 0)) && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {status && (
                <Badge variant={statusVariant(note.status)} className="text-[8px] h-4 px-1.5">
                  {status}
                </Badge>
              )}
              {note.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[8px] h-4 px-1.5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={togglePin}>
          <Pin />
          {note.isPinned ? 'Unpin Note' : 'Pin Note'}
        </ContextMenuItem>
        <ContextMenuItem onClick={toggleFavorite}>
          <Star />
          {note.isFavorite ? 'Unstar Note' : 'Star Note'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => useNotesStore.getState().toggleArchive(note.id)}>
          <Archive />
          {note.isArchived ? 'Unarchive Note' : 'Archive Note'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={deleteNote}>
          <Trash2 />
          Move to Trash
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
})

export default NoteListItem