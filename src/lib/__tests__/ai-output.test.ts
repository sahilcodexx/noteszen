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

  it('renders valid markdown tables as tables', () => {
    const html = markdownToNoteHtml(`
| Tool | Purpose |
| --- | --- |
| tsc | Type checking |
| esbuild | Fast transpilation |
`)

    expect(html).toContain('<table>')
    expect(html).toContain('<th>Tool</th>')
    expect(html).toContain('<td>Fast transpilation</td>')
  })
})
