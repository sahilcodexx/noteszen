import { X } from 'lucide-react'
import { useNotesStore } from '../store/useNotesStore'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function NoteTabs() {
  const { notes, selectedNoteId, openNoteTabs, setSelectedNoteId, removeOpenTab } = useNotesStore(
    useShallow((s) => ({
      notes: s.notes,
      selectedNoteId: s.selectedNoteId,
      openNoteTabs: s.openNoteTabs,
      setSelectedNoteId: s.setSelectedNoteId,
      removeOpenTab: s.removeOpenTab,
    }))
  )

  if (openNoteTabs.length <= 1) return null

  return (
    <div className="flex items-center gap-0.5 h-8 overflow-x-auto scrollbar-none select-none">
      {openNoteTabs.map((tabId) => {
        const note = notes.find((n) => n.id === tabId)
        if (!note) return null
        const isActive = tabId === selectedNoteId
        return (
          <div
            key={tabId}
            className={cn(
              'group flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium shrink-0 cursor-pointer transition-colors',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
            onClick={() => setSelectedNoteId(tabId)}
          >
            {note.icon && <span className="text-xs leading-none">{note.icon}</span>}
            <span className="truncate max-w-[120px]">{note.title || 'Untitled'}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-4 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                removeOpenTab(tabId)
              }}
            >
              <X className="size-2.5" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}