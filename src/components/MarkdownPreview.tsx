import type { ReactNode } from 'react'
import { CheckSquare, Square } from 'lucide-react'
import { CodeBlockCommand } from './code-block-command'
import { CopyButton } from './copy-button'
import {
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from './tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { commandToPackageManagerTabs, isShellCommandBlock } from '@/lib/code-block-command'
import { cn } from '@/lib/utils'

interface MarkdownPreviewProps {
  markdown: string
  className?: string
}

interface CodeMeta {
  language?: string
  title?: string
}

function parseCodeMeta(raw = ''): CodeMeta {
  const [language] = raw.trim().split(/\s+/)
  const title = raw.match(/title=(?:"([^"]+)"|'([^']+)'|(\S+))/)?.slice(1).find(Boolean)
  return {
    language: language || undefined,
    title,
  }
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|\[\[[^\]]+\]\])/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    const token = match[0]
    const key = `${keyPrefix}-${match.index}`

    if (token.startsWith('`')) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={key}>{renderInline(token.slice(2, -2), `${key}-strong`)}</strong>)
    } else if (token.startsWith('*')) {
      nodes.push(<em key={key}>{renderInline(token.slice(1, -1), `${key}-em`)}</em>)
    } else if (token.startsWith('[[')) {
      nodes.push(
        <span key={key} className="wikilink wikilink-exists">
          {token}
        </span>
      )
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        nodes.push(
          <a key={key} href={link[2]} target="_blank" rel="noreferrer">
            {renderInline(link[1], `${key}-link`)}
          </a>
        )
      }
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function MarkdownCodeBlock({
  code,
  language,
  title,
}: {
  code: string
  language?: string
  title?: string
}) {
  const trimmed = code.trim()

  if (isShellCommandBlock(language, trimmed)) {
    return (
      <div className="my-5">
        <CodeBlockCommand className="mx-auto w-full max-w-md" {...commandToPackageManagerTabs(trimmed)} />
      </div>
    )
  }

  return (
    <div className="group/pre relative my-5 overflow-hidden rounded-xl border border-border bg-code text-code-foreground shadow-md">
      <div className="flex h-9 items-center justify-between gap-3 border-b border-border/80 px-3">
        <div className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">
          {title || language || 'code'}
        </div>
        <CopyButton
          className="size-7 rounded-md border-none text-muted-foreground opacity-70 transition-opacity group-hover/pre:opacity-100"
          variant="ghost"
          size="icon-xs"
          text={code}
        />
      </div>
      <pre className="m-0 overflow-x-auto border-0 bg-transparent p-4 text-[13px] leading-6">
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    </div>
  )
}

