import { useMemo, useState } from 'react'
import { CircleCheck, CircleSlash, FileText, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { notify } from '@/lib/toast'
import { useNotesStore } from '@/store/useNotesStore'
import type { SidebarTodo } from '@/lib/todos'

const PANEL_X = 'px-3'

type TaskFilter = 'unfinished' | 'done'

export default function TodoPanel({ onClose }: { onClose?: () => void }) {
  const {
    notes,
    selectedNoteId,
    noteTodosByNoteId,
    addNoteTodo,
    toggleNoteTodo,
    deleteNoteTodo,
    clearCompletedNoteTodos,
  } = useNotesStore()
  const [draft, setDraft] = useState('')
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('unfinished')
  const [date, setDate] = useState<Date | undefined>(new Date())

  const activeNote = notes.find((note) => note.id === selectedNoteId) || null
  const todos = useMemo(
    () => (activeNote ? noteTodosByNoteId[activeNote.id] ?? [] : []),
    [activeNote, noteTodosByNoteId]
  )
  const openTodos = todos.filter((todo) => !todo.checked)
  const doneTodos = todos.filter((todo) => todo.checked)
  const visibleTodos = taskFilter === 'unfinished' ? openTodos : doneTodos

  const addTodo = () => {
    if (!activeNote || !draft.trim()) return
    addNoteTodo(activeNote.id, draft)
    setDraft('')
  }

  const clearCompleted = () => {
    if (!activeNote || doneTodos.length === 0) return
    clearCompletedNoteTodos(activeNote.id)
    notify.success('Cleared completed tasks')
  }

  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-2 border-b border-border py-2.5',
          PANEL_X
        )}
      >
        <p className="text-sm font-semibold">Todo</p>
        {onClose && (
          <Button variant="ghost" size="icon-xs" onClick={onClose} title="Close (Ctrl+Shift+B)">
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {!activeNote ? (
          <Empty className="border-none py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle className="text-base">Open a note</EmptyTitle>
              <EmptyDescription>Select a note to add and manage tasks.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className={cn('shrink-0 py-2.5 pb-2', PANEL_X)}>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  addTodo()
                }}
              >
                <div className="relative">
                  <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="New task..."
                    className="pr-9 text-sm"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon-xs"
                    disabled={!draft.trim()}
                    title="Add task"
                    className="absolute top-1/2 right-1.5 -translate-y-1/2"
                  >
                    <Plus />
                  </Button>
                </div>
              </form>
            </div>

            <div
              className={cn(
                'flex shrink-0 items-center justify-between border-b border-border',
                PANEL_X
              )}
            >
              <Tabs
                value={taskFilter}
                onValueChange={(value) => setTaskFilter(value as TaskFilter)}
                className="gap-0"
              >
                <TabsList variant="line" className="h-9 gap-5 bg-transparent p-0">
                  <TabsTrigger
                    value="unfinished"
                    className="flex-none gap-1.5 px-0 after:bg-primary data-active:text-foreground"
                  >
                    <CircleSlash className="size-3.5" />
                    Unfinished
                  </TabsTrigger>
                  <TabsTrigger
                    value="done"
                    className="flex-none gap-1.5 px-0 after:bg-primary data-active:text-foreground"
                  >
                    <CircleCheck className="size-3.5" />
                    Done
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {taskFilter === 'done' && doneTodos.length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 shrink-0 text-[11px] text-muted-foreground"
                  onClick={clearCompleted}
                >
                  Clear
                </Button>
              )}
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className={cn('pb-4 pt-2', PANEL_X)}>
                {visibleTodos.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    {taskFilter === 'unfinished'
                      ? 'No tasks yet. Add one above.'
                      : 'No completed tasks.'}
                  </p>
                ) : (
                  <ul className="task-panel-list flex min-w-0 flex-col gap-0.5">
                    {visibleTodos.map((todo) => (
                      <TaskRow
                        key={todo.id}
                        todo={todo}
                        onToggle={() => toggleNoteTodo(activeNote.id, todo.id)}
                        onDelete={() => deleteNoteTodo(activeNote.id, todo.id)}
                        completed={taskFilter === 'done'}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      <div className="flex shrink-0 justify-center border-t border-border py-2">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          captionLayout="dropdown"
          className="bg-transparent [--cell-radius:var(--radius-md)]"
          components={{
            DayButton: (props) => (
              <CalendarDayButton
                {...props}
                className="data-[selected-single=true]:!rounded-md data-[selected-single=true]:!bg-foreground data-[selected-single=true]:!text-background hover:data-[selected-single=true]:!bg-foreground"
              />
            ),
          }}
        />
      </div>
    </aside>
  )
}

function TaskRow({
  todo,
  onToggle,
  onDelete,
  completed,
}: {
  todo: SidebarTodo
  onToggle: () => void
  onDelete: () => void
  completed?: boolean
}) {
  if (!todo.text.trim()) return null

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
          className="mt-1 shrink-0"
          aria-label={todo.checked ? 'Mark open' : 'Mark done'}
        />
        <span
          className={cn(
            'min-w-0 py-1 text-sm leading-snug break-words [overflow-wrap:anywhere]',
            completed && 'text-muted-foreground line-through'
          )}
        >
          {todo.text}
        </span>
        <button
          type="button"
          className="mt-0.5 flex size-6 shrink-0 items-center justify-center text-muted-foreground/40 hover:text-destructive"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  )
}