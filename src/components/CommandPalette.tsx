import { useNotesStore } from '../store/useNotesStore'
import {
  FileText,
  Plus,
  Pin,
  Star,
  Archive,
  Trash,
  Calendar,
  Trash2,
  Network,
  LayoutTemplate,
} from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'

export default function CommandPalette() {
  const {
    notes,
    templates,
    selectedNoteId,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveFolder,
    setGraphViewOpen,
    createNote,
    createDailyNote,
    createNoteFromTemplate,
    setSelectedNoteId,
    togglePin,
    toggleFavorite,
    toggleArchive,
    deleteNote,
  } = useNotesStore()

  const activeNote = notes.find((n) => n.id === selectedNoteId) || null

  const navigation = [
    { id: 'go-notes', title: 'Go to Notes', keywords: 'notes all', icon: FileText, action: () => setActiveFolder('notes') },
    { id: 'go-favorites', title: 'Go to Favorites', keywords: 'favorites starred fav', icon: Star, action: () => setActiveFolder('favorites') },
    { id: 'go-daily', title: 'Go to Daily Notes', keywords: 'daily journal today', icon: Calendar, action: () => setActiveFolder('daily') },
    { id: 'go-recent', title: 'Go to Recent', keywords: 'recent history', icon: FileText, action: () => setActiveFolder('recent') },
    { id: 'go-trash', title: 'Go to Trash', keywords: 'trash deleted bin', icon: Trash2, action: () => setActiveFolder('trash') },
    { id: 'go-graph', title: 'Open Graph View', keywords: 'graph network links', icon: Network, action: () => setGraphViewOpen(true) },
  ]

  const actions = [
    { id: 'create-note', title: 'Create New Note', icon: Plus, shortcut: '⌘N', action: () => createNote() },
    { id: 'daily-note', title: 'Open Daily Note', icon: FileText, shortcut: '⌘D', action: () => createDailyNote() },
    { id: 'toggle-pin', title: activeNote?.isPinned ? 'Unpin Selected Note' : 'Pin Selected Note', icon: Pin, shortcut: '⌘P', action: () => selectedNoteId && togglePin(selectedNoteId) },
    { id: 'toggle-fav', title: activeNote?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites', icon: Star, shortcut: '⌘⇧S', action: () => selectedNoteId && toggleFavorite(selectedNoteId) },
    { id: 'archive-note', title: activeNote?.isArchived ? 'Unarchive Selected Note' : 'Archive Selected Note', icon: Archive, shortcut: '⌘⇧A', action: () => selectedNoteId && toggleArchive(selectedNoteId) },
    { id: 'delete-note', title: 'Delete Selected Note', icon: Trash, shortcut: '⌘⌫', action: () => selectedNoteId && deleteNote(selectedNoteId) },
  ]

  const availableNotes = notes.filter((n) => n.folder !== 'trash')

  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search notes..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Views">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.keywords}`}
                onSelect={() => { item.action(); setCommandPaletteOpen(false) }}
              >
                <Icon data-icon="inline-start" />
                <span>{item.title}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandGroup heading="Actions">
          {actions.map((act) => {
            const Icon = act.icon
            return (
              <CommandItem key={act.id} onSelect={() => { act.action(); setCommandPaletteOpen(false) }}>
                <Icon data-icon="inline-start" />
                <span>{act.title}</span>
                <CommandShortcut>{act.shortcut}</CommandShortcut>
              </CommandItem>
            )
          })}
        </CommandGroup>

        {templates.length > 0 && (
          <CommandGroup heading="Templates">
            {templates.map((t) => (
              <CommandItem
                key={t.id}
                onSelect={() => { createNoteFromTemplate(t.id); setCommandPaletteOpen(false) }}
              >
                <LayoutTemplate data-icon="inline-start" />
                <span>{t.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {availableNotes.length > 0 && (
          <CommandGroup heading="Notes">
            {availableNotes.map((note) => (
              <CommandItem
                key={note.id}
                onSelect={() => { setSelectedNoteId(note.id); setCommandPaletteOpen(false) }}
              >
                <FileText data-icon="inline-start" />
                <span>{note.title || 'Untitled Note'}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}