function renderTable(lines: string[], key: string) {
  const rows = lines
    .map((line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()))
    .filter((row) => row.length > 1)
  const [head, , ...body] = rows

  return (
    <Table key={key} className="my-4">
      <TableHeader>
        <TableRow>
          {head.map((cell, index) => (
            <TableHead key={`${key}-head-${index}`}>{renderInline(cell, `${key}-head-${index}`)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {body.map((row, rowIndex) => (
          <TableRow key={`${key}-row-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <TableCell key={`${key}-cell-${rowIndex}-${cellIndex}`}>
                {renderInline(cell, `${key}-cell-${rowIndex}-${cellIndex}`)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function renderTextBlocks(text: string, keyPrefix: string, headingStartIndex = 0): { nodes: ReactNode[]; headingCount: number } {
  const cleaned = text
    .replace(/<TabsListInstallType\s*\/>/g, '')
    .replace(/<DocSponsors\s*\/>/g, '')
    .replace(/<AutoTypeTable[\s\S]*?\/>/g, '')
    .trim()
  if (!cleaned) return { nodes: [], headingCount: 0 }

  const nodes: ReactNode[] = []
  const lines = cleaned.split('\n')
  let i = 0
  let headingCount = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    const key = `${keyPrefix}-${i}`

    if (!trimmed) {
      i += 1
      continue
    }

    if (/^---+$/.test(trimmed)) {
      nodes.push(<hr key={key} />)
      i += 1
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      const level = Math.min(heading[1].length, 6)
      const children = renderInline(heading[2], key)
      const id = `heading-${headingStartIndex + headingCount}`
      headingCount += 1
      if (level === 1) nodes.push(<h1 id={id} key={key}>{children}</h1>)
      else if (level === 2) nodes.push(<h2 id={id} key={key}>{children}</h2>)
      else if (level === 3) nodes.push(<h3 id={id} key={key}>{children}</h3>)
      else if (level === 4) nodes.push(<h4 id={id} key={key}>{children}</h4>)
      else if (level === 5) nodes.push(<h5 id={id} key={key}>{children}</h5>)
      else nodes.push(<h6 id={id} key={key}>{children}</h6>)
      i += 1
      continue
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i += 1
      }
      nodes.push(
        <blockquote key={key}>
          <p>{renderInline(quoteLines.join(' '), key)}</p>
        </blockquote>
      )
      continue
    }

    if (/^\|.+\|$/.test(trimmed) && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i + 1]?.trim() || '')) {
      const tableLines = [lines[i], lines[i + 1]]
      i += 2
      while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
        tableLines.push(lines[i])
        i += 1
      }
      nodes.push(renderTable(tableLines, key))
      continue
    }

    if (/^[-*]\s+/.test(trimmed) || /^[-*]\s+\[[ xX]\]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && (/^[-*]\s+/.test(lines[i].trim()) || /^[-*]\s+\[[ xX]\]\s+/.test(lines[i].trim()))) {
        items.push(lines[i].trim())
        i += 1
      }
      nodes.push(
        <ul key={key}>
          {items.map((item, index) => {
            const task = item.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/)
            const body = task ? task[2] : item.replace(/^[-*]\s+/, '')
            return (
              <li key={`${key}-item-${index}`} className={task ? 'flex gap-2' : undefined}>
                {task ? (
                  task[1].toLowerCase() === 'x' ? (
                    <CheckSquare className="mt-1 size-3.5 shrink-0 text-primary" />
                  ) : (
                    <Square className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                  )
                ) : null}
                <span>{renderInline(body, `${key}-item-${index}`)}</span>
              </li>
            )
          })}
        </ul>
      )
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i += 1
      }
      nodes.push(
        <ol key={key}>
          {items.map((item, index) => (
            <li key={`${key}-item-${index}`}>{renderInline(item, `${key}-item-${index}`)}</li>
          ))}
        </ol>
      )
      continue
    }

    const paragraph: string[] = [trimmed]
    i += 1
    while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s+/.test(lines[i].trim()) && !/^([-*]|\d+\.)\s+/.test(lines[i].trim()) && !lines[i].trim().startsWith('> ')) {
      paragraph.push(lines[i].trim())
      i += 1
    }
    nodes.push(<p key={key}>{renderInline(paragraph.join(' '), key)}</p>)
  }

  return { nodes, headingCount }
}

function renderStandardMarkdown(markdown: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const fence = /```([^\n]*)\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let headingIndex = 0

  while ((match = fence.exec(markdown)) !== null) {
    const rendered = renderTextBlocks(markdown.slice(lastIndex, match.index), `${keyPrefix}-text-${lastIndex}`, headingIndex)
    nodes.push(...rendered.nodes)
    headingIndex += rendered.headingCount
    const meta = parseCodeMeta(match[1])
    nodes.push(
      <MarkdownCodeBlock
        key={`${keyPrefix}-code-${match.index}`}
        code={match[2].trimEnd()}
        language={meta.language}
        title={meta.title}
      />
    )
    lastIndex = fence.lastIndex
  }

  const rendered = renderTextBlocks(markdown.slice(lastIndex), `${keyPrefix}-text-${lastIndex}`, headingIndex)
  nodes.push(...rendered.nodes)
  return nodes
}

function renderSteps(content: string, key: string) {
  const stepPattern = /<Step>([\s\S]*?)<\/Step>/g
  const steps: Array<{ title: string; body: string }> = []
  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = stepPattern.exec(content)) !== null) {
    if (steps.length > 0) {
      steps[steps.length - 1].body = content.slice(lastIndex, match.index).trim()
    }
    steps.push({ title: match[1].trim(), body: '' })
    lastIndex = stepPattern.lastIndex
  }
  if (steps.length > 0) steps[steps.length - 1].body = content.slice(lastIndex).trim()

  return (
    <div key={key} className="relative my-6 ml-2 space-y-6 border-l border-border pl-6">
      {steps.map((step, index) => (
        <section key={`${key}-step-${index}`} className="relative">
          <div className="absolute -left-[31px] top-1 flex size-3 items-center justify-center rounded-full border border-border bg-background">
            <span className="size-1.5 rounded-full bg-primary" />
          </div>
          <h3 className="mt-0 text-base font-medium">{renderInline(step.title, `${key}-title-${index}`)}</h3>
          <div className="mt-2">{renderMarkdownBlocks(step.body, `${key}-body-${index}`)}</div>
        </section>
      ))}
    </div>
  )
}

function renderCodeTabs(content: string, key: string) {
  const tabPattern = /<TabsContent\s+value=["']([^"']+)["']\s*>([\s\S]*?)<\/TabsContent>/g
  const tabs: Array<{ value: string; content: string }> = []
  let match: RegExpExecArray | null

  while ((match = tabPattern.exec(content)) !== null) {
    tabs.push({ value: match[1], content: match[2].trim() })
  }
  if (tabs.length === 0) return renderStandardMarkdown(content, key)

  return (
    <Tabs key={key} defaultValue={tabs[0].value} className="my-6 gap-3">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={`${key}-trigger-${tab.value}`} value={tab.value}>
            {tab.value === 'cli' ? 'Command' : tab.value}
          </TabsTrigger>
        ))}
        <TabsIndicator />
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={`${key}-content-${tab.value}`} value={tab.value}>
          {renderMarkdownBlocks(tab.content, `${key}-${tab.value}`)}
        </TabsContent>
      ))}
    </Tabs>
  )
}

function renderMarkdownBlocks(markdown: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const container = /<(CodeTabs|Steps)>([\s\S]*?)<\/\1>/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = container.exec(markdown)) !== null) {
    nodes.push(...renderStandardMarkdown(markdown.slice(lastIndex, match.index), `${keyPrefix}-std-${lastIndex}`))
    nodes.push(
      match[1] === 'Steps'
        ? renderSteps(match[2], `${keyPrefix}-steps-${match.index}`)
        : renderCodeTabs(match[2], `${keyPrefix}-tabs-${match.index}`)
    )
    lastIndex = container.lastIndex
  }

  nodes.push(...renderStandardMarkdown(markdown.slice(lastIndex), `${keyPrefix}-std-${lastIndex}`))
  return nodes
}

export default function MarkdownPreview({ markdown, className }: MarkdownPreviewProps) {
  return (
    <div className={cn('prose-editor markdown-preview max-w-none text-sm leading-relaxed', className)}>
      {renderMarkdownBlocks(markdown, 'root')}
    </div>
  )
}
