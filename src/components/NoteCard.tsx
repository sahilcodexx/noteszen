import { MoreHorizontal, Star } from 'lucide-react'
import type { Note } from '../types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import GridCard from './GridCard'

function previewText(content: string, max = 140) {
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

function NoteCardMenu({
  note,
  onToggleFavorite,
  onDelete,
}: {
  note: Note
  onToggleFavorite?: () => void
  onDelete?: () => void
}) {
  if (!onToggleFavorite && !onDelete) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon-xs">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {onToggleFavorite && (
          <DropdownMenuItem onClick={onToggleFavorite}>
            <Star />
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
  )
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
  onOpen,
  onToggleFavorite,
  onDelete,
  layout = 'grid',
}: NoteCardProps) {
  return (
    <GridCard
      title={note.title || 'Untitled'}
      description={formatTime(note.updatedAt)}
      preview={previewText(note.content, layout === 'list' ? 80 : 140) || 'No content yet'}
      cover={note.cover}
      badge={note.isFavorite ? <Badge variant="secondary">Starred</Badge> : undefined}
      actionLabel="Open"
      onAction={onOpen}
      layout={layout}
      menu={
        <NoteCardMenu
          note={note}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
        />
      }
    />
  )
}