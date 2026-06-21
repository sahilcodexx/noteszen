import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
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
  Quote,
  Bold,
  Italic,
  Strikethrough,
  Minus,
  Plus,
  Undo,
  Redo,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Check,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Tag,
  X,
  Clock,
  Calendar,
  Folder,
  FileSpreadsheet,
  Pin,
  Star,
  Archive,
  Menu
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu'

// Gradients list
const COVERS = {
  'Indigo Fusion': 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
  'Sunset Glow': 'bg-gradient-to-r from-orange-400 via-pink-500 to-red-500',
  'Ocean Wave': 'bg-gradient-to-r from-teal-400 to-blue-500',
  'Northern Lights': 'bg-gradient-to-r from-green-300 via-blue-500 to-purple-600',
  'Cyberpunk Neon': 'bg-gradient-to-r from-fuchsia-500 via-rose-500 to-violet-600',
  'Minimal Slate': 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950',
  'Golden Hour': 'bg-gradient-to-r from-amber-200 via-orange-400 to-rose-500',
}

// Emojis list
const EMOJIS = [
  '📝', '🚀', '💡', '📅', '🎯', '🔥', '💻', '🎨', '🧠', '📚',
  '🌟', '✈️', '🏝️', '🍀', '🌈', '🍕', '☕', '🐱', '🐶', '🦊',
  '🔒', '🔑', '📊', '💬', '🛠️', '🎵', '🌿', '🏔️', '🪐', '👾'
]

// Helper function to format relative times beautifully
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) {
      return 'just now'
    } else if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }
  } catch (e) {
    return 'some time ago'
  }
}

