import { useEffect, useState, useRef, useMemo } from 'react'
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
  Undo,
  Redo,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Check,
  Sparkles,
  Link as LinkIcon,
  FileText
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'

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
  const { notes, selectedNoteId, updateNote, editorFont, editorFontSize, isZenMode, setZenMode } = useNotesStore()
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [copied, setCopied] = useState(false)
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
        class: 'focus:outline-none prose prose-stone dark:prose-invert max-w-none min-h-[450px] leading-relaxed pb-24 font-normal'
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
      "flex-grow flex flex-col h-full overflow-hidden select-text relative bg-background transition-all duration-300",
      isZenMode && "bg-background/95"
    )}>
      
      {/* 1. STICKY FORMATTING TOOLBAR */}
      {!isZenMode && (
        <div className="h-11 border-b border-border/40 bg-background/50 backdrop-blur-md px-6 md:px-10 flex items-center justify-between shrink-0 select-none z-20">
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
            </div>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-border/40 shrink-0">
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
          "flex-grow overflow-y-auto w-full transition-all duration-300",
          isZenMode 
            ? "max-w-2xl mx-auto px-6 md:px-0 py-12 scrollbar-none" 
            : "px-6 md:px-10 py-6",
          `editor-font-${editorFont}`,
          `editor-size-${editorFontSize}`
        )}
      >
        <EditorContent editor={editor} />

        {/* Backlinks Panel (Linked references) */}
        {backlinks.length > 0 && !isZenMode && (
          <div className="mt-16 border-t border-border/40 pt-8 pb-12 select-none">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 mb-3 flex items-center gap-1.5">
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
                  className="flex flex-col items-start gap-1 p-3 rounded-xl border border-border/40 bg-card/45 hover:bg-primary/5 hover:border-primary/20 transition-all text-left group"
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

      {/* 5. FLOATING WORD & READING TIME COUNTER PILL */}
      <div className={cn(
        "absolute bottom-6 right-6 md:right-10 z-30 select-none transition-all duration-300 pointer-events-auto",
        isZenMode && "opacity-0 hover:opacity-100 right-6 bottom-6" // almost completely hide in Zen mode unless hovered to maintain max zen!
      )}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-md border border-border/50 shadow-md text-[10px] text-muted-foreground/95 transition-all duration-200 hover:shadow-lg font-semibold select-none">
          <span>{wordCount} words</span>
          <span className="text-muted-foreground/30">•</span>
          <span>{charCount} chars</span>
          <span className="text-muted-foreground/30">•</span>
          <span>{readingTime}</span>
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
