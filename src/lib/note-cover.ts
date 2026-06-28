import { convertFileSrc } from '@tauri-apps/api/core'

const IMAGE_PREFIX = 'img:'

function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !== undefined
  )
}

export function isCoverImage(cover: string | null | undefined): boolean {
  if (!cover) return false
  if (cover.startsWith(IMAGE_PREFIX)) return true
  return (
    cover.startsWith('http://') ||
    cover.startsWith('https://') ||
    cover.startsWith('data:') ||
    cover.startsWith('asset://')
  )
}

export function isCoverGradient(cover: string | null | undefined): boolean {
  if (!cover) return false
  return !isCoverImage(cover)
}

export function unwrapCoverPath(cover: string): string {
  let raw = cover.startsWith(IMAGE_PREFIX) ? cover.slice(IMAGE_PREFIX.length) : cover
  if (raw.startsWith('asset://localhost/')) {
    raw = raw.slice('asset://localhost/'.length)
  }
  return raw
}

export function getCoverImageSrc(cover: string): string {
  const raw = unwrapCoverPath(cover)

  if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw
  }

  if (isTauri()) {
    return convertFileSrc(raw)
  }

  return raw
}

export function encodeCoverImageSrc(src: string): string {
  if (src.startsWith(IMAGE_PREFIX)) return src
  return `${IMAGE_PREFIX}${src}`
}

export async function saveCoverImage(noteId: string, file: File): Promise<string> {
  const { resizeImage } = await import('./image-utils')
  const { getAPI } = await import('../tauri-bridge')
  const dataUrl = await resizeImage(file, 1600)

  const api = getAPI()
  if (api) {
    const path = await api.saveImage(noteId, dataUrl)
    return encodeCoverImageSrc(path)
  }

  return encodeCoverImageSrc(dataUrl)
}