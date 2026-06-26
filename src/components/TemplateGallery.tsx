import { LayoutTemplate, Plus } from 'lucide-react'
import { useNotesStore } from '../store/useNotesStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {templates.map((t) => (
        <Card key={t.id} size="sm" className="hover:ring-primary/20 transition-all">
          <CardHeader>
            <CardTitle className="text-xs">{t.name}</CardTitle>
            <CardDescription className="text-[10px] line-clamp-1">{t.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground line-clamp-3">
              {t.content.replace(/<[^>]*>/g, '').substring(0, 100)}
            </p>
          </CardContent>
          <CardFooter>
            <Button size="xs" variant="outline" onClick={() => createNoteFromTemplate(t.id)}>
              <Plus data-icon="inline-start" />
              Use Template
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}