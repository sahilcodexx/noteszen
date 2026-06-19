import { useState, useEffect, useRef } from 'react'
import { Sparkles, CornerDownLeft, X, Bold, Italic, Code, List, CheckSquare } from 'lucide-react'
import { Button } from './ui/button'

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
      updatedAt: now.toISOString()
    }

    if (window.electronAPI) {
      window.electronAPI.saveNote(note).then(() => {
        setText('')
        window.electronAPI.closeQuickCapture()
      })
    } else {
      // Browser test fallback
      const local = localStorage.getItem('noteszen-db-notes')
      const notes = local ? JSON.parse(local) : []
      notes.unshift(note)
      localStorage.setItem('noteszen-db-notes', JSON.stringify(notes))
      setText('')
      alert('Saved thought in browser: ' + note.title)
    }
  }

  // Handle keys (Ctrl+Enter to save, Escape to close)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (window.electronAPI) {
        window.electronAPI.closeQuickCapture()
      }
    }
  }

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeQuickCapture()
    }
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
      const newCursorPos = start + syntax.length + (selectedText ? selectedText.length : 0) + (wrapper ? syntax.length : 0)
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  const charCount = text.length

  return (
    <div className="w-screen h-screen flex flex-col p-4 bg-popover text-popover-foreground border border-border rounded-2xl overflow-hidden select-none">
      {/* Title Drag bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border drag-region shrink-0">
        <span className="text-[10px] uppercase font-bold tracking-wider text-primary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Quick Capture Thought
        </span>
        <button 
          onClick={handleClose} 
          className="no-drag text-muted-foreground hover:text-foreground p-0.5 rounded-lg hover:bg-muted"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Toolbar (Markdown helpers) */}
      <div className="flex items-center gap-1 py-1.5 border-b border-border/40 shrink-0 no-drag">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => insertMarkdown('**', true)}
          title="Bold"
          className="text-muted-foreground hover:text-foreground"
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => insertMarkdown('*', true)}
          title="Italic"
          className="text-muted-foreground hover:text-foreground"
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => insertMarkdown('`', true)}
          title="Code"
          className="text-muted-foreground hover:text-foreground"
        >
          <Code className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-3.5 bg-border/60 mx-1" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => insertMarkdown('- ', false)}
          title="Bullet List"
          className="text-muted-foreground hover:text-foreground"
        >
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => insertMarkdown('- [ ] ', false)}
          title="Todo List"
          className="text-muted-foreground hover:text-foreground"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Thought Textarea */}
      <textarea
        ref={textareaRef}
        placeholder="What's on your mind?..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow w-full bg-transparent border-0 outline-none resize-none text-xs leading-relaxed placeholder-muted-foreground pt-3 focus:ring-0 focus:ring-offset-0 px-0 select-text"
      />

      {/* Footer controls */}
      <div className="flex items-center justify-between border-t border-border pt-2 mt-2 shrink-0 select-none">
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span>Press <kbd className="font-mono bg-muted px-1 rounded text-[8px]">Esc</kbd> to dismiss</span>
          <div className="w-px h-2.5 bg-border/60" />
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <div className="w-px h-2.5 bg-border/60" />
          <span>{charCount} {charCount === 1 ? 'char' : 'chars'}</span>
        </div>
        <Button
          onClick={handleSave}
          disabled={!text.trim()}
          variant="default"
          size="sm"
        >
          Capture Note
          <CornerDownLeft data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
