import { Trash2, Search, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import GridCard from './GridCard'

interface TrashViewProps {
  notes: Array<{
    id: string
    title: string
    content: string
    cover?: string | null
    tags?: string[]
    updatedAt: string
  }>
  searchQuery: string
  onSearchChange: (q: string) => void
  onEmptyTrash: () => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  formatRelativeTime: (d: string) => string
}

function previewText(content: string, max = 140) {
  return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, max)
}

export default function TrashView({
  notes,
  searchQuery,
  onSearchChange,
  onEmptyTrash,
  onRestore,
  onDelete,
  formatRelativeTime,
}: TrashViewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-8">
        <div className="flex items-center gap-2">
          <Trash2 className="size-4 text-destructive" />
          <h1 className="text-sm font-bold">Trash Bin</h1>
          <Badge variant="secondary" className="text-[10px]">
            {notes.length} {notes.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search in trash..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-7 h-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          {notes.length > 0 && (
            <Button variant="destructive" size="sm" onClick={onEmptyTrash}>
              <Trash2 />
              Empty Trash
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        {notes.length === 0 ? (
          <Empty className="mx-auto min-h-[min(420px,60vh)] max-w-md border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Trash2 />
              </EmptyMedia>
              <EmptyTitle>Trash is empty</EmptyTitle>
              <EmptyDescription>
                Deleted notes appear here until restored or permanently removed.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid max-w-5xl grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <GridCard
                key={note.id}
                title={note.title || 'Untitled'}
                description={formatRelativeTime(note.updatedAt)}
                preview={previewText(note.content) || 'No content yet'}
                cover={note.cover}
                footer={
                  <div className="flex w-full flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onRestore(note.id)}
                    >
                      <RotateCcw data-icon="inline-start" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => onDelete(note.id)}
                    >
                      <Trash2 data-icon="inline-start" />
                      Delete
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}