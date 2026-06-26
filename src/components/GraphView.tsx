import { useMemo, useState } from 'react'
import { useNotesStore } from '../store/useNotesStore'
import { X, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SimNode {
  id: string
  title: string
  x: number
  y: number
  vx: number
  vy: number
}

function simulateLayout(
  nodeList: { id: string; title: string }[],
  edgeList: { from: string; to: string }[],
  width: number,
  height: number
) {
  const nodes: SimNode[] = nodeList.map((n, i) => ({
    ...n,
    x: width / 2 + Math.cos((i / nodeList.length) * Math.PI * 2) * 120,
    y: height / 2 + Math.sin((i / nodeList.length) * Math.PI * 2) * 120,
    vx: 0,
    vy: 0,
  }))

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  for (let iter = 0; iter < 120; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
        const force = 8000 / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx -= fx
        a.vy -= fy
        b.vx += fx
        b.vy += fy
      }
    }

    edgeList.forEach((edge) => {
      const from = nodeMap.get(edge.from)
      const to = nodeMap.get(edge.to)
      if (!from || !to) return
      const dx = to.x - from.x
      const dy = to.y - from.y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const force = (dist - 140) * 0.05
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      from.vx += fx
      from.vy += fy
      to.vx -= fx
      to.vy -= fy
    })

    nodes.forEach((n) => {
      n.vx += (width / 2 - n.x) * 0.002
      n.vy += (height / 2 - n.y) * 0.002
      n.vx *= 0.85
      n.vy *= 0.85
      n.x += n.vx
      n.y += n.vy
      n.x = Math.max(60, Math.min(width - 60, n.x))
      n.y = Math.max(40, Math.min(height - 40, n.y))
    })
  }

  return nodes
}

export default function GraphView() {
  const { notes, isGraphViewOpen, setGraphViewOpen, setSelectedNoteId, selectedNoteId } =
    useNotesStore()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { nodes, edges } = useMemo(() => {
    const active = notes.filter((n) => n.folder !== 'trash')
    const nodeList = active.map((n) => ({
      id: n.id,
      title: n.title || 'Untitled',
    }))

    const edgeList: { from: string; to: string }[] = []
    active.forEach((note) => {
      note.backlinks?.forEach((targetId) => {
        if (active.some((n) => n.id === targetId)) {
          edgeList.push({ from: note.id, to: targetId })
        }
      })
    })

    const layoutNodes = simulateLayout(nodeList, edgeList, 900, 520)

    return { nodes: layoutNodes, edges: edgeList }
  }, [notes])

  if (!isGraphViewOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="w-[90vw] h-[80vh] max-w-5xl rounded-2xl border shadow-2xl bg-popover flex flex-col overflow-hidden">
        <div className="h-12 px-4 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Network className="size-4 text-primary" />
            Note Graph
            <span className="text-[10px] text-muted-foreground font-medium">
              {nodes.length} notes · {edges.length} links
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setGraphViewOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 relative overflow-hidden bg-muted/20">
          <svg className="w-full h-full" viewBox="0 0 900 520">
            {edges.map((edge, i) => {
              const from = nodes.find((n) => n.id === edge.from)
              const to = nodes.find((n) => n.id === edge.to)
              if (!from || !to) return null
              const isHighlighted =
                hoveredId === edge.from ||
                hoveredId === edge.to ||
                selectedNoteId === edge.from ||
                selectedNoteId === edge.to
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="currentColor"
                  className={cn(
                    'transition-colors',
                    isHighlighted ? 'text-primary/60' : 'text-primary/20'
                  )}
                  strokeWidth={isHighlighted ? 2 : 1}
                />
              )
            })}
            {nodes.map((node) => {
              const isActive = node.id === selectedNoteId || node.id === hoveredId
              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    setSelectedNoteId(node.id)
                    setGraphViewOpen(false)
                  }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? 28 : 22}
                    className={cn(
                      'fill-card stroke-border transition-all duration-200',
                      isActive && 'stroke-primary fill-primary/10'
                    )}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    className={cn(
                      'fill-foreground text-[8px] font-semibold pointer-events-none',
                      isActive && 'fill-primary'
                    )}
                  >
                    {node.title.length > 10 ? node.title.slice(0, 8) + '…' : node.title}
                  </text>
                </g>
              )
            })}
          </svg>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Create notes with [[wikilinks]] to see connections
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
          Force-directed layout · Click a node to open the note
        </div>
      </div>
    </div>
  )
}