import type { Note } from '@/types'

export interface SidebarTodo {
  id: string
  text: string
  checked: boolean
  createdAt: string
}

export interface NoteTodoWithMeta extends SidebarTodo {
  noteId: string
  noteTitle: string
}

const STORAGE_KEY = 'noteszen-note-todos'

export function loadNoteTodosStorage(): Record<string, SidebarTodo[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, SidebarTodo[]>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function saveNoteTodosStorage(data: Record<string, SidebarTodo[]>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getTodosForNote(
  data: Record<string, SidebarTodo[]>,
  noteId: string
): SidebarTodo[] {
  return data[noteId] ?? []
}

export function addTodoToStore(
  data: Record<string, SidebarTodo[]>,
  noteId: string,
  text: string
): Record<string, SidebarTodo[]> {
  const cleanText = text.trim()
  if (!cleanText) return data

  const todo: SidebarTodo = {
    id: crypto.randomUUID(),
    text: cleanText,
    checked: false,
    createdAt: new Date().toISOString(),
  }

  return {
    ...data,
    [noteId]: [...(data[noteId] ?? []), todo],
  }
}

export function toggleTodoInStore(
  data: Record<string, SidebarTodo[]>,
  noteId: string,
  todoId: string
): Record<string, SidebarTodo[]> {
  const todos = data[noteId]
  if (!todos) return data

  return {
    ...data,
    [noteId]: todos.map((todo) =>
      todo.id === todoId ? { ...todo, checked: !todo.checked } : todo
    ),
  }
}

export function deleteTodoFromStore(
  data: Record<string, SidebarTodo[]>,
  noteId: string,
  todoId: string
): Record<string, SidebarTodo[]> {
  const todos = data[noteId]
  if (!todos) return data

  const next = todos.filter((todo) => todo.id !== todoId)
  if (next.length === 0) {
    const rest = { ...data }
    delete rest[noteId]
    return rest
  }

  return { ...data, [noteId]: next }
}

export function clearCompletedTodosFromStore(
  data: Record<string, SidebarTodo[]>,
  noteId: string
): Record<string, SidebarTodo[]> {
  const todos = data[noteId]
  if (!todos) return data

  const next = todos.filter((todo) => !todo.checked)
  if (next.length === 0) {
    const rest = { ...data }
    delete rest[noteId]
    return rest
  }

  return { ...data, [noteId]: next }
}

export function removeTodosForNote(
  data: Record<string, SidebarTodo[]>,
  noteId: string
): Record<string, SidebarTodo[]> {
  if (!(noteId in data)) return data
  const rest = { ...data }
  delete rest[noteId]
  return rest
}

export function extractAllOpenTodos(
  notes: Note[],
  noteTodosByNoteId: Record<string, SidebarTodo[]>,
  excludeNoteId?: string
): NoteTodoWithMeta[] {
  const result: NoteTodoWithMeta[] = []

  for (const note of notes) {
    if (note.folder === 'trash' || note.isArchived) continue
    if (excludeNoteId && note.id === excludeNoteId) continue

    for (const todo of getTodosForNote(noteTodosByNoteId, note.id)) {
      if (!todo.checked && todo.text.trim()) {
        result.push({
          ...todo,
          noteId: note.id,
          noteTitle: note.title || 'Untitled',
        })
      }
    }
  }

  return result.sort((a, b) => a.noteTitle.localeCompare(b.noteTitle))
}