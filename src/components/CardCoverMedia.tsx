import { cn } from '@/lib/utils'
import { isCoverGradient, isCoverImage } from '@/lib/note-cover'
import CoverImage from './CoverImage'

interface CardCoverMediaProps {
  cover: string
  /** Card grid style — grayscale + dim. Editor uses full color. */
  variant?: 'card' | 'editor'
}

export default function CardCoverMedia({ cover, variant = 'card' }: CardCoverMediaProps) {
  const imageClass =
    variant === 'card'
      ? 'relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40'
      : 'relative z-20 aspect-video w-full object-cover'

  if (isCoverImage(cover)) {
    return (
      <>
        <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
        <CoverImage cover={cover} className={imageClass} />
      </>
    )
  }

  return (
    <>
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <div
        className={cn(
          'relative z-20 aspect-video w-full',
          isCoverGradient(cover) ? cover : 'bg-muted'
        )}
      />
    </>
  )
}