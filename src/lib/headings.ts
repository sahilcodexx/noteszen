export interface DocumentHeading {
  level: number
  text: string
  id: string
  index: number
}

export function extractHeadings(content: string): DocumentHeading[] {
  if (!content) return []

  const headings: DocumentHeading[] = []
  const htmlRegex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi
  let match: RegExpExecArray | null
  let index = 0

  while ((match = htmlRegex.exec(content)) !== null) {
    const level = parseInt(match[1], 10)
    const text = match[2].replace(/<[^>]*>/g, '').trim()
    if (text) {
      headings.push({ level, text, id: `heading-${index}`, index })
      index += 1
    }
  }

  if (headings.length === 0) {
    const markdownRegex = /^(#{1,3})\s+(.+)$/gm
    while ((match = markdownRegex.exec(content)) !== null) {
      const text = match[2].replace(/[*_`#]/g, '').trim()
      if (text) {
        headings.push({
          level: match[1].length,
          text,
          id: `heading-${index}`,
          index,
        })
        index += 1
      }
    }
  }

  return headings
}