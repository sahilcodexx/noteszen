export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const STREAM_IDLE_MS = 45_000
const STREAM_MAX_MS = 120_000

function isUserAbort(signal: AbortSignal | undefined, err: unknown): boolean {
  if (signal?.aborted) return true
  return err instanceof DOMException && err.name === 'AbortError'
}

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
  const timeoutController = new AbortController()
  const startedAt = Date.now()
  let idleTimer: ReturnType<typeof setTimeout> | null = null
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => timeoutController.abort(), STREAM_IDLE_MS)
  }

  const abortAll = () => timeoutController.abort()

  signal?.addEventListener('abort', abortAll)

  const combinedSignal = timeoutController.signal

  const throwIfAborted = async () => {
    if (!signal?.aborted) return
    await reader?.cancel().catch(() => {})
    throw new DOMException('The operation was aborted.', 'AbortError')
  }

  let full = ''

  try {
    await throwIfAborted()

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
      signal: combinedSignal,
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

    reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    resetIdleTimer()

    while (true) {
      await throwIfAborted()

      if (Date.now() - startedAt > STREAM_MAX_MS) {
        timeoutController.abort()
        throw new Error('AI response timed out. Try again or use Stop.')
      }

      const { done, value } = await reader.read()
      if (done) break

      resetIdleTimer()

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

    if (!full.trim()) {
      throw new Error('AI returned an empty response. Try a different model in Settings → AI.')
    }

    return full
  } catch (err) {
    if (isUserAbort(signal, err)) {
      if (full.trim()) return full
      throw new DOMException('The operation was aborted.', 'AbortError')
    }
    if (combinedSignal.aborted) {
      throw new Error('AI response timed out. Press Stop and try again.')
    }
    throw err
  } finally {
    if (idleTimer) clearTimeout(idleTimer)
    signal?.removeEventListener('abort', abortAll)
    await reader?.cancel().catch(() => {})
  }
}

export function buildNoteContext(title: string, content: string): string {
  const plain = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const excerpt = plain.slice(0, 2000)
  return `Title: ${title || 'Untitled'}\n\n${excerpt || '(empty note)'}`
}