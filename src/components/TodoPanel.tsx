import { useMemo, useState, type ReactNode } from 'react'
import {
  ChevronRight,
  FileText,
  Link2,
  ListTree,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import { extractHeadings } from '@/lib/headings'
import { notify } from '@/lib/toast'
import { useNotesStore } from '@/store/useNotesStore'
import type { Note } from '@/types'
import {
  addTodoToContent,
  extractAllOpenTodos,
  extractTodos,
  removeCompletedTodosFromContent,
  removeTodoFromContent,
  toggleTodoInContent,
  type NoteTodo,
  type NoteTodoWithMeta,
} from '@/lib/todos'

const PANEL_X = 'px-3'

function PanelSection({
  title,
  count,
  children,
  className,
}: {
  title: string
  count?: number
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('py-2', className)}>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {typeof count === 'number' && (
          <span className="text-[10px] tabular-nums text-muted-foreground/80">{count}</span>
        )}
      </div>
      {children}
    </section>
  )
}

export default function TodoPanel({ onClose }: { onClose?: () => void }) {
  const { notes, selectedNoteId, mainView, updateNote, openNote } = useNotesStore()
  const [draft, setDraft] = useState('')
  const [doneOpen, setDoneOpen] = useState(true)

  const activeNote = notes.find((note) => note.id === selectedNoteId) || null
  const todos = useMemo(() => extractTodos(activeNote), [activeNote])
  const openTodos = todos.filter((todo) => !todo.checked)
  const doneTodos = todos.filter((todo) => todo.checked)

  const globalOpenTodos = useMemo(
    () => extractAllOpenTodos(notes, activeNote?.id),
    [notes, activeNote?.id]
  )

  const backlinks = useMemo(() => {
    if (!activeNote) return [] as Note[]
    return notes.filter(
      (n) =>
        n.id !== activeNote.id &&
        n.folder !== 'trash' &&
        n.backlinks?.includes(activeNote.id)
    )
  }, [notes, activeNote])

  const headings = useMemo(
    () => (activeNote ? extractHeadings(activeNote.content) : []),
    [activeNote]
  )

  const totalOpen =
    openTodos.length + globalOpenTodos.length

  const mutateNoteTodo = (
    noteId: string,
    index: number,
    action: 'toggle' | 'delete'
  ) => {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return
    const content =
      action === 'toggle'
        ? toggleTodoInContent(note, index)
        : removeTodoFromContent(note, index)
    updateNote(noteId, { content })
  }

  const addTodo = () => {
    if (!activeNote || !draft.trim()) return
    updateNote(activeNote.id, { content: addTodoToContent(activeNote, draft) })
    setDraft('')
    if (mainView === 'editor' && selectedNoteId === activeNote.id) {
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('noteszen:jump-task', { detail: { index: todos.length } })
        )
      }, 80)
    }
  }

  const clearCompleted = () => {
    if (!activeNote || doneTodos.length === 0) return
    updateNote(activeNote.id, { content: removeCompletedTodosFromContent(activeNote) })
    notify.success('Cleared completed tasks')
  }

  const jumpToHeading = (id: string) => {
    if (mainView === 'editor' && selectedNoteId === activeNote?.id) {
      window.dispatchEvent(new CustomEvent('noteszen:jump-heading', { detail: { id } }))
    }
  }

  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-2 border-b border-border py-2.5',
          PANEL_X
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">Todo</p>
          <p className="mt-0.5 text-[11px] leading-none text-muted-foreground">
            {totalOpen > 0
              ? `${totalOpen} open across notes`
              : activeNote
                ? 'No open tasks'
                : 'Open a note to add tasks'}
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            onClick={onClose}
            title="Close (Ctrl+Shift+B)"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn('flex min-w-0 flex-col pb-4', PANEL_X)}>
          {!activeNote ? (
            <Empty className="border-none py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle className="text-base">Open a note</EmptyTitle>
                <EmptyDescription>
                  Select a note to manage its tasks and see note context below.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <PanelSection title="This note" count={openTodos.length}>
              <form
                className="mb-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  addTodo()
                }}
              >
                <InputGroup className="h-9 w-full">
                  <InputGroupInput
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="New task..."
                    className="text-sm"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="submit"
                      variant="ghost"
                      size="icon-xs"
                      disabled={!draft.trim()}
                      title="Add task"
                    >
                      <Plus />
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </form>

              {todos.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/80 px-3 py-4 text-center text-xs text-muted-foreground">
                  No tasks in this note yet.
                </p>
              ) : (
                <>
                  {openTodos.length > 0 ? (
                    <ul className="task-panel-list flex min-w-0 flex-col gap-0.5">
                      {openTodos.map((todo) => (
                        <TaskRow
                          key={`open-${todo.index}-${todo.text}`}
                          todo={todo}
                          onToggle={() => mutateNoteTodo(activeNote.id, todo.index, 'toggle')}
                          onDelete={() => mutateNoteTodo(activeNote.id, todo.index, 'delete')}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-lg bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
                      All tasks in this note are done.
                    </p>
                  )}

                  {doneTodos.length > 0 && (
                    <Collapsible open={doneOpen} onOpenChange={setDoneOpen} className="mt-2">
                      <div className="flex items-center justify-between gap-2">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <ChevronRight
                              className={cn(
                                'size-3.5 shrink-0 transition-transform',
                                doneOpen && 'rotate-90'
                              )}
                            />
                            Completed
                            <span className="tabular-nums text-muted-foreground/80">
                              ({doneTodos.length})
                            </span>
                          </button>
                        </CollapsibleTrigger>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 shrink-0 text-[11px] text-muted-foreground"
                          onClick={clearCompleted}
                        >
                          Clear all
                        </Button>
                      </div>
                      <CollapsibleContent>
                        <ul className="task-panel-list mt-0.5 flex min-w-0 flex-col gap-0.5">
                          {doneTodos.map((todo) => (
                            <TaskRow
                              key={`done-${todo.index}-${todo.text}`}
                              todo={todo}
                              onToggle={() => mutateNoteTodo(activeNote.id, todo.index, 'toggle')}
                              onDelete={() => mutateNoteTodo(activeNote.id, todo.index, 'delete')}
                              completed
                            />
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </>
              )}
            </PanelSection>
          )}

          <Separator className="my-1" />

          <PanelSection title="All open tasks" count={globalOpenTodos.length}>
            {globalOpenTodos.length === 0 ? (
              <p className="rounded-lg bg-muted/30 px-3 py-3 text-center text-xs text-muted-foreground">
                {activeNote
                  ? 'No other open tasks in your vault.'
                  : 'No open tasks in your vault.'}
              </p>
            ) : (
              <ul className="task-panel-list flex min-w-0 flex-col gap-0.5">
                {globalOpenTodos.map((todo) => (
                  <GlobalTaskRow
                    key={`${todo.noteId}-${todo.index}-${todo.text}`}
                    todo={todo}
                    onToggle={() => mutateNoteTodo(todo.noteId, todo.index, 'toggle')}
                    onDelete={() => mutateNoteTodo(todo.noteId, todo.index, 'delete')}
                    onOpenNote={() => openNote(todo.noteId)}
                  />
                ))}
              </ul>
            )}
          </PanelSection>

          {activeNote && (
            <>
              <Separator className="my-1" />

              <PanelSection title="Note context">
                <div className="flex flex-col gap-3 px-1">
                  {activeNote.tags?.length > 0 ? (
                    <ContextBlock icon={Tag} label="Tags">
                      <div className="flex flex-wrap gap-1.5">
                        {activeNote.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </ContextBlock>
                  ) : null}

                  {backlinks.length > 0 ? (
                    <ContextBlock icon={Link2} label="Backlinks">
                      <ul className="task-panel-list flex flex-col gap-0.5">
                        {backlinks.map((note) => (
                          <li key={note.id} className="list-none">
                            <button
                              type="button"
                              onClick={() => openNote(note.id)}
                              className="flex h-8 w-full min-w-0 items-center rounded-lg px-2 text-left text-sm transition-colors hover:bg-accent"
                            >
                              <span className="truncate">
                                {note.title || 'Untitled'}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </ContextBlock>
                  ) : null}

                  {headings.length > 0 ? (
                    <ContextBlock icon={ListTree} label="On this page">
                      <ul className="task-panel-list flex flex-col gap-0.5">
                        {headings.map((heading) => (
                          <li key={heading.id} className="list-none">
                            <button
                              type="button"
                              onClick={() => jumpToHeading(heading.id)}
                              disabled={mainView !== 'editor' || selectedNoteId !== activeNote.id}
                              className={cn(
                                'flex min-h-8 w-full min-w-0 items-center rounded-lg px-2 text-left text-sm transition-colors hover:bg-accent disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent',
                                heading.level === 2 && 'pl-4 text-[13px]',
                                heading.level === 3 && 'pl-6 text-xs text-muted-foreground'
                              )}
                            >
                              <span className="break-words [overflow-wrap:anywhere]">
                                {heading.text}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </ContextBlock>
                  ) : null}

                  {activeNote.tags?.length === 0 &&
                    backlinks.length === 0 &&
                    headings.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Add tags, headings, or [[wikilinks]] to see more context here.
                      </p>
                    )}
                </div>
              </PanelSection>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}

function ContextBlock({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        {label}
      </div>
      {children}
    </div>
  )
}

function TaskRow({
  todo,
  onToggle,
  onDelete,
  completed,
}: {
  todo: NoteTodo
  onToggle: () => void
  onDelete: () => void
  completed?: boolean
}) {
  return (
    <li className="list-none">
      <div
        className={cn(
          'group grid min-h-8 w-full min-w-0 grid-cols-[1rem_1fr_1.5rem] items-start gap-x-2.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-accent',
          completed && 'opacity-70'
        )}
      >
        <Checkbox
          checked={todo.checked}
          onCheckedChange={onToggle}
          className="mt-1 shrink-0 justify-self-center"
          aria-label={todo.checked ? 'Mark open' : 'Mark done'}
        />
        <span
          className={cn(
            'min-w-0 py-1 text-sm leading-snug break-words [overflow-wrap:anywhere]',
            completed
              ? 'text-muted-foreground line-through decoration-muted-foreground/50'
              : 'text-foreground'
          )}
        >
          {todo.text}
        </span>
        <button
          type="button"
          className="mt-0.5 flex size-6 shrink-0 items-center justify-center text-muted-foreground/40 transition-colors hover:text-destructive"
          onClick={onDelete}
          title="Delete task"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  )
}

function GlobalTaskRow({
  todo,
  onToggle,
  onDelete,
  onOpenNote,
}: {
  todo: NoteTodoWithMeta
  onToggle: () => void
  onDelete: () => void
  onOpenNote: () => void
}) {
  return (
    <li className="list-none">
      <div className="group grid min-h-8 w-full min-w-0 grid-cols-[1rem_1fr_1.5rem] items-start gap-x-2.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-accent">
        <Checkbox
          checked={false}
          onCheckedChange={onToggle}
          className="mt-1 shrink-0"
          aria-label="Mark done"
        />
        <div className="min-w-0 py-1">
          <p className="text-sm leading-snug break-words [overflow-wrap:anywhere] text-foreground">
            {todo.text}
          </p>
          <button
            type="button"
            onClick={onOpenNote}
            className="mt-0.5 truncate text-left text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {todo.noteTitle}
          </button>
        </div>
        <button
          type="button"
          className="mt-0.5 flex size-6 shrink-0 items-center justify-center text-muted-foreground/40 transition-colors hover:text-destructive"
          onClick={onDelete}
          title="Delete task"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  )
}