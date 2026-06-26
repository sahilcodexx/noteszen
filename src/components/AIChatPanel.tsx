import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Sparkles,
  X,
  Paperclip,
  Send,
  Copy,
  FileText,
  Square,
  Plus,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useNotesStore } from '../store/useNotesStore'
import { FREE_MODELS, getOpenRouterApiKey, getOpenRouterModel } from '../lib/ai-settings'
import { buildNoteContext, streamChatCompletion } from '../lib/openrouter'
import {
  appendAiContentToNote,
  markdownToChatHtml,
  prepareAiNoteFromOutput,
} from '../lib/ai-output'
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

function makeWelcome(): Message {
  return { ...WELCOME, id: `welcome-${Date.now()}` }
}

interface NotePreviewState {
  title: string
  contentHtml: string
  tags: string[]
}

export default function AIChatPanel({ onClose }: { onClose?: () => void }) {
  const {
    notes,
    selectedNoteId,
    createNote,
    updateNote,
    openNote,
    isAIPanelExpanded,
    toggleAIPanelExpanded,
  } = useNotesStore()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([makeWelcome()])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [notePreview, setNotePreview] = useState<NotePreviewState | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const streamingIdRef = useRef<string | null>(null)
  const generationRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeModel =
    FREE_MODELS.find((m) => m.id === getOpenRouterModel())?.label ?? getOpenRouterModel()

  const activeNote = notes.find((n) => n.id === selectedNoteId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  useEffect(() => {
    streamingIdRef.current = streamingId
  }, [streamingId])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
    setStreamingId(null)
    streamingIdRef.current = null
  }, [])

  const resetChat = useCallback(
    (notifyUser?: boolean) => {
      stopGeneration()
      setInput('')
      setMessages([makeWelcome()])
      if (notifyUser) notify.success('New chat started')
    },
    [stopGeneration]
  )

  const handleStop = () => {
    const currentStreamId = streamingIdRef.current
    generationRef.current += 1
    abortRef.current?.abort()
    setIsLoading(false)
    setStreamingId(null)
    streamingIdRef.current = null

    if (currentStreamId) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === currentStreamId && !msg.content.trim()
            ? { ...msg, content: 'Stopped.' }
            : msg
        )
      )
    }
  }

  const handleClear = () => resetChat(false)

  const handleNewChat = () => resetChat(true)

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
    const generation = ++generationRef.current

    const systemParts = [
      'You are a helpful writing assistant inside NotesZen, a note-taking app.',
      'Answer the user directly. Start with the substance — never open with meta commentary about the app, copy/paste, or "here is a breakdown you can paste".',
      'Be concise, practical, and friendly. Use markdown when helpful (headings, lists, bold).',
      'Do not mention that you are formatting for notes unless the user explicitly asks.',
    ]
    if (activeNote) {
      systemParts.push(
        `The user has this note open:\n\n${buildNoteContext(activeNote.title, activeNote.content)}`
      )
    }

    const history = messages
      .filter((m) => !m.id.startsWith('welcome'))
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
          if (generation !== generationRef.current) return
          if (controller.signal.aborted) return
          setMessages((m) =>
            m.map((msg) => (msg.id === assistantId ? { ...msg, content } : msg))
          )
        },
      })
    } catch (err) {
      if (generation !== generationRef.current) return
      if ((err as Error).name === 'AbortError') {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId && !msg.content.trim()
              ? { ...msg, content: 'Stopped.' }
              : msg
          )
        )
        return
      }
      const errMsg = (err as Error).message || 'AI request failed'
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId ? { ...msg, content: `Sorry, something went wrong: ${errMsg}` } : msg
        )
      )
    } finally {
      if (generation === generationRef.current) {
        setIsLoading(false)
        setStreamingId(null)
        streamingIdRef.current = null
        abortRef.current = null
      }
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    notify.success('Copied to clipboard')
  }

  const openNotePreview = (content: string) => {
    const prepared = prepareAiNoteFromOutput(content)
    setNotePreview({
      title: prepared.title,
      contentHtml: prepared.contentHtml,
      tags: prepared.tags,
    })
  }

  const handleCreateNoteFromPreview = () => {
    if (!notePreview) return
    createNote({
      title: notePreview.title.trim() || 'AI Draft',
      content: notePreview.contentHtml,
      status: 'draft',
      icon: '✨',
      tags: notePreview.tags,
    })
    setNotePreview(null)
    notify.success('Note created with formatted AI content')
  }

  const handleAppendToOpenNote = () => {
    if (!notePreview || !activeNote) return
    const merged = appendAiContentToNote(activeNote.content, notePreview.contentHtml)
    const tags = [...new Set([...(activeNote.tags || []), ...notePreview.tags])]
    updateNote(activeNote.id, { content: merged, tags })
    openNote(activeNote.id)
    setNotePreview(null)
    notify.success('AI content added to your open note')
  }

  return (
    <div className="flex h-full flex-col workspace-surface min-w-0">
      <div className="flex items-center justify-between px-3 h-11 border-b border-[var(--workspace-border)] shrink-0 gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold min-w-0">
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span className="truncate">AI Workspace</span>
          <span className="text-[10px] font-normal text-muted-foreground truncate hidden sm:inline">
            · {activeModel}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleNewChat}
            title="New chat"
          >
            <Plus className="size-3.5" />
          </Button>
          {isLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="text-[10px] text-destructive gap-1 h-7"
              onClick={handleStop}
            >
              <Square className="size-3 fill-current" />
              Stop
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              className="text-[10px] text-muted-foreground h-7"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleAIPanelExpanded}
            title={isAIPanelExpanded ? 'Shrink panel' : 'Expand panel'}
          >
            {isAIPanelExpanded ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon-xs" onClick={onClose}>
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4 min-h-0">
        <div className="flex flex-col gap-3 min-w-0">
          {messages.map((msg) => {
            const isStreaming = isLoading && msg.id === streamingId && !msg.content.trim()
            const isWelcome = msg.id.startsWith('welcome')
            return (
              <div
                key={msg.id}
                className={cn(
                  'rounded-xl px-3 py-2.5 text-xs leading-relaxed max-w-full min-w-0',
                  msg.role === 'user'
                    ? 'ml-auto max-w-[92%] bg-primary text-primary-foreground'
                    : 'bg-[var(--workspace-subtle)] text-foreground border border-[var(--workspace-border)]'
                )}
              >
                {isStreaming ? (
                  <AITypingIndicator />
                ) : msg.role === 'assistant' && !isWelcome ? (
                  <div
                    className="prose-editor ai-chat-prose break-words [&_pre]:my-2 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:bg-black/20 [&_pre]:overflow-x-auto [&_code]:text-[11px] [&_h2]:text-sm [&_h3]:text-xs [&_p]:my-1"
                    dangerouslySetInnerHTML={{ __html: markdownToChatHtml(msg.content) }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
                {msg.role === 'assistant' && !isWelcome && msg.content.trim() && !isStreaming && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-7 text-[10px]"
                      onClick={() => openNotePreview(msg.content)}
                    >
                      <FileText className="size-3" />
                      Save to note
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

      <Dialog open={Boolean(notePreview)} onOpenChange={(open) => !open && setNotePreview(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col no-drag">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Review before saving
            </DialogTitle>
          </DialogHeader>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            AI output is cleaned and converted to formatted note content. Edit the title, then
            create a new note or append to your open note.
          </p>
          <Input
            value={notePreview?.title ?? ''}
            onChange={(e) =>
              setNotePreview((prev) => (prev ? { ...prev, title: e.target.value } : prev))
            }
            placeholder="Note title"
            className="h-8 text-xs"
          />
          <ScrollArea className="flex-1 max-h-[45vh] rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-subtle)] px-3 py-3">
            <div
              className="prose-editor ai-note-preview text-xs break-words"
              dangerouslySetInnerHTML={{ __html: notePreview?.contentHtml ?? '' }}
            />
          </ScrollArea>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setNotePreview(null)}>
              Cancel
            </Button>
            {activeNote && (
              <Button variant="secondary" size="sm" onClick={handleAppendToOpenNote}>
                Add to open note
              </Button>
            )}
            <Button size="sm" onClick={handleCreateNoteFromPreview}>
              Create new note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="shrink-0 p-4 border-t border-[var(--workspace-border)]">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (isLoading) handleStop()
                else handleSend()
              }
            }}
            placeholder={isLoading ? 'Press Stop or Enter to cancel...' : 'Ask AI about your notes...'}
            className={cn(
              'min-h-[72px] pr-12 resize-none rounded-xl text-xs bg-[var(--workspace-subtle)] border-[var(--workspace-border)]',
              isLoading && 'opacity-80'
            )}
          />
          <Button
            type="button"
            size="icon-xs"
            className="absolute bottom-2 right-2"
            onClick={isLoading ? handleStop : handleSend}
            disabled={!isLoading && !input.trim()}
            variant={isLoading ? 'destructive' : 'default'}
          >
            {isLoading ? (
              <Square className="size-3 fill-current" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}