import { useMemo } from 'react'
import { ChevronDown, ListTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { extractHeadings } from '@/lib/headings'
import { cn } from '@/lib/utils'

interface TableOfContentsProps {
  html: string
  onNavigate?: (id: string) => void
  className?: string
}

export default function TableOfContents({ html, onNavigate, className }: TableOfContentsProps) {
  const headings = useMemo(() => extractHeadings(html), [html])

  if (headings.length < 2) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-7 gap-1.5 text-[11px] font-medium shrink-0', className)}
        >
          <ListTree className="size-3.5" />
          On this page
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[min(28rem,70vh)] w-64 overflow-y-auto">
        <DropdownMenuLabel className="text-xs">Jump to section</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {headings.map((h) => (
            <DropdownMenuItem
              key={h.id}
              onSelect={() => onNavigate?.(h.id)}
              className={cn(
                'text-xs',
                h.level === 2 && 'pl-6',
                h.level === 3 && 'pl-8 text-[11px]'
              )}
            >
              <span className="truncate">{h.text}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
