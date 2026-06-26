import { markdownToHtml } from './markdown-preview'

export interface PreparedAiNote {
  title: string
  bodyMarkdown: string
  contentHtml: string
  tags: string[]
}

const AI_DRAFT_TAG = 'ai-draft'

const AI_PREAMBLE =
  /^((?:sure|certainly|of course|here(?:'s| is)|absolutely)[,!]?\s*(?:here(?:'s| is)[^\n]*)?\n*)/i

const THINK_BLOCK = /<think>[\s\S]*?<\/think>/gi

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatInline(text: string): string {
  let html = escapeHtml(text)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="wikilink wikilink-exists">[[$1]]</span>')
  return html
}

function isTableSeparator(line: string): boolean {
  return /^\|?[\s\-:|]+\|?$/.test(line.trim())
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function tableBlockToHtml(lines: string[]): string {
  const rows = lines.filter((line) => line.trim() && !isTableSeparator(line))
  if (rows.length === 0) return ''

  const parsed = rows.map(parseTableRow)
  const headers = parsed[0]
  const body = parsed.slice(1)

  if (headers.length >= 2 && body.length > 0) {
    const items = body
      .map((row) => {
        const pairs = headers
          .map((header, i) => {
            const value = row[i]?.trim()
            if (!value) return ''
            return `<strong>${formatInline(header)}:</strong> ${formatInline(value)}`
          })
          .filter(Boolean)
          .join(' — ')
        return pairs ? `<li><p>${pairs}</p></li>` : ''
      })
      .filter(Boolean)
    if (items.length) return `<ul>${items.join('')}</ul>`
  }

  const fallback = rows
    .map((row) => `<p>${formatInline(row.replace(/\|/g, ' · '))}</p>`)
    .join('')
  return fallback
}

function markdownBlocksToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    const codeFence = trimmed.match(/^```(\w+)?\s*$/)
    if (codeFence) {
      const lang = codeFence[1] || ''
      i++
      const codeLines: string[] = []
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      const code = escapeHtml(codeLines.join('\n'))
      const langClass = lang ? ` class="language-${lang}"` : ''
      blocks.push(`<pre><code${langClass}>${code}</code></pre>`)
      i++
      continue
    }

    if (trimmed.startsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      blocks.push(tableBlockToHtml(tableLines))
      continue
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      blocks.push(`<h${level}>${formatInline(heading[2])}</h${level}>`)
      i++
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push('<hr>')
      i++
      continue
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2))
        i++
      }
      blocks.push(`<blockquote><p>${formatInline(quoteLines.join(' '))}</p></blockquote>`)
      continue
    }

    const taskMatch = trimmed.match(/^- \[( |x|X)\] (.+)$/)
    if (taskMatch) {
      const taskItems: string[] = []
      while (i < lines.length) {
        const taskLine = lines[i].trim()
        const match = taskLine.match(/^- \[( |x|X)\] (.+)$/)
        if (!match) break
        const checked = match[1].toLowerCase() === 'x' ? 'true' : 'false'
        taskItems.push(
          `<li data-type="taskItem" data-checked="${checked}"><p>${formatInline(match[2])}</p></li>`
        )
        i++
      }
      blocks.push(`<ul data-type="taskList">${taskItems.join('')}</ul>`)
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const listItems: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        listItems.push(`<li><p>${formatInline(lines[i].trim().replace(/^[-*]\s+/, ''))}</p></li>`)
        i++
      }
      blocks.push(`<ul>${listItems.join('')}</ul>`)
      continue
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/)
    if (orderedMatch) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listItems.push(
          `<li><p>${formatInline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</p></li>`
        )
        i++
      }
      blocks.push(`<ol>${listItems.join('')}</ol>`)
      continue
    }

    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('> ') &&
      !lines[i].trim().startsWith('|') &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^- \[( |x|X)\]/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i].trim())
      i++
    }
    blocks.push(`<p>${formatInline(paragraphLines.join(' '))}</p>`)
  }

  return blocks.join('')
}

export function cleanAiMarkdown(raw: string): string {
  let text = raw.trim()
  text = text.replace(THINK_BLOCK, '').trim()
  text = text.replace(AI_PREAMBLE, '').trim()
  text = text.replace(/\r\n/g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

export function extractAiNoteTitle(md: string): { title: string; body: string } {
  const lines = md.split('\n')
  const headingIndex = lines.findIndex((line) => /^#\s+/.test(line.trim()))

  if (headingIndex >= 0) {
    const title = lines[headingIndex].replace(/^#+\s*/, '').trim()
    const body = [...lines.slice(0, headingIndex), ...lines.slice(headingIndex + 1)]
      .join('\n')
      .replace(/^\n+/, '')
      .trim()
    return { title: title.slice(0, 80) || 'AI Draft', body }
  }

  const firstLine = lines[0]?.trim()
  if (firstLine && firstLine.length <= 80 && !firstLine.includes('```')) {
    return {
      title: firstLine.replace(/^#+\s*/, '').slice(0, 80),
      body: lines.slice(1).join('\n').trim(),
    }
  }

  return { title: 'AI Draft', body: md }
}

function aiDraftCalloutHtml(): string {
  return `<div data-type="callout" class="callout callout-tip"><p><strong>✨ AI-generated draft</strong> — Review and edit before sharing.</p></div>`
}

export function markdownToNoteHtml(md: string): string {
  const cleaned = cleanAiMarkdown(md)
  if (!cleaned) return aiDraftCalloutHtml()
  return `${aiDraftCalloutHtml()}${markdownBlocksToHtml(cleaned)}`
}

export function prepareAiNoteFromOutput(raw: string): PreparedAiNote {
  const cleaned = cleanAiMarkdown(raw)
  const { title, body } = extractAiNoteTitle(cleaned)
  const bodyMarkdown = body || cleaned
  return {
    title,
    bodyMarkdown,
    contentHtml: markdownToNoteHtml(bodyMarkdown),
    tags: [AI_DRAFT_TAG],
  }
}

/** Lightweight markdown render for chat preview (no callout wrapper). */
export function markdownToChatHtml(md: string): string {
  const cleaned = cleanAiMarkdown(md)
  if (!cleaned) return ''
  return markdownBlocksToHtml(cleaned) || markdownToHtml(cleaned)
}

export function appendAiContentToNote(existingHtml: string, aiHtml: string): string {
  const base = existingHtml.trim()
  if (!base) return aiHtml
  return `${base}<hr>${aiHtml}`
}

export { AI_DRAFT_TAG }