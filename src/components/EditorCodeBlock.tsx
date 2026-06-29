import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { commandToPackageManagerTabs, isShellCommandBlock } from '@/lib/code-block-command'
import { CodeBlockCommand } from './code-block-command'
import { useState } from 'react'

export default function EditorCodeBlock({ node }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const language = node.attrs.language as string | undefined
  const code = node.textContent || ''
  const isCommand = isShellCommandBlock(language, code)

  const copy = async () => {
    await navigator.clipboard.writeText(code.trim())
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  if (isCommand) {
    return (
      <NodeViewWrapper data-code-block-view className="relative my-4">
        <div contentEditable={false}>
          <CodeBlockCommand className="mx-auto w-full max-w-md" {...commandToPackageManagerTabs(code)} />
        </div>
        <div className="pointer-events-none absolute size-px overflow-hidden opacity-0">
          <NodeViewContent />
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      data-code-block-view
      className="my-4 overflow-hidden rounded-xl border border-border bg-code text-code-foreground shadow-md"
    >
      <div
        className="flex min-h-9 items-center justify-between gap-2 border-b border-border/80 bg-transparent px-3"
        contentEditable={false}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            {language || 'code'}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-6 shrink-0"
          onClick={copy}
          title="Copy code"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
      <pre className="m-0 overflow-x-auto rounded-none border-0 bg-transparent p-4">
        <NodeViewContent
          className={cn(
            'block whitespace-pre font-mono text-[12px] leading-5 text-code-foreground outline-none',
            language && `language-${language}`
          )}
        />
      </pre>
    </NodeViewWrapper>
  )
}
