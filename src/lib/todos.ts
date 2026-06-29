import type { Note } from '@/types'

export interface NoteTodo {
  index: number
  text: string
  checked: boolean
}

export interface NoteTodoWithMeta extends NoteTodo {
  noteId: string
  noteTitle: string
}

export function extractAllOpenTodos(notes: Note[], excludeNoteId?: string): NoteTodoWithMeta[] {
  const result: NoteTodoWithMeta[] = []

  for (const note of notes) {
    if (note.folder === 'trash' || note.isArchived) continue
    if (excludeNoteId && note.id === excludeNoteId) continue

    for (const todo of extractTodos(note)) {
      if (!todo.checked) {
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function plainTextFromHtml(html: string) {
  return html
    .replace(/<input[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractTodos(note: Note | null | undefined): NoteTodo[] {
  if (!note?.content) return []

  const todos: NoteTodo[] = []
  const content = note.content

  if (note.editorMode === 'markdown') {
    const regex = /^[-*]\s+\[([ xX])\]\s+(.+)$/gm
    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      todos.push({
        index: todos.length,
        checked: match[1].toLowerCase() === 'x',
        text: match[2].trim(),
      })
    }
    return todos
  }

  const htmlTaskRegex = /<li\b(?=[^>]*(?:data-type=["']taskItem["']|data-checked=))[^>]*>[\s\S]*?<\/li>/gi
  let match: RegExpExecArray | null
  while ((match = htmlTaskRegex.exec(content)) !== null) {
    const item = match[0]
    todos.push({
      index: todos.length,
      checked: /data-checked=["']true["']/i.test(item) || /<input[^>]*checked/i.test(item),
      text: plainTextFromHtml(item),
    })
  }

  return todos
}

export function addTodoToContent(note: Note, text: string): string {
  const cleanText = text.trim()
  if (!cleanText) return note.content

  if (note.editorMode === 'markdown') {
    const separator = note.content.trim() ? '\n' : ''
    return `${note.content}${separator}- [ ] ${cleanText}`
  }

  const html = `<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>${escapeHtml(cleanText)}</p></div></li></ul>`
  return `${note.content || ''}${html}`
}

export function removeCompletedTodosFromContent(note: Note): string {
  if (!note.content) return note.content

  if (note.editorMode === 'markdown') {
    return note.content.replace(/^[-*]\s+\[[xX]\]\s+.+\n?/gm, '').replace(/\n{3,}/g, '\n\n')
  }

  return note.content.replace(
    /<li\b(?=[^>]*(?:data-type=["']taskItem["']|data-checked=))[^>]*>[\s\S]*?<\/li>/gi,
    (item) => {
      const checked =
        /data-checked=["']true["']/i.test(item) || /<input[^>]*checked/i.test(item)
      return checked ? '' : item
    }
  )
}

export function removeTodoFromContent(note: Note, targetIndex: number): string {
  if (targetIndex < 0 || !note.content) return note.content

  if (note.editorMode === 'markdown') {
    let currentIndex = 0
    return note.content
      .replace(/^[-*]\s+\[[ xX]\]\s+.+\n?/gm, (line) => {
        if (currentIndex !== targetIndex) {
          currentIndex += 1
          return line
        }
        currentIndex += 1
        return ''
      })
      .replace(/\n{3,}/g, '\n\n')
  }

  let currentIndex = 0
  return note.content.replace(
    /<li\b(?=[^>]*(?:data-type=["']taskItem["']|data-checked=))[^>]*>[\s\S]*?<\/li>/gi,
    (item) => {
      if (currentIndex !== targetIndex) {
        currentIndex += 1
        return item
      }
      currentIndex += 1
      return ''
    }
  )
}

export function toggleTodoInContent(note: Note, targetIndex: number): string {
  if (targetIndex < 0) return note.content

  if (note.editorMode === 'markdown') {
    let currentIndex = 0
    return note.content.replace(/^([-*]\s+\[)([ xX])(\]\s+.+)$/gm, (line, start, checked, end) => {
      if (currentIndex !== targetIndex) {
        currentIndex += 1
        return line
      }
      currentIndex += 1
      return `${start}${checked.toLowerCase() === 'x' ? ' ' : 'x'}${end}`
    })
  }

  let currentIndex = 0
  return note.content.replace(
    /<li\b(?=[^>]*(?:data-type=["']taskItem["']|data-checked=))[^>]*>[\s\S]*?<\/li>/gi,
    (item) => {
      if (currentIndex !== targetIndex) {
        currentIndex += 1
        return item
      }

      currentIndex += 1
      const nextChecked = !(/data-checked=["']true["']/i.test(item) || /<input[^>]*checked/i.test(item))
      let updated = item

      if (/data-checked=/i.test(updated)) {
        updated = updated.replace(/data-checked=["'](?:true|false)["']/i, `data-checked="${nextChecked}"`)
      } else {
        updated = updated.replace(/^<li\b/i, `<li data-checked="${nextChecked}"`)
      }

      updated = nextChecked
        ? updated.replace(/<input\b(?![^>]*checked)/i, '<input checked')
        : updated.replace(/\schecked(?:=["'][^"']*["'])?/i, '')

      return updated
    }
  )
}
