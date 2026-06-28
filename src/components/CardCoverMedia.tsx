import { cn } from '@/lib/utils'
import { isCoverGradient, isCoverImage } from '@/lib/note-cover'
import CoverImage from './CoverImage'

interface CardCoverMediaProps {
  cover: string
  /** Card grid — full color at 80% opacity. Editor uses full color. */
  variant?: 'card' | 'editor'
}

export default function CardCoverMedia({ cover, variant = 'card' }: CardCoverMediaProps) {
  const imageClass =
    variant === 'card'
      ? 'relative z-20 aspect-video w-full rounded-t-xl object-cover opacity-80'
      : 'relative z-20 aspect-video w-full object-cover'

  if (isCoverImage(cover)) {
    return <CoverImage cover={cover} className={imageClass} />
  }

  return (
    <div
      className={cn(
        'relative z-20 aspect-video w-full',
        variant === 'card' && 'rounded-t-xl opacity-80',
        isCoverGradient(cover) ? cover : 'bg-muted'
      )}
    />
  )
}