import { useEffect, useState } from 'react'
import { getCoverImageSrc, unwrapCoverPath } from '@/lib/note-cover'
import { getAPI } from '@/tauri-bridge'

interface CoverImageProps {
  cover: string
  className?: string
}

export default function CoverImage({ cover, className }: CoverImageProps) {
  const [src, setSrc] = useState(() => getCoverImageSrc(cover))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!failed) return
    const raw = unwrapCoverPath(cover)
    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) return

    const api = getAPI()
    if (!api?.readImageDataUrl) return

    let cancelled = false
    api.readImageDataUrl(raw).then((dataUrl) => {
      if (!cancelled) setSrc(dataUrl)
    }).catch(() => {})

    return () => {
      cancelled = true
    }
  }, [cover, failed])

  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  )
}