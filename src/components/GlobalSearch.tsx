import { useState, useEffect, useMemo, useRef } from 'react'
import { useNotesStore } from '../store/useNotesStore'
import Fuse from 'fuse.js'
import { Search, X, FileText, Calendar } from 'lucide-react'

export default function GlobalSearch() {
  const {
    notes,
    isGlobalSearchOpen,
    setGlobalSearchOpen,
    setSelectedNoteId
  } = useNotesStore()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)

  // Initialize Fuse.js for notes
  const fuse = useMemo(() => {
    const activeNotes = notes.filter(n => n.folder !== 'trash')
    return new Fuse(activeNotes, {
      keys: ['title', 'content', 'tags'],
      threshold: 0.4,
      ignoreLocation: true,
      includeMatches: true
    })
  }, [notes])

  // Get search results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Return 5 most recently updated notes as defaults
      return notes
        .filter(n => n.folder !== 'trash')
        .slice(0, 5)
        .map(n => ({
          item: n,
          snippet: n.content.replace(/<[^>]*>/g, '').substring(0, 90)
        }))
    }

    const searchResults = fuse.search(query)
    return searchResults.map(res => {
      // Find matching snippet
      let snippet = ''
      const contentMatch = res.matches?.find(m => m.key === 'content')
      
      if (contentMatch && contentMatch.value) {
        const val = contentMatch.value
        const idx = val.toLowerCase().indexOf(query.toLowerCase())
        if (idx !== -1) {
          const start = Math.max(0, idx - 40)
          const end = Math.min(val.length, idx + 60)
          snippet = (start > 0 ? '...' : '') + val.substring(start, end) + (end < val.length ? '...' : '')
        }
      }

      if (!snippet) {
        snippet = res.item.content.replace(/<[^>]*>/g, '').substring(0, 90)
      }

      return {
        item: res.item,
        snippet
      }
    })
  }, [query, fuse, notes])

  // Reset index on query change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Handle keys
  useEffect(() => {
    if (!isGlobalSearchOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          setSelectedNoteId(results[selectedIndex].item.id)
          setGlobalSearchOpen(false)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setGlobalSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGlobalSearchOpen, results, selectedIndex])

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setGlobalSearchOpen(false)
      }
    }
    if (isGlobalSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isGlobalSearchOpen])

  if (!isGlobalSearchOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-xs select-none">
      <div 
        ref={modalRef}
        className="w-[600px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden bg-white dark:bg-[#1a1a1f] border-black/10 dark:border-white/10"
      >
        <div className="flex items-center px-4 py-3 gap-2 border-b border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow bg-transparent border-0 outline-none text-sm placeholder-gray-400 focus:ring-0"
            autoFocus
          />
          <button 
            onClick={() => setGlobalSearchOpen(false)}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin space-y-1">
          <p className="text-[9px] font-bold tracking-wider text-gray-400/80 uppercase px-2 mb-1">
            {query.trim() ? `Search Matches (${results.length})` : 'Recent Activity'}
          </p>
          
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 font-medium">
              No notes found matching "{query}"
            </div>
          ) : (
            results.map((res, idx) => {
              const isSelected = idx === selectedIndex
              const isDaily = res.item.title.startsWith('Daily Note')

              return (
                <button
                  key={res.item.id}
                  onClick={() => {
                    setSelectedNoteId(res.item.id)
                    setGlobalSearchOpen(false)
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex flex-col px-3 py-2.5 rounded-xl transition-all border text-left
                    ${isSelected 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'border-transparent hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs flex items-center gap-1.5 dark:text-gray-200">
                      {isDaily ? (
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      {res.item.title}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium">
                      {new Date(res.item.updatedAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-full font-normal leading-relaxed pl-5">
                    {res.snippet}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
