import { describe, it, expect } from 'vitest'
import { filterNotesWithFuse } from '../search'
import type { Note } from '../../types'

const sampleNotes: Note[] = [
  {
    id: '1',
    title: 'Rust Programming',
    content: '<p>Systems programming with Rust</p>',
    folder: 'personal',
    tags: ['code'],
    backlinks: [],
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: '2',
    title: 'Grocery List',
    content: '<p>Milk and eggs</p>',
    folder: 'personal',
    tags: ['life'],
    backlinks: [],
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-01-02',
    updatedAt: '2026-01-02',
  },
]

describe('filterNotesWithFuse', () => {
  it('returns all notes when query is empty', () => {
    expect(filterNotesWithFuse(sampleNotes, '')).toHaveLength(2)
  })

  it('filters by title fuzzy match', () => {
    const result = filterNotesWithFuse(sampleNotes, 'rust')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by content', () => {
    const result = filterNotesWithFuse(sampleNotes, 'milk')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })
})