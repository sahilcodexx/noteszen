import { useMemo } from 'react'
import { useNotesStore } from '../store/useNotesStore'
import { X, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
export default function GraphView() {
  const { notes, isGraphViewOpen, setGraphViewOpen, setSelectedNoteId } = useNotesStore()

  const { nodes, edges } = useMemo(() => {
    const active = notes.filter((n) => n.folder !== 'trash')
    const nodeList = active.map((n) => ({
      id: n.id,
      title: n.title || 'Untitled',
      x: 0,
      y: 0,
    }))

    const edgeList: { from: string; to: string }[] = []
    active.forEach((note) => {
      note.backlinks?.forEach((targetId) => {
        if (active.some((n) => n.id === targetId)) {
          edgeList.push({ from: note.id, to: targetId })
        }
      })
    })

    const cols = Math.ceil(Math.sqrt(nodeList.length || 1))
    nodeList.forEach((node, i) => {
      node.x = (i % cols) * 140 + 60
      node.y = Math.floor(i / cols) * 100 + 60
    })

    return { nodes: nodeList, edges: edgeList }
  }, [notes])

  if (!isGraphViewOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="w-[90vw] h-[80vh] max-w-5xl rounded-2xl border shadow-2xl bg-popover flex flex-col overflow-hidden">
        <div className="h-12 px-4 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Network className="w-4 h-4 text-primary" />
            Note Graph
            <span className="text-[10px] text-muted-foreground font-medium">
              {nodes.length} notes · {edges.length} links
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setGraphViewOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 relative overflow-auto bg-muted/20">
          <svg className="min-w-full min-h-full" style={{ minWidth: 800, minHeight: 500 }}>
            {edges.map((edge, i) => {
              const from = nodes.find((n) => n.id === edge.from)
              const to = nodes.find((n) => n.id === edge.to)
              if (!from || !to) return null
              return (
                <line
                  key={i}
                  x1={from.x + 50}
                  y1={from.y + 20}
                  x2={to.x + 50}
                  y2={to.y + 20}
                  stroke="currentColor"
                  className="text-primary/30"
                  strokeWidth={1.5}
                />
              )
            })}
            {nodes.map((node) => (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedNoteId(node.id)
                  setGraphViewOpen(false)
                }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={100}
                  height={40}
                  rx={8}
                  className="fill-card stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={node.x + 50}
                  y={node.y + 24}
                  textAnchor="middle"
                  className="fill-foreground text-[9px] font-semibold"
                >
                  {node.title.length > 14 ? node.title.slice(0, 12) + '…' : node.title}
                </text>
              </g>
            ))}
          </svg>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Create notes with [[wikilinks]] to see connections
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
          Click a node to open the note. Links are built from [[Note Title]] syntax.
        </div>
      </div>
    </div>
  )
}