import { CodeBlockCommand } from './code-block-command'
import { commandToPackageManagerTabs, isShellCommandBlock } from '@/lib/code-block-command'
import { markdownToChatHtml } from '@/lib/ai-output'
import { cn } from '@/lib/utils'

interface AIMarkdownViewProps {
  markdown: string
  className?: string
}

interface Segment {
  type: 'html' | 'code'
  value: string
  language?: string
}

function splitMarkdown(markdown: string): Segment[] {
  const segments: Segment[] = []
  const fence = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = fence.exec(markdown)) !== null) {
    const before = markdown.slice(lastIndex, match.index)
    if (before.trim()) segments.push({ type: 'html', value: before })
    segments.push({ type: 'code', language: match[1], value: match[2].trimEnd() })
    lastIndex = fence.lastIndex
  }

  const after = markdown.slice(lastIndex)
  if (after.trim()) segments.push({ type: 'html', value: after })
  return segments.length ? segments : [{ type: 'html', value: markdown }]
}

export default function AIMarkdownView({ markdown, className }: AIMarkdownViewProps) {
  const segments = splitMarkdown(markdown)

  return (
    <div className={cn('prose-editor ai-chat-prose break-words', className)}>
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          if (isShellCommandBlock(segment.language, segment.value)) {
            const commands = commandToPackageManagerTabs(segment.value)
            return (
              <div className="my-2" key={`${segment.type}-${index}`}>
                <CodeBlockCommand className="mx-auto w-full max-w-md" {...commands} />
              </div>
            )
          }

          return (
            <pre key={`${segment.type}-${index}`}>
              <code className={segment.language ? `language-${segment.language}` : undefined}>
                {segment.value}
              </code>
            </pre>
          )
        }

        return (
          <div
            key={`${segment.type}-${index}`}
            dangerouslySetInnerHTML={{ __html: markdownToChatHtml(segment.value) }}
          />
        )
      })}
    </div>
  )
}
