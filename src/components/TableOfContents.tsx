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
import { cn } from '@/lib/utils'

interface Heading {
  level: number
  text: string
  id: string
  index: number
}

interface TableOfContentsProps {
  html: string
  onNavigate?: (id: string) => void
  className?: string
}

function extractHeadings(html: string): Heading[] {
  if (!html) return []
  const headings: Heading[] = []
  const regex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi
  let match: RegExpExecArray | null
  let index = 0

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const text = match[2].replace(/<[^>]*>/g, '').trim()
    if (text) {
      headings.push({ level, text, id: `heading-${index}`, index })
      index += 1
    }
  }

  if (headings.length === 0) {
    const markdownRegex = /^(#{1,3})\s+(.+)$/gm
    while ((match = markdownRegex.exec(html)) !== null) {
      const text = match[2].replace(/[*_`#]/g, '').trim()
      if (text) {
        headings.push({
          level: match[1].length,
          text,
          id: `heading-${index}`,
          index,
        })
        index += 1
      }
    }
  }

  return headings
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
