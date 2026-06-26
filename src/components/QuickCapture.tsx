import { useState, useEffect, useRef } from 'react'
import { Sparkles, CornerDownLeft, X, Bold, Italic, Code, List, CheckSquare } from 'lucide-react'
import { Button } from './ui/button'
import { getAPI } from '../tauri-bridge'
import { cn } from '@/lib/utils'

export default function QuickCapture() {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSave = () => {
    if (!text.trim()) return

    const now = new Date()

    const note = {
      id: Math.random().toString(36).substring(2, 11),
      title: `Quick Thought - ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
      content: `<p>${text.trim().replace(/\n/g, '<br>')}</p>`,
      folder: 'personal',
      tags: ['quick-capture'],
      backlinks: [],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    const api = getAPI()
    if (api) {
      api.saveNote(note).then(() => {
        setText('')
        api.closeQuickCapture()
      })
    } else {
      const local = localStorage.getItem('noteszen-db-notes')
      const notes = local ? JSON.parse(local) : []
      notes.unshift(note)
      localStorage.setItem('noteszen-db-notes', JSON.stringify(notes))
      setText('')
      alert('Saved thought in browser: ' + note.title)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      getAPI()?.closeQuickCapture()
    }
  }

  const handleClose = () => {
    getAPI()?.closeQuickCapture()
  }

  const insertMarkdown = (syntax: string, wrapper = false) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = text.substring(start, end)

    let replacement = ''
    if (wrapper) {
      replacement = `${syntax}${selectedText || 'text'}${syntax}`
    } else {
      replacement = `${syntax}${selectedText}`
    }

    const newText = text.substring(0, start) + replacement + text.substring(end)
    setText(newText)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos =
        start + syntax.length + (selectedText ? selectedText.length : 0) + (wrapper ? syntax.length : 0)
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  const charCount = text.length

  return (
    <div className="w-screen h-screen flex items-center justify-center p-6 bg-transparent">
      <div
        className={cn(
          'w-full max-w-lg flex flex-col rounded-2xl overflow-hidden select-none',
          'bg-popover/70 backdrop-blur-2xl border border-white/10 dark:border-white/5',
          'shadow-2xl shadow-black/20 ring-1 ring-white/10'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 drag-region shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            Quick Capture
          </span>
          <button
            onClick={handleClose}
            className="no-drag text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border/20 shrink-0 no-drag">
          {[
            { icon: Bold, action: () => insertMarkdown('**', true), title: 'Bold' },
            { icon: Italic, action: () => insertMarkdown('*', true), title: 'Italic' },
            { icon: Code, action: () => insertMarkdown('`', true), title: 'Code' },
            { icon: List, action: () => insertMarkdown('- ', false), title: 'List' },
            { icon: CheckSquare, action: () => insertMarkdown('- [ ] ', false), title: 'Todo' },
          ].map(({ icon: Icon, action, title }) => (
            <Button
              key={title}
              variant="ghost"
              size="icon-xs"
              onClick={action}
              title={title}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon className="size-3.5" />
            </Button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow w-full min-h-[140px] bg-transparent border-0 outline-none resize-none text-sm leading-relaxed placeholder-muted-foreground/60 px-4 py-3 focus:ring-0 select-text"
        />

        <div className="flex items-center justify-between border-t border-border/30 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <kbd className="font-mono bg-muted/50 px-1 rounded text-[8px]">⌃↵</kbd>
            <span>save</span>
            <span className="text-border">·</span>
            <span>{wordCount}w · {charCount}c</span>
          </div>
          <Button onClick={handleSave} disabled={!text.trim()} size="sm" className="gap-1.5">
            Capture
            <CornerDownLeft className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}