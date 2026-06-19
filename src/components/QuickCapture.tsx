import { useState, useEffect, useRef } from 'react'
import { Sparkles, CornerDownLeft, X } from 'lucide-react'
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

  return (
    <div className="w-screen h-screen flex flex-col p-4 bg-white dark:bg-[#1a1a1f] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden select-none">
      {/* Title Drag bar */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5 drag-region shrink-0">
        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Quick Capture Thought
        </span>
        <button 
          onClick={handleClose} 
          className="no-drag text-gray-400 hover:text-gray-200 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Thought Textarea */}
      <textarea
        ref={textareaRef}
        placeholder="What's on your mind?..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow w-full bg-transparent border-0 outline-none resize-none text-xs leading-relaxed placeholder-gray-500 pt-3 focus:ring-0 focus:ring-offset-0 px-0"
      />

      {/* Footer controls */}
      <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2 mt-2 shrink-0">
        <span className="text-[9px] text-gray-400">
          Press <kbd className="font-mono bg-black/10 dark:bg-white/10 px-1 rounded text-[8px]">Esc</kbd> to dismiss
        </span>
        <Button
          onClick={handleSave}
          disabled={!text.trim()}
          className="h-7 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shadow shadow-amber-500/10 transition-all"
        >
          Capture Note
          <CornerDownLeft className="w-3 h-3 text-white/80" />
        </Button>
      </div>
    </div>
  )
}
