import { Trash2, Search, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TrashViewProps {
  notes: Array<{
    id: string
    title: string
    content: string
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
    <div className="flex flex-col h-full overflow-hidden bg-card">
      <div className="h-14 border-b border-border flex items-center justify-between shrink-0 px-8">
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
              <Trash2 className="size-3.5" />
              Empty Trash
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-8 py-8">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trash2 className="size-10 text-destructive/40 mb-4" />
            <h2 className="text-sm font-bold">Trash is empty</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Deleted notes appear here until restored or permanently removed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex flex-col p-4 rounded-xl border border-border bg-muted hover:shadow-sm transition-all"
              >
                <h3 className="font-semibold text-sm truncate">{note.title || 'Untitled'}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3 mt-2 flex-1">
                  {note.content.replace(/<[^>]*>/g, '').substring(0, 160)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {formatRelativeTime(note.updatedAt)}
                </p>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
                  <Button variant="outline" size="xs" onClick={() => onRestore(note.id)}>
                    <RotateCcw data-icon="inline-start" />
                    Restore
                  </Button>
                  <Button variant="destructive" size="xs" onClick={() => onDelete(note.id)}>
                    <Trash2 data-icon="inline-start" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}