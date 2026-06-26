import { MoreHorizontal, Star } from 'lucide-react'
import type { Note } from '../types'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

function previewText(content: string, max = 100) {
  return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, max)
}

function formatTime(dateString: string) {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    }
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

const ACCENT: Record<string, string> = {
  ideas: 'border-l-sky-400',
  research: 'border-l-violet-400',
  drafts: 'border-l-amber-400',
  default: 'border-l-primary/40',
}

interface NoteCardProps {
  note: Note
  section?: 'ideas' | 'research' | 'drafts' | 'default'
  onOpen: () => void
  onToggleFavorite?: () => void
  onDelete?: () => void
  layout?: 'grid' | 'list'
}

export default function NoteCard({
  note,
  section = 'default',
  onOpen,
  onToggleFavorite,
  onDelete,
  layout = 'grid',
}: NoteCardProps) {
  const accent = ACCENT[section] ?? ACCENT.default

  if (layout === 'list') {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card text-left',
          'hover:shadow-md hover:border-border transition-all border-l-4',
          accent
        )}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{note.title || 'Untitled'}</p>
          <p className="text-xs text-muted-foreground truncate">{previewText(note.content, 80)}</p>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(note.updatedAt)}</span>
      </button>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border border-border/60 bg-card p-4 min-h-[140px]',
        'hover:shadow-md hover:border-border/80 transition-all cursor-pointer border-l-4',
        accent
      )}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 pr-6">
          {note.title || 'Untitled'}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-muted-foreground"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {onToggleFavorite && (
              <DropdownMenuItem onClick={onToggleFavorite}>
                <Star className="size-3.5" />
                {note.isFavorite ? 'Unfavorite' : 'Favorite'}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
        {previewText(note.content) || 'No content yet'}
      </p>
      <p className="text-[10px] text-muted-foreground/80 mt-3">{formatTime(note.updatedAt)}</p>
    </div>
  )
}