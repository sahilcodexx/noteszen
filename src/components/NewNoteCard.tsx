import { Plus } from 'lucide-react'
import GridCard from './GridCard'

interface NewNoteCardProps {
  onClick: () => void
  layout?: 'grid' | 'list'
  label?: string
}

export default function NewNoteCard({ onClick, layout = 'grid', label = 'New note' }: NewNoteCardProps) {
  return (
    <GridCard
      title={label}
      description="Create a new note"
      preview="No content yet"
      actionLabel={label}
      actionIcon={<Plus data-icon="inline-start" />}
      onAction={onClick}
      layout={layout}
    />
  )
}