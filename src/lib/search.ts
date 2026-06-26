import Fuse from 'fuse.js'
import type { Note } from '../types'

export function createNotesFuse(notes: Note[]) {
  return new Fuse(notes, {
    keys: ['title', 'content', 'tags'],
    threshold: 0.4,
    ignoreLocation: true,
    includeMatches: true,
  })
}

export function filterNotesWithFuse(notes: Note[], query: string): Note[] {
  if (!query.trim()) return notes
  const fuse = createNotesFuse(notes)
  return fuse.search(query.trim()).map((r) => r.item)
}

export function getSearchSnippet(note: Note, query: string): string {
  const plain = note.content.replace(/<[^>]*>/g, '')
  if (!query.trim()) return plain.substring(0, 90)
  const idx = plain.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return plain.substring(0, 90)
  const start = Math.max(0, idx - 40)
  const end = Math.min(plain.length, idx + 60)
  return (start > 0 ? '...' : '') + plain.substring(start, end) + (end < plain.length ? '...' : '')
}