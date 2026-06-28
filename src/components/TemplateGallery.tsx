import { LayoutTemplate, Plus } from 'lucide-react'
import { useNotesStore } from '../store/useNotesStore'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import GridCard from './GridCard'

function previewText(content: string, max = 140) {
  return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, max)
}

export default function TemplateGallery() {
  const { templates, createNoteFromTemplate } = useNotesStore()

  if (templates.length === 0) {
    return (
      <Empty className="border-none py-6">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LayoutTemplate />
          </EmptyMedia>
          <EmptyTitle>No templates yet</EmptyTitle>
          <EmptyDescription>Create templates from the command palette or add them in settings.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
      {templates.map((t) => (
        <GridCard
          key={t.id}
          title={t.name}
          description={t.title}
          preview={previewText(t.content) || 'No content yet'}
          actionLabel="Use Template"
          actionIcon={<Plus data-icon="inline-start" />}
          onAction={() => createNoteFromTemplate(t.id)}
        />
      ))}
    </div>
  )
}