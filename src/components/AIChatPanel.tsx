import { useState } from 'react'
import { Sparkles, X, Paperclip, Send, Copy, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useNotesStore } from '../store/useNotesStore'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function AIChatPanel({ onClose }: { onClose?: () => void }) {
  const { notes, selectedNoteId } = useNotesStore()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'I can help summarize notes, draft outlines, and brainstorm ideas. Connect an AI provider in Settings to enable live responses — for now I\'ll echo helpful placeholders.',
    },
  ])

  const activeNote = notes.find((n) => n.id === selectedNoteId)

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: input.trim() }
    const reply: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: activeNote
        ? `Here's a starting point based on "${activeNote.title}":\n\n• Key themes from your note\n• Suggested next steps\n• Outline for expansion\n\nConnect an API key in Settings for full AI responses.`
        : 'Select a note or attach context, then ask me to summarize, outline, or brainstorm. Full AI integration coming soon.',
    }
    setMessages((m) => [...m, userMsg, reply])
    setInput('')
  }

  return (
    <div className="flex h-full flex-col bg-card/50 border-l border-border/40">
      <div className="flex items-center justify-between px-4 h-11 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="size-3.5 text-primary" />
          AI Workspace
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" className="text-[10px] text-muted-foreground">
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
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'rounded-xl px-3 py-2.5 text-xs leading-relaxed max-w-[95%]',
                msg.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-foreground'
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === 'assistant' && msg.id !== 'welcome' && (
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="xs" className="h-7 text-[10px]">
                    <FileText className="size-3" />
                    Create a doc
                  </Button>
                  <Button variant="ghost" size="xs" className="h-7 text-[10px]">
                    <Copy className="size-3" />
                    Copy
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {activeNote && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
            <Paperclip className="size-3" />
            {activeNote.title || 'Untitled'}.md
          </span>
        </div>
      )}

      <div className="shrink-0 p-4 border-t border-border/40">
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
            placeholder="Ask AI about your notes..."
            className="min-h-[72px] pr-12 resize-none rounded-xl text-xs bg-background/80"
          />
          <Button
            size="icon-xs"
            className="absolute bottom-2 right-2"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}