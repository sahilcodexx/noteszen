import { useCallback, useEffect, useState } from 'react'
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
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const loadVersions = useCallback(async () => {
    if (!noteId) return
    setLoading(true)
    try {
      const list = await getNoteVersions(noteId)
      setVersions(list)
    } catch {
      notify.error('Failed to load version history')
      setVersions([])
    } finally {
      setLoading(false)
    }
  }, [noteId, getNoteVersions])

  useEffect(() => {
    if (!open || !noteId) return
    loadVersions()
  }, [open, noteId, loadVersions])

  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId)
    try {
      const restored = await restoreVersion(versionId)
      if (restored) {
        notify.success('Version restored')
        onOpenChange(false)
      } else {
        notify.error('Could not restore this version')
      }
    } catch {
      notify.error('Failed to restore version')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-[340px] flex-col sm:max-w-[340px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-primary" />
            Version History
          </SheetTitle>
          <SheetDescription className="text-xs">
            Snapshots are saved when you edit a note. Restore any previous version below.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 mt-2">
          {loading ? (
            <div className="flex flex-col gap-3 pr-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12 px-4 leading-relaxed">
              No versions yet. Edit the note title or content — a snapshot is saved on each change.
            </p>
          ) : (
            <div className="flex flex-col gap-2 pr-2 pb-4">
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
                      {v.content.replace(/<[^>]*>/g, '').substring(0, 120) || 'Empty note'}
                    </p>
                    <Button
                      size="xs"
                      variant="outline"
                      className="self-end mt-1"
                      disabled={restoringId === v.id}
                      onClick={() => handleRestore(v.id)}
                    >
                      <RotateCcw data-icon="inline-start" />
                      {restoringId === v.id ? 'Restoring…' : 'Restore'}
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