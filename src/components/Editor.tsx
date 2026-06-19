import { useEffect, useState, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useNotesStore } from '../store/useNotesStore'
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Code, 
  Quote 
} from 'lucide-react'

export default function Editor() {
  const { notes, selectedNoteId, updateNote } = useNotesStore()
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const slashCoords = useRef({ top: 0, left: 0 })

  const activeNote = notes.find(n => n.id === selectedNoteId) || null

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder: 'Press / for commands, or write thoughts...'
      }),
      Link.configure({
        openOnClick: false
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      })
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none prose prose-stone dark:prose-invert max-w-none min-h-[400px] text-sm leading-relaxed pb-24 font-normal'
      },
      handleKeyDown(view, event) {
        if (event.key === '/') {
          const { selection } = view.state
          const coords = view.coordsAtPos(selection.from)
          slashCoords.current = {
            top: coords.top + window.scrollY + 24,
            left: coords.left + window.scrollX
          }
          setShowSlashMenu(true)
          setSelectedIndex(0)
        }
        
        if (showSlashMenu) {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelectedIndex(prev => (prev + 1) % COMMANDS.length)
            return true
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelectedIndex(prev => (prev - 1 + COMMANDS.length) % COMMANDS.length)
            return true
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            executeCommand(COMMANDS[selectedIndex])
            return true
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            setShowSlashMenu(false)
            return true
          }
        }
        return false
      }
    },
    onUpdate: ({ editor }) => {
      if (selectedNoteId) {
        // Save the HTML content (standard TipTap output)
        updateNote(selectedNoteId, { content: editor.getHTML() })
      }
    }
  })

  // Synchronize note contents on select and toggle editable state if note is in trash
  useEffect(() => {
    if (editor && activeNote) {
      if (editor.getHTML() !== activeNote.content) {
        editor.commands.setContent(activeNote.content || '')
      }
      editor.setEditable(activeNote.folder !== 'trash')
    }
  }, [selectedNoteId, editor, activeNote?.folder])

  // Simple clean-up slash menu when content is deleted
  useEffect(() => {
    if (editor && showSlashMenu) {
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, editor.state.selection.from - 10),
        editor.state.selection.from
      )
      if (!textBefore.includes('/')) {
        setShowSlashMenu(false)
      }
    }
  }, [editor?.state.selection.from])

  const COMMANDS = [
    {
      name: 'Heading 1',
      icon: Heading1,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleHeading({ level: 1 }).run()
    },
    {
      name: 'Heading 2',
      icon: Heading2,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleHeading({ level: 2 }).run()
    },
    {
      name: 'Heading 3',
      icon: Heading3,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleHeading({ level: 3 }).run()
    },
    {
      name: 'Bullet List',
      icon: List,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleBulletList().run()
    },
    {
      name: 'Numbered List',
      icon: ListOrdered,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleOrderedList().run()
    },
    {
      name: 'Task List',
      icon: CheckSquare,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleTaskList().run()
    },
    {
      name: 'Code Block',
      icon: Code,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleCodeBlock().run()
    },
    {
      name: 'Blockquote',
      icon: Quote,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleBlockquote().run()
    }
  ]

  const executeCommand = (cmd: typeof COMMANDS[0]) => {
    cmd.action()
    setShowSlashMenu(false)
  }

  // Find notes linking to the current note (Backlink References)
  const backlinks = useMemo(() => {
    if (!activeNote) return []
    return notes.filter(n => n.id !== activeNote.id && n.backlinks && n.backlinks.includes(activeNote.id))
  }, [notes, activeNote])

  if (!activeNote) {
    return (
      <div className="flex-grow flex items-center justify-center text-gray-500">
        No active note
      </div>
    )
  }

  return (
    <div className="relative flex-grow flex flex-col px-10 py-6 overflow-y-auto select-text">
      <EditorContent editor={editor} />

      {/* Floating Slash Commands Menu */}
      {showSlashMenu && (
        <div 
          className="absolute z-50 w-52 rounded-xl shadow-xl border bg-white dark:bg-[#1a1a1f] border-black/10 dark:border-white/10 p-1 divide-y divide-black/5 dark:divide-white/5"
          style={{
            top: `${slashCoords.current.top}px`,
            left: `${slashCoords.current.left}px`,
            position: 'absolute'
          }}
        >
          <div className="p-1 space-y-0.5 max-h-[220px] overflow-y-auto scrollbar-thin">
            {COMMANDS.map((cmd, i) => {
              const Icon = cmd.icon
              const isSelected = i === selectedIndex
              return (
                <button
                  key={cmd.name}
                  onClick={() => executeCommand(cmd)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left
                    ${isSelected 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{cmd.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Backlinks Panel (Linked references) */}
      {backlinks.length > 0 && (
        <div className="mt-auto border-t border-black/5 dark:border-white/5 pt-6 pb-4">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-gray-400/80 mb-2">Linked References ({backlinks.length})</h4>
          <div className="space-y-1.5">
            {backlinks.map((linkNote: any) => (
              <button
                key={linkNote.id}
                onClick={() => {
                  const state = useNotesStore.getState()
                  state.setSelectedNoteId(linkNote.id)
                }}
                className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-amber-500 p-2 rounded-lg bg-black/[0.01] dark:bg-white/[0.01] hover:bg-amber-500/5 transition-all text-left"
              >
                <span className="font-semibold truncate max-w-[400px]">{linkNote.title}</span>
                <span className="text-[9px] text-gray-400 font-medium">[[{linkNote.title}]]</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
