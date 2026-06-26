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
      headings.push({ level, text, id: `heading-${index++}` })
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
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs">Jump to section</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {headings.map((h) => (
            <DropdownMenuItem
              key={h.id}
              onClick={() => onNavigate?.(h.id)}
              className={cn(
                'text-xs truncate',
                h.level === 2 && 'pl-6',
                h.level === 3 && 'pl-8 text-[11px]'
              )}
            >
              {h.text}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}