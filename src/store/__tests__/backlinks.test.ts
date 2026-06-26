import { describe, it, expect } from 'vitest'

function extractBacklinks(content: string, notes: { id: string; title: string }[]): string[] {
  const linkRegex = /\[\[(.*?)\]\]/g
  const matches = [...content.matchAll(linkRegex)]
  const targetIds: string[] = []
  for (const match of matches) {
    const title = match[1]?.trim().toLowerCase()
    if (title) {
      const targetNote = notes.find((n) => n.title.toLowerCase() === title)
      if (targetNote) targetIds.push(targetNote.id)
    }
  }
  return Array.from(new Set(targetIds))
}

describe('extractBacklinks', () => {
  const notes = [
    { id: 'a', title: 'Meeting Notes' },
    { id: 'b', title: 'Project Plan' },
  ]

  it('extracts matching note ids from wikilinks', () => {
    const content = 'See [[Meeting Notes]] and [[Project Plan]]'
    expect(extractBacklinks(content, notes)).toEqual(['a', 'b'])
  })

  it('ignores unknown titles', () => {
    const content = 'See [[Unknown Note]]'
    expect(extractBacklinks(content, notes)).toEqual([])
  })

  it('deduplicates repeated links', () => {
    const content = '[[Meeting Notes]] again [[meeting notes]]'
    expect(extractBacklinks(content, notes)).toEqual(['a'])
  })
})