export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function streamChatCompletion({
  apiKey,
  model,
  messages,
  onDelta,
  signal,
}: {
  apiKey: string
  model: string
  messages: ChatMessage[]
  onDelta: (text: string) => void
  signal?: AbortSignal
}): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-OpenRouter-Title': 'NotesZen',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    }),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    let message = `OpenRouter error (${res.status})`
    try {
      const parsed = JSON.parse(errText) as { error?: { message?: string } }
      if (parsed.error?.message) message = parsed.error.message
    } catch {
      if (errText) message = errText.slice(0, 200)
    }
    throw new Error(message)
  }

  if (!res.body) throw new Error('No response stream from OpenRouter')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (!data || data === '[DONE]') continue

      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const chunk = parsed.choices?.[0]?.delta?.content
        if (chunk) {
          full += chunk
          onDelta(full)
        }
      } catch {
        // ignore malformed SSE chunks
      }
    }
  }

  return full
}

export function buildNoteContext(title: string, content: string): string {
  const plain = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const excerpt = plain.slice(0, 2000)
  return `Title: ${title || 'Untitled'}\n\n${excerpt || '(empty note)'}`
}