const KEY_STORAGE = 'noteszen-openrouter-key'
const MODEL_STORAGE = 'noteszen-openrouter-model'

export const FREE_MODELS = [
  { id: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B (recommended)' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', label: 'Qwen3 Next 80B (smarter)' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (fastest)' },
  { id: 'nvidia/nemotron-nano-9b-v2:free', label: 'Nemotron Nano 9B' },
  { id: 'openrouter/free', label: 'OpenRouter Free (auto)' },
] as const

/** MoE model — good quality with reasonable speed on OpenRouter free tier */
export const DEFAULT_FREE_MODEL = 'google/gemma-4-26b-a4b-it:free'

const DEPRECATED_MODELS = new Set([
  'openrouter/free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2-7b-instruct:free',
])

export function getOpenRouterApiKey(): string {
  const stored = localStorage.getItem(KEY_STORAGE)?.trim()
  if (stored) return stored
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY
  return typeof envKey === 'string' ? envKey.trim() : ''
}

export function setOpenRouterApiKey(key: string) {
  const trimmed = key.trim()
  if (trimmed) {
    localStorage.setItem(KEY_STORAGE, trimmed)
  } else {
    localStorage.removeItem(KEY_STORAGE)
  }
}

export function getOpenRouterModel(): string {
  const stored = localStorage.getItem(MODEL_STORAGE)
  if (!stored || DEPRECATED_MODELS.has(stored)) return DEFAULT_FREE_MODEL
  const known = FREE_MODELS.some((m) => m.id === stored)
  return known ? stored : DEFAULT_FREE_MODEL
}

export function setOpenRouterModel(model: string) {
  localStorage.setItem(MODEL_STORAGE, model)
}

export function hasOpenRouterApiKey(): boolean {
  return getOpenRouterApiKey().length > 0
}