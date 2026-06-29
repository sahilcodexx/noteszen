import { describe, expect, it } from 'vitest'
import { cleanAiMarkdown, markdownToNoteHtml } from '../ai-output'

describe('AI output cleanup', () => {
  it('cleans broken feature table fragments into readable list items', () => {
    const cleaned = cleanAiMarkdown(`
Key Differences: Official TS vs. Go-based Transpilers

- Feature: :--- enough — Official TypeScript (\`tsc\`): :--- — Go/Rust-based (\`esbuild/SWC\`): :---
- Feature: Primary Goal — Official TypeScript (\`tsc\`): Full Type Checking — Go/Rust-based (\`esbuild/SWC\`): Fast Transpilation
`)

    expect(cleaned).toContain('## Key Differences')
    expect(cleaned).not.toContain('Feature:')
    expect(cleaned).not.toContain(':---')
  })

  it('renders valid markdown tables as editor-safe comparison lists', () => {
    const html = markdownToNoteHtml(`
| Tool | Purpose |
| --- | --- |
| tsc | Type checking |
| esbuild | Fast transpilation |
`)

    expect(html).toContain('ai-comparison-list')
    expect(html).toContain('<strong>tsc</strong>')
    expect(html).toContain('<strong>Purpose:</strong> Fast transpilation')
    expect(html).not.toContain('<table>')
  })
})
