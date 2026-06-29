import { convertNpmCommand } from '@/components/code-block-command'

export function commandToPackageManagerTabs(command: string) {
  const trimmed = command.trim()
  if (trimmed.startsWith('pnpm add')) {
    return {
      pnpm: trimmed,
      yarn: trimmed.replace('pnpm add', 'yarn add'),
      npm: trimmed.replace('pnpm add', 'npm install'),
      bun: trimmed.replace('pnpm add', 'bun add'),
    }
  }
  if (trimmed.startsWith('pnpm dlx')) {
    return {
      pnpm: trimmed,
      yarn: trimmed.replace('pnpm dlx', 'yarn dlx'),
      npm: trimmed.replace('pnpm dlx', 'npx'),
      bun: trimmed.replace('pnpm dlx', 'bunx --bun'),
    }
  }
  if (trimmed.startsWith('yarn add')) {
    return {
      pnpm: trimmed.replace('yarn add', 'pnpm add'),
      yarn: trimmed,
      npm: trimmed.replace('yarn add', 'npm install'),
      bun: trimmed.replace('yarn add', 'bun add'),
    }
  }
  if (trimmed.startsWith('bun add')) {
    return {
      pnpm: trimmed.replace('bun add', 'pnpm add'),
      yarn: trimmed.replace('bun add', 'yarn add'),
      npm: trimmed.replace('bun add', 'npm install'),
      bun: trimmed,
    }
  }
  return convertNpmCommand(trimmed)
}

export function isShellCommandBlock(language: string | undefined, code: string): boolean {
  const lang = language?.toLowerCase()
  const trimmed = code.trim()
  if (!trimmed || trimmed.includes('\n\n')) return false
  return (
    ['bash', 'sh', 'shell', 'zsh', 'terminal'].includes(lang || '') ||
    /^(npm|npx|pnpm|yarn|bun|bunx|cargo|git|curl|wget)\s+/.test(trimmed)
  )
}
