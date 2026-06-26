import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewNoteCardProps {
  onClick: () => void
  layout?: 'grid' | 'list'
  label?: string
}

export default function NewNoteCard({ onClick, layout = 'grid', label = 'New note' }: NewNoteCardProps) {
  if (layout === 'list') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group w-full flex items-center gap-3 px-4 h-12 rounded-xl',
          'border border-dashed border-[var(--workspace-border)]',
          'bg-[var(--workspace-subtle)]/50 hover:bg-[var(--workspace-subtle)]',
          'hover:border-primary/35 transition-all text-left'
        )}
      >
        <span className="flex size-7 items-center justify-center rounded-lg border border-dashed border-[var(--workspace-border)] group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
          <Plus className="size-3.5 text-muted-foreground group-hover:text-primary" />
        </span>
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center justify-center gap-2.5 rounded-xl min-h-[130px] p-4',
        'border border-dashed border-[var(--workspace-border)]',
        'bg-[var(--workspace-subtle)]/40 hover:bg-[var(--workspace-subtle)]/80',
        'hover:border-primary/35 transition-all'
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-full border border-dashed border-[var(--workspace-border)] group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
        <Plus className="size-4 text-muted-foreground group-hover:text-primary" />
      </span>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
    </button>
  )
}