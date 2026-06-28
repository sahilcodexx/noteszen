import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface GridCardProps {
  title: string
  description: string
  preview: string
  onAction?: () => void
  actionLabel?: string
  actionIcon?: ReactNode
  menu?: ReactNode
  footer?: ReactNode
  layout?: 'grid' | 'list'
}

export default function GridCard({
  title,
  description,
  preview,
  onAction,
  actionLabel,
  actionIcon,
  menu,
  footer,
  layout = 'grid',
}: GridCardProps) {
  return (
    <Card size="sm" className="flex h-full w-full flex-col">
      <CardHeader>
        <CardTitle className="truncate">{title}</CardTitle>
        <CardDescription className="truncate">{description}</CardDescription>
        {menu ? <CardAction>{menu}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex-1">
        <p
          className={cn(
            'text-muted-foreground',
            layout === 'grid' ? 'line-clamp-3 min-h-[4.5rem]' : 'truncate'
          )}
        >
          {preview}
        </p>
      </CardContent>
      <CardFooter>
        {footer ?? (
          <Button variant="outline" size="sm" className="w-full" onClick={onAction!}>
            {actionIcon}
            {actionLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}