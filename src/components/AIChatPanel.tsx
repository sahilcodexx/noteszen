import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Paperclip, Send, Copy, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useNotesStore } from '../store/useNotesStore'
import { getOpenRouterApiKey, getOpenRouterModel } from '../lib/ai-settings'
import { buildNoteContext, streamChatCompletion } from '../lib/openrouter'
import { notify } from '../lib/toast'
import AITypingIndicator from './AITypingIndicator'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'I can help summarize notes, draft outlines, and brainstorm ideas. Ask me anything about your notes.',
}

export default function AIChatPanel({ onClose }: { onClose?: () => void }) {
  const { notes, selectedNoteId, createNote } = useNotesStore()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeNote = notes.find((n) => n.id === selectedNoteId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  const handleClear = () => {
    abortRef.current?.abort()
    setMessages([WELCOME])
    setIsLoading(false)
    setStreamingId(null)
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const apiKey = getOpenRouterApiKey()
    if (!apiKey) {
      notify.error('Add your OpenRouter API key in Settings → AI')
      return
    }

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text }
    const assistantId = `a-${Date.now()}`
    setMessages((m) => [...m, userMsg, { id: assistantId, role: 'assistant', content: '' }])
    setInput('')
    setIsLoading(true)
    setStreamingId(assistantId)

    const controller = new AbortController()
    abortRef.current = controller

    const systemParts = [
      'You are a helpful writing assistant inside NotesZen, a note-taking app.',
      'Be concise, practical, and friendly. Use markdown when helpful.',
    ]
    if (activeNote) {
      systemParts.push(`The user has this note open:\n\n${buildNoteContext(activeNote.title, activeNote.content)}`)
    }

    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    try {
      await streamChatCompletion({
        apiKey,
        model: getOpenRouterModel(),
        messages: [
          { role: 'system', content: systemParts.join('\n\n') },
          ...history,
          { role: 'user', content: text },
        ],
        signal: controller.signal,
        onDelta: (content) => {
          setMessages((m) =>
            m.map((msg) => (msg.id === assistantId ? { ...msg, content } : msg))
          )
        },
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const errMsg = (err as Error).message || 'AI request failed'
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `Sorry, something went wrong: ${errMsg}` }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      setStreamingId(null)
      abortRef.current = null
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    notify.success('Copied to clipboard')
  }

  const createDocFromMessage = (content: string) => {
    const title = content.split('\n')[0]?.replace(/^#+\s*/, '').slice(0, 60) || 'AI Draft'
    createNote({ title, content, status: 'draft' })
    notify.success('Note created from AI response')
  }

  return (
    <div className="flex h-full flex-col workspace-surface">
      <div className="flex items-center justify-between px-4 h-11 border-b border-[var(--workspace-border)] shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="size-3.5 text-primary" />
          AI Workspace
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            className="text-[10px] text-muted-foreground"
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear chat
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon-xs" onClick={onClose}>
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const isStreaming = isLoading && msg.id === streamingId && !msg.content
            return (
              <div
                key={msg.id}
                className={cn(
                  'rounded-xl px-3 py-2.5 text-xs leading-relaxed max-w-[95%]',
                  msg.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-[var(--workspace-subtle)] text-foreground border border-[var(--workspace-border)]'
                )}
              >
                {isStreaming ? (
                  <AITypingIndicator />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.role === 'assistant' && msg.id !== 'welcome' && msg.content && !isStreaming && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-7 text-[10px]"
                      onClick={() => createDocFromMessage(msg.content)}
                    >
                      <FileText className="size-3" />
                      Create a doc
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-7 text-[10px]"
                      onClick={() => copyMessage(msg.content)}
                    >
                      <Copy className="size-3" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {activeNote && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--workspace-subtle)] px-2 py-1 text-[10px] text-muted-foreground border border-[var(--workspace-border)]">
            <Paperclip className="size-3" />
            {activeNote.title || 'Untitled'}.md
          </span>
        </div>
      )}

      <div className="shrink-0 p-4 border-t border-[var(--workspace-border)]">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={isLoading ? 'AI is replying...' : 'Ask AI about your notes...'}
            disabled={isLoading}
            className={cn(
              'min-h-[72px] pr-12 resize-none rounded-xl text-xs bg-[var(--workspace-subtle)] border-[var(--workspace-border)]',
              isLoading && 'opacity-70'
            )}
          />
          <Button
            size="icon-xs"
            className="absolute bottom-2 right-2"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}