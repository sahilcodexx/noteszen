import { Suspense, lazy } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useNotesStore } from '../store/useNotesStore'
import NoteTabs from './NoteTabs'
import { Button } from '@/components/ui/button'

const Editor = lazy(() => import('./Editor'))

export default function EditorShell() {
  const { goHome, notes, selectedNoteId, restoreNote, deleteNote } = useNotesStore()
  const activeNote = notes.find((n) => n.id === selectedNoteId)

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Select a note to edit
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden min-w-0">
      <div className="flex items-center gap-2 h-9 px-4 border-b border-border/30 shrink-0 bg-background/40">
        <Button variant="ghost" size="xs" className="gap-1 text-xs" onClick={goHome}>
          <ArrowLeft className="size-3.5" />
          Home
        </Button>
        <div className="flex-1 min-w-0 overflow-hidden">
          <NoteTabs />
        </div>
      </div>

      {activeNote.folder === 'trash' && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-2 flex items-center justify-between text-destructive text-xs shrink-0 font-semibold">
          <div className="flex items-center gap-2">
            <Trash2 className="size-4" />
            <span>This note is in Trash. Restore it to edit.</span>
          </div>
          <div className="flex gap-1.5">
            <Button size="xs" variant="outline" onClick={() => restoreNote(activeNote.id)}>
              Restore
            </Button>
            <Button size="xs" variant="destructive" onClick={() => deleteNote(activeNote.id)}>
              Delete
            </Button>
          </div>
        </div>
      )}

      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            Loading editor...
          </div>
        }
      >
        <Editor />
      </Suspense>
    </div>
  )
}