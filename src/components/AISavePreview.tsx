import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X, FilePlus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface AISavePreviewData {
  title: string
  previewHtml: string
  contentHtml: string
  tags: string[]
}

interface AISavePreviewProps {
  open: boolean
  preview: AISavePreviewData | null
  openNoteTitle?: string
  onTitleChange: (title: string) => void
  onClose: () => void
  onCreate: () => void
  onAppend: () => void
}

export default function AISavePreview({
  open,
  preview,
  openNoteTitle,
  onTitleChange,
  onClose,
  onCreate,
  onAppend,
}: AISavePreviewProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open || !preview) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 no-drag"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-save-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close preview"
      />
      <div
        className={cn(
          'relative z-10 flex w-full max-w-2xl max-h-[min(90vh,720px)] flex-col overflow-hidden',
          'rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] shadow-2xl'
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--workspace-border)] px-5 py-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="ai-save-preview-title"
              className="text-sm font-semibold flex items-center gap-2"
            >
              <Sparkles className="size-4 text-primary shrink-0" />
              Save AI response to a note
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Review the formatted content, set a title, then save.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="px-5 py-4 space-y-3 shrink-0 border-b border-[var(--workspace-border)]">
          <div className="space-y-1.5">
            <Label htmlFor="ai-note-title" className="text-[11px] text-muted-foreground">
              Note title
            </Label>
            <Input
              id="ai-note-title"
              value={preview.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Note title"
              className="h-9 text-sm bg-[var(--workspace-subtle)] border-[var(--workspace-border)]"
              autoFocus
            />
          </div>
          {openNoteTitle && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <FileText className="size-3 shrink-0" />
              Open note: <span className="text-foreground font-medium truncate">{openNoteTitle}</span>
            </p>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          <div
            className="prose-editor ai-note-preview text-sm leading-relaxed break-words rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-subtle)] px-4 py-4"
            dangerouslySetInnerHTML={{ __html: preview.previewHtml }}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-4 border-t border-[var(--workspace-border)] bg-[var(--workspace-subtle)]/50 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {openNoteTitle && (
            <Button type="button" variant="secondary" size="sm" onClick={onAppend}>
              <FileText className="size-3.5" />
              Add to open note
            </Button>
          )}
          <Button type="button" size="sm" onClick={onCreate}>
            <FilePlus className="size-3.5" />
            Create new note
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}