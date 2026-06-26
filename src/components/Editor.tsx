import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Typography from '@tiptap/extension-typography'
import { createLowlight } from 'lowlight'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import html from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import rust from 'highlight.js/lib/languages/rust'
import cpp from 'highlight.js/lib/languages/cpp'
import { useNotesStore } from '../store/useNotesStore'
import { getAPI } from '../tauri-bridge'
import { getSlashPlugins } from '../lib/plugins'
import VersionHistorySheet from './VersionHistorySheet'
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
  Menu,
  Highlighter,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

export default function Editor({ noteId }: { noteId?: string } = {}) {
  const {
    notes,
    selectedNoteId: storeSelectedNoteId,
    updateNote,
    editorFont,
    editorFontSize,
    setEditorFontSize,
    isZenMode,
    setZenMode,
    togglePin,
    toggleFavorite,
    toggleArchive,
    saveStatus,
    appSettings,
  } = useNotesStore()
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [wikilinkQuery, setWikilinkQuery] = useState('')
  const [showWikilinkMenu, setShowWikilinkMenu] = useState(false)
  const [wikilinkIndex, setWikilinkIndex] = useState(0)
  const [showVersions, setShowVersions] = useState(false)
  const slashCoords = useRef({ top: 0, left: 0 })
  const showSlashMenuRef = useRef(showSlashMenu)
  const selectedIndexRef = useRef(selectedIndex)
  const isZenModeRef = useRef(isZenMode)
  const selectedNoteIdRef = useRef(noteId || storeSelectedNoteId)
  const imageInputRef = useRef<HTMLInputElement>(null)

  showSlashMenuRef.current = showSlashMenu
  selectedIndexRef.current = selectedIndex
  isZenModeRef.current = isZenMode

  const selectedNoteId = noteId || storeSelectedNoteId
  selectedNoteIdRef.current = selectedNoteId
  const activeNote = notes.find(n => n.id === selectedNoteId) || null

  const lowlight = useMemo(() => createLowlight({ js, ts, python, html, css, json, bash, sql, rust, cpp }), [])

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        link: false,
        codeBlock: false
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
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Highlight.configure({ multicolor: true }),
      Typography,
    ],
    [lowlight]
  )

  // Zoom handlers for text sizing (14px to 128px)
  const handleZoomIn = () => {
    setEditorFontSize(Math.min(128, editorFontSize + 2))
  }

  const handleZoomOut = () => {
    setEditorFontSize(Math.max(14, editorFontSize - 2))
  }

  const noteMetadata = {
    icon: activeNote?.icon ?? undefined,
    cover: activeNote?.cover ?? undefined,
    status: activeNote?.status ?? undefined,
  }

  const updateMetadata = (fields: { icon?: string | null; cover?: string | null; status?: string | null }) => {
    if (!activeNote) return
    const updates: Partial<typeof activeNote> = {}
    if (fields.icon !== undefined) updates.icon = fields.icon
    if (fields.cover !== undefined) updates.cover = fields.cover
    if (fields.status !== undefined) updates.status = fields.status
    updateNote(activeNote.id, updates)
  }

  const isMarkdownMode = activeNote?.editorMode === 'markdown'

  const wikilinkSuggestions = useMemo(() => {
    if (!wikilinkQuery) return []
    const q = wikilinkQuery.toLowerCase()
    return notes
      .filter((n) => n.id !== activeNote?.id && n.folder !== 'trash' && n.title.toLowerCase().includes(q))
      .slice(0, 6)
  }, [wikilinkQuery, notes, activeNote?.id])

  const commandsRef = useRef<Array<{ name: string; icon: typeof Heading1; action: () => void }>>([])

  const editor = useEditor({
    extensions,
    editorProps: {
      attributes: {
        class: 'focus:outline-none prose-editor max-w-none min-h-[450px] leading-relaxed pb-24 font-normal',
        spellcheck: 'true',
        lang: appSettings.spellCheckLanguage,
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

        if (showSlashMenuRef.current) {
          const commands = commandsRef.current
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelectedIndex(prev => (prev + 1) % commands.length)
            return true
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length)
            return true
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            const cmd = commands[selectedIndexRef.current]
            if (cmd) {
              cmd.action()
              setShowSlashMenu(false)
            }
            return true
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            setShowSlashMenu(false)
            return true
          }
        }

        if (event.key === 'Escape' && isZenModeRef.current && !showSlashMenuRef.current) {
          event.preventDefault()
          setZenMode(false)
          return true
        }

        return false
      },
      handleDOMEvents: {
        wheel: (_view, event) => {
          const we = event as WheelEvent
          if (we.ctrlKey || we.metaKey) {
            event.preventDefault()
            if (we.deltaY < 0) handleZoomIn()
            else handleZoomOut()
            return true
          }
          return false
        }
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const noteIdToUpdate = selectedNoteIdRef.current
      if (noteIdToUpdate && !activeEditor.isDestroyed && activeEditor.schema) {
        updateNote(noteIdToUpdate, { content: activeEditor.getHTML() })
        const { from } = activeEditor.state.selection
        const textBefore = activeEditor.state.doc.textBetween(Math.max(0, from - 30), from)
        const match = textBefore.match(/\[\[([^\]]*)$/)
        if (match) {
          setWikilinkQuery(match[1])
          setShowWikilinkMenu(true)
          setWikilinkIndex(0)
        } else {
          setShowWikilinkMenu(false)
          setWikilinkQuery('')
        }
      }
    }
  })

  const isEditorReady = Boolean(editor && !editor.isDestroyed && editor.schema)

  // Synchronize note contents on select and toggle editable state
  useEffect(() => {
    if (!isEditorReady || !activeNote || !editor?.schema) return

    const currentContent = editor.getHTML()
    if (currentContent !== activeNote.content) {
      editor.commands.setContent(activeNote.content || '', { emitUpdate: false })
    }
    editor.setEditable(activeNote.folder !== 'trash')
  }, [selectedNoteId, isEditorReady, activeNote?.id, activeNote?.folder, editor])

  const resizeImage = (file: File, maxDim = 1920): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = (height / width) * maxDim; width = maxDim }
          else { width = (width / height) * maxDim; height = maxDim }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL(file.type || 'image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // Handle paste for images
  useEffect(() => {
    if (!editor) return
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      const files = event.clipboardData?.files

      const imageFile = [...(items || [])]
        .find(i => i.type.startsWith('image/'))
        ?.getAsFile()
        || (files?.length ? files[0] : null)

      if (!imageFile || !imageFile.type.startsWith('image/')) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      resizeImage(imageFile).then(async (url) => {
        const api = getAPI()
        const noteId = selectedNoteIdRef.current
        if (api && noteId) {
          try {
            const path = await api.saveImage(noteId, url)
            editor.chain().focus().setImage({ src: `asset://localhost/${path}` }).run()
            return
          } catch { /* fallback to base64 */ }
        }
        editor.chain().focus().setImage({ src: url }).run()
      })
    }
    document.addEventListener('paste', onPaste, true)
    return () => document.removeEventListener('paste', onPaste, true)
  }, [editor])

  const handleInsertImage = () => {
    imageInputRef.current?.click()
  }

  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    resizeImage(file).then(async (url) => {
      const api = getAPI()
      const noteId = selectedNoteIdRef.current
      if (api && noteId) {
        try {
          const path = await api.saveImage(noteId, url)
          editor?.chain().focus().setImage({ src: `asset://localhost/${path}` }).run()
          return
        } catch { /* fallback */ }
      }
      editor?.chain().focus().setImage({ src: url }).run()
    })
    e.target.value = ''
  }

  // Simple clean-up slash menu when content is deleted
  useEffect(() => {
    if (!isEditorReady || !showSlashMenu) return

    const textBefore = editor!.state.doc.textBetween(
      Math.max(0, editor!.state.selection.from - 10),
      editor!.state.selection.from
    )
    if (!textBefore.includes('/')) {
      setShowSlashMenu(false)
    }
  }, [isEditorReady, showSlashMenu, editor?.state.selection.from])

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
      name: 'Highlight',
      icon: Highlighter,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).toggleHighlight().run()
    },
    {
      name: 'Divider',
      icon: Minus,
      action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).setHorizontalRule().run()
    },
    {
      name: 'Image',
      icon: ImageIcon,
      action: () => { handleInsertImage() }
    },
    ...getSlashPlugins().map((p) => ({
      name: p.name,
      icon: Sparkles,
      action: () => {
        editor?.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).insertContent(p.insert).run()
      },
    })),
  ]

  commandsRef.current = COMMANDS

  const insertWikilink = (title: string) => {
    if (!editor) return
    const { from } = editor.state.selection
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 30), from)
    const bracketStart = textBefore.lastIndexOf('[[')
    if (bracketStart >= 0) {
      const deleteFrom = from - (textBefore.length - bracketStart)
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).insertContent(`[[${title}]]`).run()
    } else {
      editor.chain().focus().insertContent(`[[${title}]]`).run()
    }
    setShowWikilinkMenu(false)
    setWikilinkQuery('')
  }

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
    if (!isEditorReady) return
    const md = htmlToMarkdown(editor.getHTML())
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Export as Markdown handler
  const handleExportMarkdown = () => {
    if (!isEditorReady || !activeNote) return
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
    if (!isEditorReady) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter Link URL:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  // Stats Counters — only read from a live editor instance
  const textContent = useEditorState({
    editor,
    selector: ({ editor: activeEditor }) => {
      if (!activeEditor || activeEditor.isDestroyed || !activeEditor.schema) {
        return ''
      }
      try {
        return activeEditor.getText()
      } catch {
        return ''
      }
    },
  }) ?? ''
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
              <>
              <div className="flex items-center gap-0.5">
                {/* Bold, Italic - always visible */}
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

                <div className="h-4 w-px bg-border/50 mx-1 shrink-0" />

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

                <div className="h-4 w-px bg-border/50 mx-1 shrink-0" />

                {/* Zoom */}
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
                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 select-none px-1.5 min-w-[28px] text-center bg-muted/30 rounded py-0.5">
                  {editorFontSize}px
                </span>
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

                <div className="h-4 w-px bg-border/50 mx-1 shrink-0" />

                {/* Highlight */}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleHighlight().run()}
                  className={cn("h-7 w-7 p-0", editor?.isActive('highlight') && "bg-muted text-foreground")}
                  title="Highlight"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </Button>

                {/* Files */}
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleInsertImage}
                  className="h-7 px-2 text-xs font-medium gap-1 bg-muted/50"
                  title="Insert Image"
                >
                  <ImageIcon className="size-3.5" />
                  <span className="leading-none">Files</span>
                </Button>

                <div className="w-2" />

                {/* Style Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="xs" variant="outline" className="h-7 px-2 text-xs font-medium gap-1 bg-muted/50">
                      <span className="leading-none">Format</span>
                      <ChevronDown className="size-3 text-muted-foreground/60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Text Style</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleStrike().run()}>
                      <Strikethrough className="w-3.5 h-3.5 mr-2" />
                      Strikethrough
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleCode().run()}>
                      <Code className="w-3.5 h-3.5 mr-2" />
                      Inline Code
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Block Style</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().setParagraph().run()}>
                      <span className="w-3.5 h-3.5 mr-2 flex items-center justify-center text-xs font-semibold">P</span>
                      Paragraph
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
                      <span className="w-3.5 h-3.5 mr-2 flex items-center justify-center text-xs font-extrabold">H1</span>
                      Heading 1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
                      <span className="w-3.5 h-3.5 mr-2 flex items-center justify-center text-xs font-bold">H2</span>
                      Heading 2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
                      <span className="w-3.5 h-3.5 mr-2 flex items-center justify-center text-xs font-semibold">H3</span>
                      Heading 3
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Lists</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBulletList().run()}>
                      <List className="w-3.5 h-3.5 mr-2" />
                      Bullet List
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
                      <ListOrdered className="w-3.5 h-3.5 mr-2" />
                      Numbered List
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleTaskList().run()}>
                      <CheckSquare className="w-3.5 h-3.5 mr-2" />
                      Task List
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Insert</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
                      <Quote className="w-3.5 h-3.5 mr-2" />
                      Blockquote
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
                      <FileText className="w-3.5 h-3.5 mr-2" />
                      Code Block
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
                      <Minus className="w-3.5 h-3.5 mr-2" />
                      Divider
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileSelected}
              />
              </>
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
              variant={isMarkdownMode ? 'default' : 'ghost'}
              onClick={() => activeNote && updateNote(activeNote.id, { editorMode: isMarkdownMode ? 'wysiwyg' : 'markdown' })}
              className="h-7 px-2 text-[10px]"
              title="Toggle Markdown mode"
            >
              MD
            </Button>

            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setShowVersions(!showVersions)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Version history"
            >
              <Clock className="w-3.5 h-3.5" />
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
      {isEditorReady && !isTrashNote && editor?.schema && (
        <BubbleMenu 
          key={`bubble-${selectedNoteId}`}
          editor={editor!} 
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
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn("h-7 w-7 p-0", editor.isActive('highlight') && "bg-muted text-foreground")}
            title="Highlight"
          >
            <Highlighter className="w-3.5 h-3.5" />
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
                    <DropdownMenuGroup>
                      {Object.entries(COVERS).map(([key, value]) => (
                        <DropdownMenuItem key={key} onClick={() => updateMetadata({ cover: value })}>
                          <div className={cn("size-4 rounded-full border border-border/30", value)} />
                          {key}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
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
                    <Button size="xs" variant="outline">
                      Change
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuLabel>Select Emoji</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup className="grid grid-cols-5 gap-0.5 p-1">
                      {EMOJIS.map(emoji => (
                        <DropdownMenuItem
                          key={emoji}
                          onClick={() => updateMetadata({ icon: emoji })}
                          className="justify-center p-1 text-lg"
                        >
                          {emoji}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="xs" variant="destructive" onClick={() => updateMetadata({ icon: null })}>
                  Remove
                </Button>
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

        {/* D. Editor: WYSIWYG or Markdown */}
        {isMarkdownMode ? (
          <textarea
            value={activeNote.content}
            onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
            disabled={isTrashNote}
            className="w-full min-h-[450px] bg-transparent border-0 outline-none font-mono text-sm leading-relaxed resize-none"
            placeholder="Write markdown..."
          />
        ) : (
          isEditorReady ? <EditorContent editor={editor} /> : null
        )}

        {/* Wikilink autocomplete */}
        {showWikilinkMenu && wikilinkSuggestions.length > 0 && (
          <div className="absolute z-50 w-48 rounded-lg border bg-popover shadow-md p-1">
            {wikilinkSuggestions.map((n, i) => (
              <button
                key={n.id}
                onClick={() => insertWikilink(n.title)}
                className={cn(
                  'w-full text-left px-2 py-1 text-xs rounded',
                  i === wikilinkIndex ? 'bg-accent' : 'hover:bg-muted'
                )}
              >
                [[{n.title}]]
              </button>
            ))}
          </div>
        )}

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

            {/* Note properties */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground/60 hover:text-foreground"
                  title="Note Details"
                >
                  <Menu />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <PopoverHeader>
                  <PopoverTitle className="text-xs text-muted-foreground uppercase tracking-wider">
                    Note Properties
                  </PopoverTitle>
                </PopoverHeader>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Folder />
                      <span>Folder</span>
                    </div>
                    <Select
                      value={activeNote.isArchived ? 'archive' : activeNote.folder === 'daily' ? 'daily' : 'notes'}
                      onValueChange={(value) => {
                        if (value === 'archive') {
                          updateNote(activeNote.id, { isArchived: true })
                        } else {
                          updateNote(activeNote.id, { folder: value, isArchived: false })
                        }
                      }}
                      disabled={isTrashNote}
                    >
                      <SelectTrigger size="sm" className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notes">📝 Notes</SelectItem>
                        <SelectItem value="daily">📅 Daily Notes</SelectItem>
                        <SelectItem value="archive">📦 Archive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileSpreadsheet />
                      <span>Status</span>
                    </div>
                    <Select
                      value={noteMetadata.status || 'draft'}
                      onValueChange={(value) => updateMetadata({ status: value })}
                      disabled={isTrashNote}
                    >
                      <SelectTrigger size="sm" className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">📋 Draft</SelectItem>
                        <SelectItem value="todo">⏳ Todo</SelectItem>
                        <SelectItem value="in-progress">⚡ In Progress</SelectItem>
                        <SelectItem value="completed">✅ Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar />
                      <span>Created</span>
                    </div>
                    <span className="font-medium text-foreground/80">
                      {new Date(activeNote.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock />
                      <span>Edited</span>
                    </div>
                    <span className="font-medium text-foreground/80">
                      {formatRelativeTime(activeNote.updatedAt)}
                    </span>
                  </div>

                  <div className="border-t border-border pt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Tag />
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeNote.tags?.map(t => (
                        <span
                          key={t}
                          className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary/8 text-primary border border-primary/10"
                        >
                          {t}
                          {!isTrashNote && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(t)}
                              className="hover:text-primary/70"
                            >
                              <X className="size-2.5" />
                            </button>
                          )}
                        </span>
                      ))}
                      {!isTrashNote && (
                        <form onSubmit={handleAddTag} className="inline-flex items-center">
                          <Input
                            type="text"
                            placeholder="+ Add tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            className="h-6 w-20 text-[10px]"
                          />
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

          </div>
        </div>
      </div>

      {/* 6. FLOATING SLASH COMMANDS POPUP */}
      {showSlashMenu && (
        <div
          className="absolute z-50 w-52 min-w-32 origin-top overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 animate-in fade-in slide-in-from-top-2 duration-100"
          style={{
            top: `${slashCoords.current.top}px`,
            left: `${slashCoords.current.left}px`,
          }}
        >
          <div className="max-h-[220px] overflow-y-auto">
            {COMMANDS.map((cmd, i) => {
              const Icon = cmd.icon
              const isSelected = i === selectedIndex
              return (
                <button
                  key={cmd.name}
                  type="button"
                  onClick={() => executeCommand(cmd)}
                  className={cn(
                    "relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none text-left",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="shrink-0" />
                  <span>{cmd.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <VersionHistorySheet
        noteId={activeNote.id}
        open={showVersions}
        onOpenChange={setShowVersions}
      />
    </div>
  )
}
