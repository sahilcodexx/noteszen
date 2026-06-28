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
import { isCoverImage } from '@/lib/note-cover'
import CardCoverMedia from './CardCoverMedia'

interface GridCardProps {
  title: string
  description: string
  preview: string
  cover?: string | null
  badge?: ReactNode
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
  cover,
  badge,
  onAction,
  actionLabel,
  actionIcon,
  menu,
  footer,
  layout = 'grid',
}: GridCardProps) {
  const showCoverImage = layout === 'grid' && !!cover && isCoverImage(cover)

  if (showCoverImage) {
    return (
      <Card
        size="sm"
        className="relative flex h-full w-full flex-col overflow-hidden rounded-xl pt-0 [&_[data-slot=card-footer]]:rounded-none [&_[data-slot=card-header]]:rounded-none"
      >
        <CardCoverMedia cover={cover} />
        <CardHeader>
          {menu || badge ? (
            <CardAction>
              <div className="flex items-center gap-1">
                {badge}
                {menu}
              </div>
            </CardAction>
          ) : null}
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          <CardDescription className="line-clamp-2">{preview || description}</CardDescription>
        </CardHeader>
        <CardFooter className="mt-auto">
          {footer ?? (
            <Button size="sm" className="w-full" onClick={onAction!}>
              {actionIcon}
              {actionLabel}
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card
      size="sm"
      className="flex h-full w-full flex-col overflow-hidden rounded-xl [&_[data-slot=card-footer]]:rounded-none [&_[data-slot=card-header]]:rounded-none"
    >
      <CardHeader>
        <CardTitle className="truncate">{title}</CardTitle>
        <CardDescription className="truncate">{description}</CardDescription>
        {menu || badge ? (
          <CardAction>
            <div className="flex items-center gap-1">
              {badge}
              {menu}
            </div>
          </CardAction>
        ) : null}
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
          <Button size="sm" className="w-full" onClick={onAction!}>
            {actionIcon}
            {actionLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}