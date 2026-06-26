import { useState } from 'react'
import { FolderPlus } from 'lucide-react'
import { useNotesStore } from '../store/useNotesStore'
import { notify } from '../lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'

const FOLDER_COLORS = [
  { id: 'text-primary', swatch: 'bg-primary' },
  { id: 'text-sky-500', swatch: 'bg-sky-500' },
  { id: 'text-emerald-500', swatch: 'bg-emerald-500' },
  { id: 'text-amber-500', swatch: 'bg-amber-500' },
  { id: 'text-rose-500', swatch: 'bg-rose-500' },
  { id: 'text-indigo-500', swatch: 'bg-indigo-500' },
]

interface FolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function FolderDialog({ open, onOpenChange }: FolderDialogProps) {
  const { createFolder } = useNotesStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState('text-primary')

  const handleCreate = () => {
    if (!name.trim()) return
    createFolder(name.trim(), color)
    notify.success(`Folder "${name.trim()}" created`)
    setName('')
    setColor('text-primary')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FolderPlus className="size-4 text-primary" />
            New Folder
          </DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="folder-name">Name</FieldLabel>
            <Input
              id="folder-name"
              placeholder="Work, Personal, Ideas..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </Field>
          <Field>
            <FieldLabel>Color</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={cn(
                    'size-7 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all',
                    c.swatch,
                    color === c.id ? 'ring-primary' : 'ring-transparent hover:ring-muted-foreground/30'
                  )}
                  title={c.id}
                />
              ))}
            </div>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}