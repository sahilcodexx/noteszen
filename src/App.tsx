import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Folder,
  Tag,
  Trash2,
  Search,
  Pin,
  Plus,
  Settings,
  Sun,
  Moon,
  FileText,
  BookOpen,
  Edit,
  CheckCircle,
  FolderOpen,
  Sparkles,
  Info,
  Lightbulb,
  X
} from 'lucide-react'

// Shadcn UI components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types
import type { Note } from './electron'

const DEFAULT_FOLDERS = [
  { id: 'all', name: 'All Notes', icon: FileText, color: 'text-amber-500' },
  { id: 'work', name: 'Work', icon: Folder, color: 'text-blue-500' },
  { id: 'personal', name: 'Personal', icon: Folder, color: 'text-green-500' },
  { id: 'ideas', name: 'Ideas', icon: Lightbulb, color: 'text-yellow-500' },
  { id: 'trash', name: 'Trash', icon: Trash2, color: 'text-red-500' }
]

export default function App() {
  // States
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [newTagInput, setNewTagInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Ref for debouncing save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch initial notes (Electron disk store or LocalStorage fallback)
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getNotes().then((fetchedNotes) => {
        setNotes(fetchedNotes)
        if (fetchedNotes.length > 0) {
          setSelectedNoteId(fetchedNotes[0].id)
        }
      })
    } else {
      // LocalStorage Fallback for Web/Browser mode
      const local = localStorage.getItem('noteszen-notes')
      if (local) {
        try {
          const parsed = JSON.parse(local) as Note[]
          setNotes(parsed)
          if (parsed.length > 0) {
            setSelectedNoteId(parsed[0].id)
          }
        } catch (e) {
          console.error('Error parsing localStorage notes:', e)
        }
      } else {
        const defaultNotes: Note[] = [
          {
            id: '1',
            title: 'Welcome to NotesZen 🚀',
            content: `# Welcome to NotesZen\n\nNotesZen is a premium, macOS-inspired Markdown note-taking app designed for Arch Linux.\n\n### Core Features:\n- 📝 **Markdown preview** and editing side-by-side or toggled.\n- 📂 Organize notes into **Folders** (Work, Personal, Ideas, etc.).\n- 🏷️ Categorize via **Tags**.\n- 📌 **Pin** important notes to the top.\n- 🔍 Instant full-text **search**.\n- 💾 Automatic **local storage**.\n\nTry editing this note or create a new one!`,
            folder: 'personal',
            tags: ['guide', 'noteszen'],
            isPinned: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Project Ideas 💡',
            content: `## Project Ideas\n\n1. **NotesZen v2.0**: Add cloud sync using git repositories.\n2. **Custom Arch Config**: Tiling window manager script setup.\n3. **Tailwind Glassmorphism Theme**: Create template files.`,
            folder: 'ideas',
            tags: ['ideas', 'dev'],
            isPinned: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString()
          }
        ]
        setNotes(defaultNotes)
        setSelectedNoteId('1')
        localStorage.setItem('noteszen-notes', JSON.stringify(defaultNotes))
      }
    }
  }, [])

  // Dark mode handler
  useEffect(() => {
    const root = window.document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [darkMode])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + N or Cmd + N (Create new note)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        createNewNote()
      }
      // Ctrl + F or Cmd + F (Search notes)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [notes, activeFolder, selectedTag])

  // Get active note
  const activeNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || null
  }, [notes, selectedNoteId])

  // Get all unique tags from active/existing notes (excluding trash folder notes)
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    notes.forEach(note => {
      if (note.folder !== 'trash' && note.tags) {
        note.tags.forEach(tag => tagsSet.add(tag))
      }
    })
    return Array.from(tagsSet)
  }, [notes])

  // Filter notes based on folder, search query, and selected tag
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // 1. Folder filter
      if (activeFolder === 'trash') {
        if (note.folder !== 'trash') return false
      } else {
        if (note.folder === 'trash') return false
        if (activeFolder !== 'all' && note.folder !== activeFolder) return false
      }

      // 2. Tag filter
      if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) {
        return false
      }

      // 3. Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const titleMatch = note.title.toLowerCase().includes(query)
        const contentMatch = note.content.toLowerCase().includes(query)
        const tagMatch = note.tags && note.tags.some(t => t.toLowerCase().includes(query))
        return titleMatch || contentMatch || tagMatch
      }

      return true
    })
  }, [notes, activeFolder, selectedTag, searchQuery])

  // Sort notes: pinned first, then by updatedAt descending
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [filteredNotes])

  // Trigger Save Note to File System / LocalStorage fallback
  const saveNoteOnDisk = (noteToSave: Note, currentNotesList: Note[]) => {
    setSaveStatus('saving')
    if (window.electronAPI) {
      window.electronAPI.saveNote(noteToSave)
        .then(success => {
          if (success) setSaveStatus('saved')
          else setSaveStatus('error')
        })
        .catch(() => setSaveStatus('error'))
    } else {
      // Web / Browser mode fallback
      try {
        localStorage.setItem('noteszen-notes', JSON.stringify(currentNotesList))
        setSaveStatus('saved')
      } catch (e) {
        setSaveStatus('error')
      }
    }
  }

  // Handle Note Content/Title Update
  const updateNote = (updatedFields: Partial<Note>) => {
    if (!selectedNoteId) return

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(n => {
        if (n.id === selectedNoteId) {
          const updatedNote = {
            ...n,
            ...updatedFields,
            updatedAt: new Date().toISOString()
          }
          return updatedNote
        }
        return n
      })

      // Debounce actual disk save
      const noteToSave = updatedNotes.find(n => n.id === selectedNoteId)
      if (noteToSave) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          saveNoteOnDisk(noteToSave, updatedNotes)
        }, 600)
      }

      return updatedNotes
    })
  }

  // Create New Note
  const createNewNote = () => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 11),
      title: 'Untitled Note',
      content: '',
      folder: activeFolder === 'trash' || activeFolder === 'all' ? 'personal' : activeFolder,
      tags: selectedTag ? [selectedTag] : [],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedNotes = [newNote, ...notes]
    setNotes(updatedNotes)
    setSelectedNoteId(newNote.id)
    setIsEditing(true)
    saveNoteOnDisk(newNote, updatedNotes)
  }

  // Trash or Delete note permanently
  const deleteNote = (noteId: string) => {
    const targetNote = notes.find(n => n.id === noteId)
    if (!targetNote) return

    if (targetNote.folder === 'trash') {
      // Delete permanently
      const updatedNotes = notes.filter(n => n.id !== noteId)
      setNotes(updatedNotes)
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null)
      }

      if (window.electronAPI) {
        window.electronAPI.deleteNote(noteId)
      } else {
        localStorage.setItem('noteszen-notes', JSON.stringify(updatedNotes))
      }
    } else {
      // Send to trash folder
      const updatedNotes = notes.map(n => {
        if (n.id === noteId) {
          return { ...n, folder: 'trash', isPinned: false, updatedAt: new Date().toISOString() }
        }
        return n
      })
      setNotes(updatedNotes)
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null)
      }

      const noteToSave = updatedNotes.find(n => n.id === noteId)
      if (noteToSave) {
        saveNoteOnDisk(noteToSave, updatedNotes)
      }
    }
  }

  // Restore Note from Trash
  const restoreNote = (noteId: string) => {
    const updatedNotes = notes.map(n => {
      if (n.id === noteId) {
        return { ...n, folder: 'personal', updatedAt: new Date().toISOString() }
      }
      return n
    })
    setNotes(updatedNotes)
    const noteToSave = updatedNotes.find(n => n.id === noteId)
    if (noteToSave) {
      saveNoteOnDisk(noteToSave, updatedNotes)
    }
  }

  // Add tag to active note
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeNote || !newTagInput.trim()) return

    const tag = newTagInput.trim().toLowerCase()
    if (!activeNote.tags.includes(tag)) {
      const updatedTags = [...activeNote.tags, tag]
      updateNote({ tags: updatedTags })
    }
    setNewTagInput('')
  }

  // Remove tag from active note
  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return
    const updatedTags = activeNote.tags.filter(t => t !== tagToRemove)
    updateNote({ tags: updatedTags })
  }

  // Window operations
  const handleWinMin = () => window.electronAPI?.minimize()
  const handleWinMax = () => window.electronAPI?.maximize()
  const handleWinClose = () => window.electronAPI?.close()

  // Simple custom Markdown parser
  const renderMarkdown = (text: string) => {
    if (!text) return <p className="text-gray-400 italic">Start writing something beautiful...</p>

    const lines = text.split('\n')

    return (
      <div className="prose-editor">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('# ')) {
            return <h1 key={idx}>{line.substring(2)}</h1>
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx}>{line.substring(3)}</h2>
          }
          if (line.startsWith('### ')) {
            return <h3 key={idx}>{line.substring(4)}</h3>
          }

          // Blockquote
          if (line.startsWith('> ')) {
            return <blockquote key={idx}>{line.substring(2)}</blockquote>
          }

          // Bullet list items
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return <li key={idx} className="ml-4 list-disc">{line.substring(2)}</li>
          }

          // Order list items
          const orderMatch = line.match(/^(\d+)\.\s(.*)/)
          if (orderMatch) {
            return <li key={idx} className="ml-4 list-decimal">{orderMatch[2]}</li>
          }

          // Horizontal rule
          if (line.trim() === '---') {
            return <hr key={idx} className="border-mac-border-dark dark:border-mac-border-light my-4" />
          }

          // Standard paragraph
          if (line.trim() === '') return <div key={idx} className="h-2" />

          // Inline styling parsing (bold/italic)
          let processedLine = line
          // Bold
          processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // Italic
          processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
          // Inline Code
          processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-sm">$1</code>')

          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: processedLine }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${darkMode ? 'dark bg-[#121212] text-gray-200' : 'bg-[#f4f4f6] text-gray-800'}`}>
      
      {/* 1. SIDEBAR (Glassmorphic macOS design using Shadcn ScrollArea) */}
      <aside className={`w-[230px] flex flex-col border-r shrink-0 drag-region transition-colors duration-300
        ${darkMode 
          ? 'bg-mac-sidebar-dark border-mac-border-dark text-gray-300' 
          : 'bg-mac-sidebar-light border-mac-border-light text-gray-700'} 
        backdrop-blur-md`}>
        
        {/* Custom Window Controls (Traffic Lights) */}
        <div className="h-12 flex items-center pl-4 gap-2 no-drag shrink-0">
          <button 
            onClick={handleWinClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#e04f46] flex items-center justify-center group transition-all"
            title="Close"
          >
            <span className="text-[7px] text-[#4c0002] font-bold opacity-0 group-hover:opacity-100 select-none">✕</span>
          </button>
          <button 
            onClick={handleWinMin}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#e0a324] flex items-center justify-center group transition-all"
            title="Minimize"
          >
            <span className="text-[7px] text-[#5c3e00] font-bold opacity-0 group-hover:opacity-100 select-none">−</span>
          </button>
          <button 
            onClick={handleWinMax}
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#1aab2f] flex items-center justify-center group transition-all"
            title="Maximize"
          >
            <span className="text-[7px] text-[#004d05] font-bold opacity-0 group-hover:opacity-100 select-none">⤢</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="px-4 py-2 flex items-center justify-between no-drag">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              NotesZen
            </span>
          </div>
        </div>

        {/* Search Input (Shadcn Input) */}
        <div className="px-3 my-3 no-drag">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-4 h-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-7 h-8 text-xs border-0 outline-none rounded-lg transition-all
                ${darkMode 
                  ? 'bg-black/30 text-white placeholder-gray-500 focus-visible:ring-1 focus-visible:ring-amber-500/50' 
                  : 'bg-white text-gray-900 placeholder-gray-400 focus-visible:ring-1 focus-visible:ring-amber-500/50'}`}
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 w-5 h-5 text-gray-400 hover:text-gray-200"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Folders List (Shadcn ScrollArea) */}
        <ScrollArea className="flex-1 px-2 py-1 no-drag">
          <p className="text-[10px] font-bold tracking-wider text-gray-400/80 uppercase px-2 mb-1">Folders</p>
          <div className="space-y-1">
            {DEFAULT_FOLDERS.map((folder) => {
              const Icon = folder.icon
              const isSelected = activeFolder === folder.id && !selectedTag
              const noteCount = notes.filter(n => {
                if (folder.id === 'trash') return n.folder === 'trash'
                if (folder.id === 'all') return n.folder !== 'trash'
                return n.folder === folder.id
              }).length

              return (
                <Button
                  key={folder.id}
                  variant={isSelected ? 'default' : 'ghost'}
                  onClick={() => {
                    setActiveFolder(folder.id)
                    setSelectedTag(null)
                  }}
                  className={`w-full justify-between h-8 px-2.5 text-xs font-medium rounded-lg transition-all group
                    ${isSelected 
                      ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 shadow-amber-500/20' 
                      : darkMode 
                        ? 'text-gray-400 hover:bg-white/5 hover:text-white' 
                        : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : folder.color}`} />
                    <span>{folder.name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md transition-all
                    ${isSelected 
                      ? 'bg-white/20 text-white' 
                      : darkMode 
                        ? 'bg-white/5 text-gray-500 group-hover:text-gray-300' 
                        : 'bg-black/5 text-gray-400 group-hover:text-gray-600'}`}>
                    {noteCount}
                  </span>
                </Button>
              )
            })}
          </div>

          {/* Tags Section */}
          {allTags.length > 0 && (
            <div className="pt-4 space-y-1">
              <p className="text-[10px] font-bold tracking-wider text-gray-400/80 uppercase px-2 mb-1">Tags</p>
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag
                const tagNotesCount = notes.filter(n => n.folder !== 'trash' && n.tags && n.tags.includes(tag)).length
                
                return (
                  <Button
                    key={tag}
                    variant={isSelected ? 'default' : 'ghost'}
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={`w-full justify-between h-8 px-2.5 text-xs font-medium rounded-lg transition-all
                      ${isSelected 
                        ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-700 shadow-amber-600/20' 
                        : darkMode 
                          ? 'text-gray-400 hover:bg-white/5 hover:text-white' 
                          : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-amber-500/80'}`} />
                      <span className="truncate max-w-[120px]">{tag}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'}`}>
                      {tagNotesCount}
                    </span>
                  </Button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-3 border-t no-drag flex items-center justify-between shrink-0
          ${darkMode ? 'border-mac-border-dark' : 'border-mac-border-light'}">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className={`w-7 h-7 rounded-lg transition-colors
              ${darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'}`}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className={`h-7 px-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs
              ${darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'}`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </aside>

      {/* 2. NOTE LIST PANEL */}
      <section className={`w-[280px] flex flex-col border-r shrink-0 transition-colors duration-300
        ${darkMode ? 'bg-[#18181c] border-mac-border-dark' : 'bg-white border-mac-border-light'}`}>
        
        {/* Header List Controls */}
        <div className="h-14 px-4 flex items-center justify-between border-b shrink-0
          ${darkMode ? 'border-mac-border-dark' : 'border-mac-border-light'}">
          <div>
            <h2 className="text-sm font-semibold leading-tight capitalize">
              {selectedTag ? `#${selectedTag}` : DEFAULT_FOLDERS.find(f => f.id === activeFolder)?.name}
            </h2>
            <p className="text-[10px] text-gray-500 font-medium">
              {sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>

          <Button
            onClick={createNewNote}
            disabled={activeFolder === 'trash'}
            className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 shadow-sm shadow-amber-500/20"
            title="New Note"
            size="icon"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Pinned / All Notes List (Shadcn ScrollArea) */}
        <ScrollArea className="flex-1 divide-y divide-black/5 dark:divide-white/5">
          {sortedNotes.length === 0 ? (
            <div className="p-8 text-center text-gray-500 mt-12">
              <FolderOpen className="w-9 h-9 mx-auto text-gray-600 mb-2 opacity-50" />
              <p className="text-xs font-semibold">No notes here</p>
              <p className="text-[11px] text-gray-600 mt-1">Create a note to start</p>
            </div>
          ) : (
            sortedNotes.map((note) => {
              const isSelected = note.id === selectedNoteId
              const preview = note.content
                ? note.content.replace(/[#*`>_\-]/g, '').substring(0, 70)
                : 'No additional text'
              
              // Formatting Date
              const dateObj = new Date(note.updatedAt)
              const formattedDate = dateObj.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric' 
              })

              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-4 cursor-pointer relative transition-all group border-l-2
                    ${isSelected 
                      ? 'bg-amber-500/10 border-amber-500' 
                      : 'border-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'}`}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <h3 className={`font-semibold text-xs truncate flex-1 ${isSelected ? 'text-amber-500 dark:text-amber-400' : ''}`}>
                      {note.title || 'Untitled Note'}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {note.isPinned && (
                        <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                      
                      {/* Trash action indicator */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e: any) => {
                          e.stopPropagation()
                          deleteNote(note.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 text-gray-500 hover:text-red-500 transition-opacity"
                        title={activeFolder === 'trash' ? 'Delete permanently' : 'Move to Trash'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <p className={`text-[11px] line-clamp-2 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {preview}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-medium">
                      {formattedDate}
                    </span>

                    {/* Tag bubbles inside note card */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-1 overflow-hidden max-w-[120px]">
                        {note.tags.slice(0, 2).map(tag => (
                          <span 
                            key={tag} 
                            className="text-[8px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-gray-500 truncate"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Restore from Trash floating trigger */}
                  {note.folder === 'trash' && (
                    <Button
                      variant="link"
                      onClick={(e: any) => {
                        e.stopPropagation()
                        restoreNote(note.id)
                      }}
                      className="absolute right-3 top-3 text-[10px] h-auto p-0 text-amber-500 hover:underline"
                    >
                      Restore
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </ScrollArea>
      </section>

      {/* 3. MAIN EDITOR CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#ffffff] dark:bg-[#151518] transition-colors duration-300">
        
        {activeNote ? (
          <>
            {/* Note Editor Header / Toolbar */}
            <div className="h-14 px-6 border-b flex items-center justify-between shrink-0
              ${darkMode ? 'border-mac-border-dark' : 'border-mac-border-light'}">
              
              {/* Note Metadata / Save Status */}
              <div className="flex items-center gap-4">
                {/* Folder Selector (Shadcn Select) */}
                {activeNote.folder !== 'trash' ? (
                  <Select
                    value={activeNote.folder}
                    onValueChange={(val: string) => updateNote({ folder: val })}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs font-semibold bg-gray-100 dark:bg-[#1e1e24] border-0">
                      <SelectValue placeholder="Folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">📁 Personal</SelectItem>
                      <SelectItem value="work">💼 Work</SelectItem>
                      <SelectItem value="ideas">💡 Ideas</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs text-red-500 font-semibold bg-red-500/10 px-2.5 py-1.5 rounded-lg">
                    🗑️ Trash (Read Only)
                  </span>
                )}

                {/* Auto-save status */}
                <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
                  {saveStatus === 'saving' && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      Saving...
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      Saved
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-red-500">Save failed</span>
                  )}
                </span>
              </div>

              {/* Toolbar Actions */}
              <div className="flex items-center gap-2">
                {/* Pin Toggle */}
                {activeNote.folder !== 'trash' && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateNote({ isPinned: !activeNote.isPinned })}
                    className={`w-8 h-8 rounded-lg transition-all
                      ${activeNote.isPinned 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 hover:bg-amber-500/20' 
                        : 'text-gray-400 hover:bg-white/5 border-black/5 dark:border-white/5'}`}
                    title={activeNote.isPinned ? 'Unpin Note' : 'Pin Note'}
                  >
                    <Pin className={`w-4 h-4 ${activeNote.isPinned ? 'fill-amber-500' : ''}`} />
                  </Button>
                )}

                {/* Edit / Preview Toggle */}
                <div className={`flex rounded-lg border p-0.5 ${darkMode ? 'border-white/5 bg-[#1e1e24]' : 'border-black/5 bg-gray-100'}`}>
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className={`h-7 px-3 text-xs font-semibold rounded-md transition-all
                      ${isEditing 
                        ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600' 
                        : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Write
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    className={`h-7 px-3 text-xs font-semibold rounded-md transition-all
                      ${!isEditing 
                        ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600' 
                        : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            </div>

            {/* Note Editor Workspace */}
            <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6">
              {/* Note Title Input (Shadcn Input) */}
              <Input
                type="text"
                placeholder="Untitled Note"
                value={activeNote.title}
                onChange={(e: any) => updateNote({ title: e.target.value })}
                disabled={activeNote.folder === 'trash'}
                className="w-full bg-transparent text-xl font-bold border-0 shadow-none px-0 py-0 outline-none placeholder-gray-400 mb-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              />

              {/* Tags list inside note header */}
              <div className="flex items-center flex-wrap gap-1.5 mb-6">
                <Tag className="w-3.5 h-3.5 text-gray-500" />
                {activeNote.tags && activeNote.tags.map(tag => (
                  <span 
                    key={tag}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium"
                  >
                    {tag}
                    {activeNote.folder !== 'trash' && (
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-amber-700 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ))}

                {/* Add new tag form */}
                {activeNote.folder !== 'trash' && (
                  <form onSubmit={handleAddTag} className="inline-flex items-center">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={newTagInput}
                      onChange={(e: any) => setNewTagInput(e.target.value)}
                      className="border-none bg-transparent text-xs text-gray-500 outline-none w-16 focus:w-24 transition-all focus:ring-0 placeholder-gray-600"
                    />
                  </form>
                )}
              </div>

              {/* Editor TextArea (Shadcn Textarea) or Markdown Preview */}
              <div className="flex-1 flex flex-col">
                {isEditing && activeNote.folder !== 'trash' ? (
                  <Textarea
                    value={activeNote.content}
                    onChange={(e: any) => updateNote({ content: e.target.value })}
                    placeholder="Write your markdown note here..."
                    className="w-full flex-1 bg-transparent border-0 shadow-none resize-none font-mono text-sm leading-relaxed placeholder-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto select-text selection:bg-amber-500/30">
                    {renderMarkdown(activeNote.content)}
                  </div>
                )}
              </div>
            </div>

            {/* Note Editor Status Bar */}
            <div className="h-8 px-6 border-t flex items-center justify-between shrink-0 text-[10px] text-gray-500 font-medium
              ${darkMode ? 'border-mac-border-dark' : 'border-mac-border-light'}">
              <span>
                {activeNote.content ? activeNote.content.split(/\s+/).filter(Boolean).length : 0} words
              </span>
              <span>
                Last edited {new Date(activeNote.updatedAt).toLocaleString(undefined, { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
            <div className="p-4 rounded-full bg-amber-500/5 text-amber-500/80 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-sm font-bold mb-1">NotesZen Editor</h2>
            <p className="text-xs text-gray-500 max-w-sm text-center mb-6">
              Create a new note or select an existing note from the sidebar to start writing.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md p-4 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
              <div className="flex flex-col items-center p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                <span className="text-[9px] text-gray-500 uppercase font-semibold mb-1">New Note</span>
                <span className="text-xs font-mono bg-black/10 dark:bg-white/10 px-2 py-1 rounded">Ctrl + N</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                <span className="text-[9px] text-gray-500 uppercase font-semibold mb-1">Search Notes</span>
                <span className="text-xs font-mono bg-black/10 dark:bg-white/10 px-2 py-1 rounded">Ctrl + F</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal (Shadcn Dialog Component overlay) */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className={`max-w-[450px] border shadow-xl flex flex-col no-drag
          ${darkMode ? 'bg-[#1a1a1e] border-white/10 text-gray-200' : 'bg-white border-black/10 text-gray-800'}`}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-1.5">
              <Settings className="w-5 h-5 text-amber-500" />
              NotesZen Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between border-b pb-3 border-black/5 dark:border-white/5">
              <div>
                <p className="text-sm font-semibold">Local Persistence Sync</p>
                <p className="text-[11px] text-gray-500">
                  {window.electronAPI ? 'Filesystem storage enabled' : 'Browser local storage fallback'}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded font-bold 
                ${window.electronAPI ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {window.electronAPI ? 'ELECTRON DISK' : 'WEB STORAGE'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b pb-3 border-black/5 dark:border-white/5">
              <div>
                <p className="text-sm font-semibold">Theme Mode</p>
                <p className="text-[11px] text-gray-500">Switch application theme mode</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="text-xs px-3 font-semibold transition-all"
              >
                {darkMode ? 'Switch to Light' : 'Switch to Dark'}
              </Button>
            </div>

            <div className="border-b pb-3 border-black/5 dark:border-white/5">
              <p className="text-sm font-semibold mb-1">Keyboard Shortcuts</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 mt-2">
                <div className="flex justify-between p-1 bg-black/10 dark:bg-white/10 rounded px-2">
                  <span>New Note</span>
                  <kbd className="font-mono bg-black/20 dark:bg-white/20 px-1 rounded">Ctrl + N</kbd>
                </div>
                <div className="flex justify-between p-1 bg-black/10 dark:bg-white/10 rounded px-2">
                  <span>Search</span>
                  <kbd className="font-mono bg-black/20 dark:bg-white/20 px-1 rounded">Ctrl + F</kbd>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-400 leading-normal">
                NotesZen stores data locally. On Arch Linux, notes reside inside your Electron appData directory, allowing local git synchronization or custom system backups.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowSettings(false)}
            className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
