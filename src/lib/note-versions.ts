import type { Note, NoteVersion } from '../types'

const STORAGE_KEY = 'noteszen-note-versions'
const MAX_VERSIONS_PER_NOTE = 50

function readAll(): NoteVersion[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as NoteVersion[]
  } catch {
    return []
  }
}

function writeAll(versions: NoteVersion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versions))
}

export function saveLocalNoteVersion(previous: Note) {
  const versions = readAll()
  const entry: NoteVersion = {
    id: `${previous.id}-${Date.now()}`,
    noteId: previous.id,
    title: previous.title,
    content: previous.content,
    createdAt: new Date().toISOString(),
  }
  const updated = [entry, ...versions.filter((v) => v.noteId !== previous.id || v.id !== entry.id)]
  const perNote = updated.filter((v) => v.noteId === previous.id)
  if (perNote.length > MAX_VERSIONS_PER_NOTE) {
    const drop = new Set(perNote.slice(MAX_VERSIONS_PER_NOTE).map((v) => v.id))
    writeAll(updated.filter((v) => !drop.has(v.id)))
  } else {
    writeAll(updated)
  }
}

export function getLocalNoteVersions(noteId: string): NoteVersion[] {
  return readAll()
    .filter((v) => v.noteId === noteId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_VERSIONS_PER_NOTE)
}

export function restoreLocalNoteVersion(versionId: string): Note | null {
  const versions = readAll()
  const version = versions.find((v) => v.id === versionId)
  if (!version) return null

  const notesRaw = localStorage.getItem('noteszen-db-notes')
  if (!notesRaw) return null

  try {
    const notes = JSON.parse(notesRaw) as Note[]
    const index = notes.findIndex((n) => n.id === version.noteId)
    if (index === -1) return null

    const restored: Note = {
      ...notes[index],
      title: version.title,
      content: version.content,
      updatedAt: new Date().toISOString(),
    }
    notes[index] = restored
    localStorage.setItem('noteszen-db-notes', JSON.stringify(notes))
    return restored
  } catch {
    return null
  }
}