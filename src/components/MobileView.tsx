import { useMemo, useEffect } from 'react'
import { useNotesStore } from '../store/useNotesStore'
import { useShallow } from 'zustand/react/shallow'
import { FileText, Search, Star, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
export default function MobileView() {
  const { notes, searchQuery, setSearchQuery, selectedNoteId, setSelectedNoteId, initApp } = useNotesStore(
    useShallow((s) => ({
      notes: s.notes,
      searchQuery: s.searchQuery,
      setSearchQuery: s.setSearchQuery,
      selectedNoteId: s.selectedNoteId,
      setSelectedNoteId: s.setSelectedNoteId,
      initApp: s.initApp,
    }))
  )

  useEffect(() => {
    initApp()
  }, [initApp])

  const filtered = useMemo(() => {
    const active = notes.filter((n) => n.folder !== 'trash' && !n.isArchived)
    if (!searchQuery.trim()) return active.slice(0, 50)
    const q = searchQuery.toLowerCase()
    return active.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }, [notes, searchQuery])

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="px-4 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          NotesZen
        </h1>
        <p className="text-[10px] text-muted-foreground mt-0.5">Mobile read-only companion</p>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className="w-full text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                {note.isFavorite ? (
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                ) : note.folder === 'daily' ? (
                  <Calendar className="w-3 h-3 text-emerald-500" />
                ) : (
                  <FileText className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="font-semibold text-xs truncate">{note.title || 'Untitled'}</span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {note.content.replace(/<[^>]*>/g, '').substring(0, 120)}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>

      {selectedNoteId && (
        <div className="border-t border-border p-4 max-h-[50vh] overflow-auto shrink-0 bg-card">
          {(() => {
            const note = notes.find((n) => n.id === selectedNoteId)
            if (!note) return null
            return (
              <div>
                <h2 className="font-bold text-sm mb-2">{note.title}</h2>
                <div
                  className="prose-editor text-xs text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}