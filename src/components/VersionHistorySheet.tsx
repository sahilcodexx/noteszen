import { useEffect, useState } from 'react'
import { Clock, RotateCcw } from 'lucide-react'
import { useNotesStore } from '../store/useNotesStore'
import { notify } from '../lib/toast'
import type { NoteVersion } from '../types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

interface VersionHistorySheetProps {
  noteId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function VersionHistorySheet({ noteId, open, onOpenChange }: VersionHistorySheetProps) {
  const { getNoteVersions, restoreVersion } = useNotesStore()
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !noteId) return
    setLoading(true)
    getNoteVersions(noteId)
      .then(setVersions)
      .finally(() => setLoading(false))
  }, [open, noteId, getNoteVersions])

  const handleRestore = async (versionId: string) => {
    await restoreVersion(versionId)
    notify.success('Version restored')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:max-w-[340px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-primary" />
            Version History
          </SheetTitle>
          <SheetDescription className="text-xs">
            Restore a previous snapshot of this note.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4 -mx-2 px-2">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No versions saved yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {versions.map((v, i) => (
                <div key={v.id}>
                  <div className="flex flex-col gap-1 p-3 rounded-lg border border-border bg-card/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs truncate">{v.title || 'Untitled'}</span>
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {new Date(v.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {v.content.replace(/<[^>]*>/g, '').substring(0, 120)}
                    </p>
                    <Button
                      size="xs"
                      variant="outline"
                      className="self-end mt-1"
                      onClick={() => handleRestore(v.id)}
                    >
                      <RotateCcw data-icon="inline-start" />
                      Restore
                    </Button>
                  </div>
                  {i < versions.length - 1 && <Separator className="my-1 opacity-50" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}