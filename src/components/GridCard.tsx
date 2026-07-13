import { memo, type ReactNode } from 'react'
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

const GridCard = memo(function GridCard({
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
  const standardCardClass =
    layout === 'grid' && !showCoverImage
      ? 'flex h-[13rem] w-full flex-col overflow-hidden'
      : 'flex w-full flex-col'

  if (showCoverImage) {
    return (
      <Card size="sm" className={cn(standardCardClass, 'pt-0')}>
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
    <Card size="sm" className={standardCardClass}>
      <CardHeader className="shrink-0">
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
      <CardContent className="min-h-0 flex-1 overflow-hidden">
        <p
          className={cn(
            'text-muted-foreground',
            layout === 'grid' ? 'line-clamp-3' : 'truncate'
          )}
        >
          {preview}
        </p>
      </CardContent>
      <CardFooter className="shrink-0">
        {footer ?? (
          <Button size="sm" className="w-full" onClick={onAction!}>
            {actionIcon}
            {actionLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
})

export default GridCard