import type { Editor } from '@tiptap/react'
import { Highlighter, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', swatch: 'bg-yellow-200 dark:bg-yellow-800' },
  { id: 'green', label: 'Green', swatch: 'bg-green-200 dark:bg-green-800' },
  { id: 'blue', label: 'Blue', swatch: 'bg-blue-200 dark:bg-blue-800' },
  { id: 'red', label: 'Red', swatch: 'bg-red-200 dark:bg-red-800' },
  { id: 'purple', label: 'Purple', swatch: 'bg-purple-200 dark:bg-purple-800' },
  { id: 'orange', label: 'Orange', swatch: 'bg-orange-200 dark:bg-orange-800' },
] as const

export const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_COLORS[0].id

interface HighlightColorMenuProps {
  editor: Editor | null
  size?: 'xs' | 'sm'
  showChevron?: boolean
}

export default function HighlightColorMenu({
  editor,
  size = 'xs',
  showChevron = false,
}: HighlightColorMenuProps) {
  if (!editor) return null

  const activeColor =
    (editor.getAttributes('highlight').color as string | undefined) || DEFAULT_HIGHLIGHT_COLOR
  const activeSwatch =
    HIGHLIGHT_COLORS.find((c) => c.id === activeColor)?.swatch ?? HIGHLIGHT_COLORS[0].swatch

  const applyColor = (color: string) => {
    if (editor.state.selection.empty) {
      editor.chain().focus().toggleHighlight({ color }).run()
      return
    }
    editor.chain().focus().setHighlight({ color }).run()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={size}
          variant="ghost"
          className={cn(
            size === 'xs' ? 'h-7 px-1.5' : 'h-8 px-2',
            editor.isActive('highlight') && 'bg-muted text-foreground'
          )}
          title="Highlight color"
        >
          <Highlighter className="size-3.5" />
          <span className={cn('size-3 rounded-sm border border-border/60', activeSwatch)} />
          {showChevron && <ChevronDown className="size-3 text-muted-foreground" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="text-xs">Highlight color</DropdownMenuLabel>
        <div className="grid grid-cols-6 gap-1.5 px-2 pb-2">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              title={color.label}
              onClick={() => applyColor(color.id)}
              className={cn(
                'size-6 rounded-md border border-border/60 transition-transform hover:scale-110',
                color.swatch,
                activeColor === color.id && 'ring-2 ring-primary ring-offset-1'
              )}
            />
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => editor.chain().focus().unsetHighlight().run()}>
          Remove highlight
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}