// Utility function to convert Tiptap HTML to Markdown
function htmlToMarkdown(html: string): string {
  if (!html) return ''
  let md = html
  
  // Replace headings
  md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
  md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
  md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
  
  // Code blocks
  md = md.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    const cleanCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    return `\`\`\`\n${cleanCode}\n\`\`\`\n\n`
  })
  
  // Inline code
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`')
  
  // Blockquotes
  md = md.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (_, text) => {
    const lines = text.trim().split('\n').map((l: string) => `> ${l.replace(/<[^>]*>/g, '')}`)
    return lines.join('\n') + '\n\n'
  })
  
  // Task lists
  md = md.replace(/<li data-type="taskItem" data-checked="true">([\s\S]*?)<\/li>/gi, '- [x] $1\n')
  md = md.replace(/<li data-type="taskItem" data-checked="false">([\s\S]*?)<\/li>/gi, '- [ ] $1\n')
  md = md.replace(/<li data-type="taskItem">([\s\S]*?)<\/li>/gi, '- [ ] $1\n')
  
  // Unordered list
  md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n')
  md = md.replace(/<\/ul>/gi, '\n')
  md = md.replace(/<\/ol>/gi, '\n')
  
  // Bold & Italic
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**')
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*')
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*')
  md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
  md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~')
  
  // Links
  md = md.replace(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  
  // Horizontal Rule
  md = md.replace(/<hr\s*\/?>/gi, '---\n\n')
  
  // Clean paragraphs
  md = md.replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
  
  // Remove remaining HTML tags
  md = md.replace(/<[^>]*>/g, '')
  
  // Decode common HTML entities
  md = md.replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
  
  return md.trim()
}

export default function Editor() {
  const { 
    notes, 
    selectedNoteId, 
    updateNote, 
    editorFont, 
    editorFontSize, 
    setEditorFontSize,
    isZenMode, 
    setZenMode,
    togglePin,
    toggleFavorite,
    toggleArchive,
    saveStatus
  } = useNotesStore()
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const slashCoords = useRef({ top: 0, left: 0 })

  const activeNote = notes.find(n => n.id === selectedNoteId) || null

  // Zoom handlers for text sizing (14px to 128px)
  const handleZoomIn = () => {
    setEditorFontSize(Math.min(128, editorFontSize + 2))
  }

  const handleZoomOut = () => {
    setEditorFontSize(Math.max(14, editorFontSize - 2))
  }

  // Local metadata states (emoji icon and cover image background)
  const [noteMetadata, setNoteMetadata] = useState<{ icon?: string, cover?: string, status?: string }>({})

  // Load custom metadata on active note selection changes
  useEffect(() => {
    if (activeNote) {
      const stored = localStorage.getItem(`noteszen-meta-${activeNote.id}`)
      if (stored) {
        try {
          setNoteMetadata(JSON.parse(stored))
        } catch (e) {
          setNoteMetadata({})
        }
      } else {
        setNoteMetadata({})
      }
    }
  }, [activeNote?.id])

  const updateMetadata = (fields: { icon?: string | null, cover?: string | null, status?: string | null }) => {
    if (!activeNote) return
    const newMeta = { ...noteMetadata }
    
    if (fields.icon !== undefined) {
      if (fields.icon === null) delete newMeta.icon
      else newMeta.icon = fields.icon
    }
    if (fields.cover !== undefined) {
      if (fields.cover === null) delete newMeta.cover
      else newMeta.cover = fields.cover
    }
    if (fields.status !== undefined) {
      if (fields.status === null) delete newMeta.status
      else newMeta.status = fields.status
    }

    setNoteMetadata(newMeta)
    localStorage.setItem(`noteszen-meta-${activeNote.id}`, JSON.stringify(newMeta))
  }

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
        class: 'focus:outline-none prose-editor max-w-none min-h-[450px] leading-relaxed pb-24 font-normal'
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
        
        // Escape inside Zen Mode toggles Zen Mode back
        if (event.key === 'Escape' && isZenMode && !showSlashMenu) {
          event.preventDefault()
          setZenMode(false)
          return true
        }

        return false
      }
    },
    onUpdate: ({ editor }) => {
      if (selectedNoteId) {
        updateNote(selectedNoteId, { content: editor.getHTML() })
      }
    }
  })

  // Synchronize note contents on select and toggle editable state
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
    },
    {
      name: 'Divider',
      icon: Minus,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).setHorizontalRule().run()
    }
  ]

  const executeCommand = (cmd: typeof COMMANDS[0]) => {
    cmd.action()
    setShowSlashMenu(false)
  }

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeNote || !tagInput.trim()) return
    const tag = tagInput.trim().toLowerCase()
    if (!activeNote.tags.includes(tag)) {
      const updatedTags = [...activeNote.tags, tag]
      updateNote(activeNote.id, { tags: updatedTags })
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    if (!activeNote) return
    const updatedTags = activeNote.tags.filter(t => t !== tag)
    updateNote(activeNote.id, { tags: updatedTags })
  }

  // Copy as Markdown handler
  const handleCopyMarkdown = () => {
    if (!editor) return
    const md = htmlToMarkdown(editor.getHTML())
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Export as Markdown handler
  const handleExportMarkdown = () => {
    if (!editor || !activeNote) return
    const md = htmlToMarkdown(editor.getHTML())
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeNote.title || 'Untitled Note'}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Link trigger in bubble menu
  const setLink = () => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter Link URL:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  // Stats Counters
  const textContent = editor ? editor.getText() : ''
  const wordCount = useMemo(() => {
    if (!textContent.trim()) return 0
    return textContent.trim().split(/\s+/).length
  }, [textContent])

  const charCount = textContent.length

  const readingTime = useMemo(() => {
    const wpm = 200
    const mins = wordCount / wpm
    const secs = Math.ceil(mins * 60)
    if (secs < 60) return `${secs}s read`
    return `${Math.ceil(mins)}m read`
  }, [wordCount])

  // backlinks reference list
  const backlinks = useMemo(() => {
    if (!activeNote) return []
    return notes.filter(n => n.id !== activeNote.id && n.backlinks && n.backlinks.includes(activeNote.id))
  }, [notes, activeNote])

  if (!activeNote) {
    return (
      <div className="flex-grow flex items-center justify-center text-muted-foreground select-none">
        No active note
      </div>
    )
  }

  const isTrashNote = activeNote.folder === 'trash'

  return (
    <div className={cn(
      "flex-grow flex flex-col h-full overflow-hidden select-text relative bg-transparent transition-all duration-300",
      isZenMode && "bg-white dark:bg-black"
    )}>
      
      {/* 1. STICKY FORMATTING TOOLBAR */}
      {!isZenMode && (
        <div className="relative h-11 border-b border-border/40 bg-background/50 backdrop-blur-md px-6 flex items-center shrink-0 select-none z-20 animate-in fade-in duration-200 w-full">
          {/* Centered Formatting Buttons */}
          <div className="max-w-2xl mx-auto w-full h-full flex items-center justify-center">
            {isTrashNote ? (
              <div className="text-[10px] text-destructive font-semibold tracking-wide flex items-center gap-1.5 bg-destructive/5 px-2.5 py-1 rounded-md border border-destructive/10">
                Note is in Trash Bin (Read-Only)
              </div>
            ) : (
              <div className="flex items-center flex-wrap gap-0.5">
                {/* Text formatting styles */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={cn("h-7 w-7 p-0", editor?.isActive('bold') && "bg-muted text-foreground")}
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={cn("h-7 w-7 p-0", editor?.isActive('italic') && "bg-muted text-foreground")}
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  className={cn("h-7 w-7 p-0", editor?.isActive('strike') && "bg-muted text-foreground")}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleCode().run()}
                  className={cn("h-7 w-7 p-0", editor?.isActive('code') && "bg-muted text-foreground")}
                  title="Inline Code"
                >
                  <Code className="w-3.5 h-3.5" />
                </Button>

                <div className="h-4 w-px bg-border/50 mx-1.5 shrink-0" />

                {/* Paragraph */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().setParagraph().run()}
                  className={cn("h-7 w-7 p-0 text-xs font-semibold", editor?.isActive('paragraph') && !editor?.isActive('heading') && "bg-muted text-foreground")}
                  title="Paragraph (Normal Text)"
                >
                  P
                </Button>

                {/* Headings */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={cn("h-7 w-7 p-0 text-xs font-extrabold", editor?.isActive('heading', { level: 1 }) && "bg-muted text-foreground")}
                  title="Heading 1"
                >
                  H1
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={cn("h-7 w-7 p-0 text-xs font-bold", editor?.isActive('heading', { level: 2 }) && "bg-muted text-foreground")}
                  title="Heading 2"
                >
                  H2
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={cn("h-7 w-7 p-0 text-xs font-semibold", editor?.isActive('heading', { level: 3 }) && "bg-muted text-foreground")}
                  title="Heading 3"
                >
                  H3
                </Button>

                <div className="h-4 w-px bg-border/50 mx-1.5 shrink-0" />

                {/* Lists */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={cn("h-7 w-7 p-0", editor?.isActive('bulletList') && "bg-muted text-foreground")}
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={cn("h-7 w-7 p-0", editor?.isActive('orderedList') && "bg-muted text-foreground")}
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleTaskList().run()}
                  className={cn("h-7 w-7 p-0", editor?.isActive('taskList') && "bg-muted text-foreground")}
                  title="Task List"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </Button>

                <div className="h-4 w-px bg-border/50 mx-1.5 shrink-0" />

                {/* Blocks */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  className={cn("h-7 w-7 p-0", editor?.isActive('blockquote') && "bg-muted text-foreground")}
                  title="Blockquote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                  className={cn("h-7 w-7 p-0", editor?.isActive('codeBlock') && "bg-muted text-foreground")}
                  title="Code Block"
                >
                  <FileText className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                  className="h-7 w-7 p-0"
                  title="Horizontal Divider"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>

                <div className="h-4 w-px bg-border/50 mx-1.5 shrink-0" />

                {/* Undo Redo */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className="h-7 w-7 p-0"
                  title="Undo"
                >
                  <Undo className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className="h-7 w-7 p-0"
                  title="Redo"
                >
                  <Redo className="w-3.5 h-3.5" />
                </Button>

                <div className="h-4 w-px bg-border/50 mx-1.5 shrink-0" />

                {/* Zoom out text size (-) */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleZoomOut}
                  disabled={editorFontSize <= 14}
                  className="h-7 w-7 p-0"
                  title="Zoom Out Text"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>

                {/* Text Size Label */}
                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 select-none px-1.5 min-w-[28px] text-center bg-muted/30 rounded py-0.5">
                  {editorFontSize}px
                </span>

                {/* Zoom in text size (+) */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleZoomIn}
                  disabled={editorFontSize >= 128}
                  className="h-7 w-7 p-0"
                  title="Zoom In Text"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Far Right Action buttons (Markdown, Export, and Zoom/Zen Toggle) */}
          <div className="absolute right-6 flex items-center gap-1.5 pl-2 border-l border-border/40 shrink-0">
            <Button
              size="xs"
              variant="outline"
              onClick={handleCopyMarkdown}
              className="text-[10px] h-7 px-2"
              title="Copy as Markdown"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-primary mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1 text-muted-foreground" />
                  Markdown
                </>
              )}
            </Button>

            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleExportMarkdown}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Export as Markdown file"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setZenMode(true)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Zen Focus Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 2. FLOATING BUBBLE FORMATTING MENU */}
      {editor && !isTrashNote && (
        <BubbleMenu 
          editor={editor} 
          options={{}}
          className="flex items-center gap-0.5 bg-card text-card-foreground border border-border shadow-xl rounded-xl p-1 animate-in fade-in zoom-in-95 duration-100"
        >
          <Button
            size="xs"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("h-7 w-7 p-0", editor.isActive('bold') && "bg-muted text-foreground")}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("h-7 w-7 p-0", editor.isActive('italic') && "bg-muted text-foreground")}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn("h-7 w-7 p-0", editor.isActive('strike') && "bg-muted text-foreground")}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn("h-7 w-7 p-0", editor.isActive('code') && "bg-muted text-foreground")}
            title="Code"
          >
            <Code className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={setLink}
            className={cn("h-7 w-7 p-0", editor.isActive('link') && "bg-muted text-foreground")}
            title="Add Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </Button>
        </BubbleMenu>
      )}

      {/* 3. FLOAT ESCAPE ZEN MODE BUTTON */}
      {isZenMode && (
        <div className="absolute top-4 right-4 z-30 select-none opacity-20 hover:opacity-100 transition-opacity duration-200">
          <Button
            size="xs"
            variant="outline"
            onClick={() => setZenMode(false)}
            className="flex items-center gap-1.5 text-[10px] h-7 px-2.5 rounded-lg bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground font-semibold"
          >
            <Minimize2 className="w-3 h-3" />
            <span>Exit Focus</span>
          </Button>
        </div>
      )}

      {/* 4. MAIN SCROLLABLE EDITOR CONTAINER */}
      <div 
        className={cn(
          "flex-grow overflow-y-auto w-full transition-all duration-300 relative group/editor-container max-w-2xl mx-auto bg-background/80 border-x border-border/30 px-6 md:px-8 py-12 scrollbar-none",
          `editor-font-${editorFont}`
        )}
        style={{ '--editor-font-size': `${editorFontSize}px` } as React.CSSProperties}
      >
        
        {/* A. Note Cover Banner image display */}
        {noteMetadata.cover ? (
          <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-6 group/cover shadow-xs border border-border/10 animate-in slide-in-from-top duration-300">
            <div className={cn("w-full h-full", noteMetadata.cover)} />
            {!isTrashNote && (
              <div className="absolute bottom-3 right-3 opacity-0 group-hover/cover:opacity-100 transition-opacity flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="xs" variant="outline" className="bg-card/90 text-xs backdrop-blur-md font-semibold text-foreground/80 hover:bg-card">
                      Change Cover
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Select Gradient</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(COVERS).map(([key, value]) => (
                      <DropdownMenuItem key={key} onClick={() => updateMetadata({ cover: value })}>
                        <div className="flex items-center gap-2 w-full cursor-pointer">
                          <div className={cn("w-4.5 h-4.5 rounded-full border border-border/30", value)} />
                          <span className="text-xs font-semibold">{key}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="xs" variant="destructive" onClick={() => updateMetadata({ cover: null })} className="backdrop-blur-md">
                  Remove
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {/* B. Big Emoji Icon picker (Only rendered if emoji was chosen) */}
        {noteMetadata.icon ? (
          <div className="relative inline-block mb-3 group/icon select-none animate-in fade-in duration-250">
            <div className="text-5xl select-none filter drop-shadow-sm leading-none pt-2 pb-1 hover:scale-105 transition-transform duration-200">
              {noteMetadata.icon}
            </div>
            {!isTrashNote && (
              <div className="absolute -top-1 -right-16 opacity-0 group-hover/icon:opacity-100 transition-opacity flex gap-1 animate-in zoom-in-95 duration-100 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-[9px] bg-card border rounded-md px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted font-bold transition-all shadow-xs">
                      Change
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 max-h-56 overflow-y-auto">
                    <DropdownMenuLabel>Select Emoji</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="grid grid-cols-5 gap-1 p-2">
                      {EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => updateMetadata({ icon: emoji })}
                          className="text-xl p-1 hover:bg-muted rounded text-center transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button 
                  onClick={() => updateMetadata({ icon: null })}
                  className="text-[9px] bg-destructive/10 border border-destructive/20 text-destructive rounded-md px-1.5 py-0.5 hover:bg-destructive/20 font-bold transition-all shadow-xs"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* C. Inline Note Title Input */}
        <input
          type="text"
          placeholder="Untitled Note"
          value={activeNote.title || ''}
          onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
          disabled={isTrashNote}
          className="text-3xl font-semibold font-heading tracking-tight bg-transparent border-0 outline-none p-0 focus:ring-0 w-full placeholder-muted-foreground/20 mb-6 text-black dark:text-white opacity-70 focus:opacity-100 transition-opacity duration-200"
        />

        {/* D. Clean Writing Slate (Tiptap Content) */}
        <EditorContent editor={editor} />



        {/* Backlinks Panel (Linked references) */}
        {backlinks.length > 0 && !isZenMode && (
          <div className="mt-16 border-t border-border/40 pt-8 pb-12 select-none animate-in fade-in duration-300">
            <h4 className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary/70 animate-pulse" />
              Linked References ({backlinks.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {backlinks.map((linkNote: any) => (
                <button
                  key={linkNote.id}
                  onClick={() => {
                    const state = useNotesStore.getState()
                    state.setSelectedNoteId(linkNote.id)
                  }}
                  className="flex flex-col items-start gap-1 p-3 rounded-xl border border-border/40 bg-card/45 hover:bg-primary/5 hover:border-primary/20 transition-all text-left group shadow-xs"
                >
                  <div className="w-full flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-foreground/90 group-hover:text-primary transition-colors truncate">{linkNote.title || 'Untitled Note'}</span>
                    <span className="text-[9px] text-muted-foreground font-semibold shrink-0">[[{linkNote.title || 'Untitled'}]]</span>
                  </div>
                  {linkNote.content && (
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed" 
                       dangerouslySetInnerHTML={{ __html: linkNote.content.replace(/<[^>]*>/g, '').substring(0, 100) }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. FLOATING COMBINED ACTIONS & STATS PILL */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 select-none transition-all duration-300 pointer-events-auto shrink-0">
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border/50 shadow-md text-[10px] text-muted-foreground/90 transition-all duration-200 hover:shadow-lg font-semibold select-none">
          
          {/* Save Status Dot */}
          <div className="flex items-center shrink-0">
            {saveStatus === 'saving' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" title="Saving..." />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Saved" />
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground/80">
            <span>{wordCount} words</span>
            <span className="text-muted-foreground/20">•</span>
            <span>{charCount} chars</span>
            <span className="text-muted-foreground/20">•</span>
            <span>{readingTime}</span>
          </div>
          
          {/* Divider */}
          <div className="h-3 w-px bg-border/60 mx-0.5 shrink-0" />
          
          {/* Note Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Pin note */}
            <button
              onClick={() => togglePin(activeNote.id)}
              className={cn(
                "transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer",
                activeNote.isPinned 
                  ? "text-sky-500 hover:text-sky-600 dark:text-sky-400" 
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
              title={activeNote.isPinned ? "Unpin Note" : "Pin Note"}
            >
              <Pin className={cn("w-3.5 h-3.5", activeNote.isPinned && "fill-sky-500 dark:fill-sky-400")} />
            </button>

            {/* Favorite Note */}
            <button
              onClick={() => toggleFavorite(activeNote.id)}
              className={cn(
                "transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer",
                activeNote.isFavorite 
                  ? "text-amber-500 hover:text-amber-600" 
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
              title={activeNote.isFavorite ? "Remove from Favorites" : "Mark as Favorite"}
            >
              <Star className={cn("w-3.5 h-3.5", activeNote.isFavorite && "fill-amber-500")} />
            </button>

            {/* Archive Note */}
            <button
              onClick={() => toggleArchive(activeNote.id)}
              className={cn(
                "transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer",
                activeNote.isArchived 
                  ? "text-indigo-500 hover:text-indigo-600 dark:text-indigo-400" 
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
              title={activeNote.isArchived ? "Unarchive Note" : "Archive Note"}
            >
              <Archive className={cn("w-3.5 h-3.5", activeNote.isArchived && "fill-indigo-500 dark:fill-indigo-400")} />
            </button>

            {/* Note Info / Details Dropdown Menu (last hamburger) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-muted-foreground/60 hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                  title="Note Details"
                >
                  <Menu className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-4 space-y-4 bg-popover/95 backdrop-blur-md border border-border/60 shadow-xl z-40">
                {/* Note Header / Title */}
                <div className="flex items-center justify-between border-b border-border/40 pb-2 select-none">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Note Properties</span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-[80px_1fr] gap-y-3.5 text-[11px] text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                  {/* Folder */}
                  <div className="flex items-center gap-1.5 font-bold text-muted-foreground/60 select-none">
                    <Folder className="w-3.5 h-3.5" />
                    <span>Folder</span>
                  </div>
                  <div>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="h-6 px-2 hover:bg-muted text-[10.5px] font-bold text-foreground bg-muted/40 rounded-md cursor-pointer select-none">
                        {activeNote.isArchived 
                          ? '📦 Archive' 
                          : activeNote.folder === 'daily' 
                            ? '📅 Daily Notes' 
                            : '📝 Notes'}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-40 bg-popover border-border">
                          <DropdownMenuItem onClick={() => updateNote(activeNote.id, { folder: 'notes', isArchived: false })}>
                            📝 Notes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateNote(activeNote.id, { folder: 'daily', isArchived: false })}>
                            📅 Daily Notes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateNote(activeNote.id, { isArchived: true })}>
                            📦 Archive
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1.5 font-bold text-muted-foreground/60 select-none">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Status</span>
                  </div>
                  <div>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="h-6 px-2 hover:bg-muted text-[10.5px] font-bold text-foreground bg-muted/40 rounded-md cursor-pointer select-none">
                        {noteMetadata.status === 'in-progress' 
                          ? '⚡ In Progress' 
                          : noteMetadata.status === 'completed' 
                            ? '✅ Completed' 
                            : noteMetadata.status === 'todo'
                              ? '⏳ Todo'
                              : '📋 Draft'}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-40 bg-popover border-border">
                          <DropdownMenuItem onClick={() => updateMetadata({ status: 'draft' })}>
                            📋 Draft
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMetadata({ status: 'todo' })}>
                            ⏳ Todo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMetadata({ status: 'in-progress' })}>
                            ⚡ In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMetadata({ status: 'completed' })}>
                            ✅ Completed
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </div>

                  {/* Created */}
                  <div className="flex items-center gap-1.5 font-bold text-muted-foreground/60 select-none">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created</span>
                  </div>
                  <div className="font-semibold text-foreground/80 self-center">
                    {new Date(activeNote.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>

                  {/* Edited */}
                  <div className="flex items-center gap-1.5 font-bold text-muted-foreground/60 select-none">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Edited</span>
                  </div>
                  <div className="font-semibold text-foreground/80 self-center">
                    {formatRelativeTime(activeNote.updatedAt)}
                  </div>
                </div>

                {/* Tags Section */}
                <div className="border-t border-border/40 pt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 mb-1.5 select-none">
                    <Tag className="w-3 h-3" />
                    <span>Tags</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {activeNote.tags && activeNote.tags.map(t => (
                      <span 
                        key={t}
                        className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-primary/8 text-primary border border-primary/10 transition-all hover:bg-primary/12"
                      >
                        {t}
                        {!isTrashNote && (
                          <button 
                            onClick={() => handleRemoveTag(t)}
                            className="hover:text-primary/70 transition-colors cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </span>
                    ))}
                    
                    {!isTrashNote && (
                      <form onSubmit={handleAddTag} className="inline-flex items-center">
                        <input
                          type="text"
                          placeholder="+ Add Tag"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          className="border-none bg-muted/30 hover:bg-muted/50 focus:bg-muted/50 rounded px-1.5 py-0.5 text-[9.5px] text-foreground font-semibold outline-none w-14 focus:w-20 transition-all focus:ring-0"
                        />
                      </form>
                    )}
                  </div>
                </div>

              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>

      {/* 6. FLOATING SLASH COMMANDS POPUP */}
      {showSlashMenu && (
        <div 
          className="absolute z-50 w-52 rounded-xl shadow-xl border bg-popover text-popover-foreground border-border p-1 divide-y divide-border animate-in fade-in slide-in-from-top-2 duration-100"
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
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left",
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{cmd.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
