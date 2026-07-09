import { useState, useEffect, useMemo, useRef } from 'react'
import { useNotesStore } from '../store/useNotesStore'
import { getAPI } from '../tauri-bridge'
import Fuse from 'fuse.js'
import { Search, X, FileText, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, SearchResult } from '../types'

export default function GlobalSearch() {
  const {
    notes,
    activeVaultId,
    isGlobalSearchOpen,
    setGlobalSearchOpen,
    openNote,
  } = useNotesStore()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [ftsResults, setFtsResults] = useState<SearchResult[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  const fuse = useMemo(() => {
    const activeNotes = notes.filter((n) => n.folder !== 'trash')
    return new Fuse(activeNotes, {
      keys: ['title', 'content', 'tags'],
      threshold: 0.4,
      ignoreLocation: true,
      includeMatches: true,
    })
  }, [notes])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) return
    const api = getAPI()
    if (api?.searchNotes) {
      api.searchNotes(trimmed, activeVaultId).then(setFtsResults).catch(() => setFtsResults([]))
    }
  }, [query, activeVaultId])

  const results = useMemo(() => {
    if (!query.trim()) {
      return notes
        .filter((n) => n.folder !== 'trash')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map((n) => ({
          item: n,
          snippet: n.content.replace(/<[^>]*>/g, '').substring(0, 90),
        }))
    }

    if (ftsResults.length > 0) {
      return ftsResults.map((r) => ({ item: r.note, snippet: r.snippet }))
    }

    const searchResults = fuse.search(query)
    return searchResults.map((res) => {
      let snippet = ''
      const contentMatch = res.matches?.find((m) => m.key === 'content')
      if (contentMatch?.value) {
        const val = contentMatch.value
        const idx = val.toLowerCase().indexOf(query.toLowerCase())
        if (idx !== -1) {
          const start = Math.max(0, idx - 40)
          const end = Math.min(val.length, idx + 60)
          snippet = (start > 0 ? '...' : '') + val.substring(start, end) + (end < val.length ? '...' : '')
        }
      }
      if (!snippet) snippet = res.item.content.replace(/<[^>]*>/g, '').substring(0, 90)
      return { item: res.item as Note, snippet }
    })
  }, [query, fuse, notes, ftsResults])

  useEffect(() => {
    if (!isGlobalSearchOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          openNote(results[selectedIndex].item.id)
          setGlobalSearchOpen(false)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setGlobalSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGlobalSearchOpen, results, selectedIndex, openNote, setGlobalSearchOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setGlobalSearchOpen(false)
      }
    }
    if (isGlobalSearchOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isGlobalSearchOpen, setGlobalSearchOpen])

  if (!isGlobalSearchOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-xs select-none">
      <div
        ref={modalRef}
        className="w-[600px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden bg-popover text-popover-foreground border-border"
      >
        <div className="flex items-center px-4 py-3 gap-2 border-b border-border bg-muted/20">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes (FTS5 + fuzzy)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="flex-grow bg-transparent border-0 outline-none text-sm placeholder-muted-foreground focus:ring-0"
            autoFocus
          />
          <button onClick={() => setGlobalSearchOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
          <p className="text-[9px] font-bold tracking-wider text-muted-foreground/80 uppercase px-2 mb-1">
            {query.trim() ? `Search Matches (${results.length})` : 'Recent Activity'}
          </p>

          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-medium">
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
                    openNote(res.item.id)
                    setGlobalSearchOpen(false)
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'w-full flex flex-col px-3 py-2.5 rounded-xl transition-all border text-left',
                    isSelected ? 'bg-accent border-accent text-accent-foreground shadow-sm' : 'border-transparent hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                      {isDaily ? <Calendar className="w-3.5 h-3.5 text-primary shrink-0" /> : <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      {res.item.title}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {new Date(res.item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate max-w-full font-normal leading-relaxed pl-5">
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