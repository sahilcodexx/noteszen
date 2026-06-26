import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ListTree } from 'lucide-react'

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
    <div
      className={cn(
        'fixed right-4 top-1/2 -translate-y-1/2 z-20 w-44 max-h-[50vh] overflow-y-auto rounded-xl border border-border/50 bg-card/80 backdrop-blur-md shadow-sm p-2 scrollbar-none hidden lg:block',
        className
      )}
    >
      <div className="flex items-center gap-1.5 px-1.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <ListTree className="size-3" />
        Contents
      </div>
      <nav className="flex flex-col gap-0.5">
        {headings.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onNavigate?.(h.id)}
            className={cn(
              'text-left text-[10px] truncate rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
              h.level === 1 && 'font-semibold',
              h.level === 2 && 'pl-3',
              h.level === 3 && 'pl-5 text-[9px]'
            )}
            title={h.text}
          >
            {h.text}
          </button>
        ))}
      </nav>
    </div>
  )
}