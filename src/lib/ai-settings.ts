const KEY_STORAGE = 'noteszen-openrouter-key'
const MODEL_STORAGE = 'noteszen-openrouter-model'

export const FREE_MODELS = [
  { id: 'openrouter/free', label: 'OpenRouter Free (auto)' },
  { id: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B' },
  { id: 'qwen/qwen-2-7b-instruct:free', label: 'Qwen 2 7B' },
] as const

export const DEFAULT_FREE_MODEL = FREE_MODELS[0].id

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
  return localStorage.getItem(MODEL_STORAGE) || DEFAULT_FREE_MODEL
}

export function setOpenRouterModel(model: string) {
  localStorage.setItem(MODEL_STORAGE, model)
}

export function hasOpenRouterApiKey(): boolean {
  return getOpenRouterApiKey().length > 0
}