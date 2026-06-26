import type { Folder, Note } from '../types'

interface FilterContext {
  activeFolder: string
  selectedTag: string | null
  folders: Folder[]
  recentNoteIds: string[]
}

export function filterNotesByContext(notes: Note[], ctx: FilterContext): Note[] {
  return notes.filter((note) => {
    if (ctx.selectedTag) {
      return note.folder !== 'trash' && note.tags?.includes(ctx.selectedTag)
    }

    if (ctx.activeFolder === 'trash') return note.folder === 'trash'
    if (note.folder === 'trash') return false

    if (ctx.activeFolder === 'archive') return note.isArchived
    if (note.isArchived) return false

    if (ctx.activeFolder === 'favorites') return note.isFavorite
    if (ctx.activeFolder === 'daily') return note.folder === 'daily'
    if (ctx.activeFolder === 'recent') return ctx.recentNoteIds.includes(note.id)

    if (ctx.folders.some((f) => f.id === ctx.activeFolder)) {
      return note.folder === ctx.activeFolder
    }

    return true
  })
}