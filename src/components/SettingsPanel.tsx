import { useState } from 'react'
import { useNotesStore } from '../store/useNotesStore'
import { getAPI } from '../tauri-bridge'
import { Settings, Info, Keyboard, Database, Palette, Sparkles } from 'lucide-react'
import {
  getOpenRouterApiKey,
  setOpenRouterApiKey,
  getOpenRouterModel,
  setOpenRouterModel,
  FREE_MODELS,
  hasOpenRouterApiKey,
} from '../lib/ai-settings'
import { notify } from '../lib/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from '@/components/ui/field'

const SHORTCUTS = [
  { action: 'New Note', keys: 'Ctrl+N' },
  { action: 'Daily Note', keys: 'Ctrl+D' },
  { action: 'Command Palette', keys: 'Ctrl+K' },
  { action: 'Search in List', keys: 'Ctrl+F' },
  { action: 'Global Search', keys: 'Ctrl+Shift+F' },
  { action: 'Pin Note', keys: 'Ctrl+P' },
  { action: 'Toggle Sidebar', keys: 'Ctrl+B' },
  { action: 'Toggle AI Panel', keys: 'Ctrl+Shift+B' },
  { action: 'Navigate Notes', keys: 'Alt+↑/↓' },
  { action: 'Quick Capture', keys: 'Ctrl+Shift+Space' },
  { action: 'Star Note (palette)', keys: 'Ctrl+Shift+S' },
  { action: 'Archive Note (palette)', keys: 'Ctrl+Shift+A' },
]

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const {
    notes,
    vaults,
    activeVaultId,
    appSettings,
    setAppSettings,
    setActiveVault,
    createVault,
    importNotes,
    importSyncData,
    exportSyncData,
    editorFont,
    setEditorFont,
    editorFontSize,
    setEditorFontSize,
    isDarkMode,
    toggleDarkMode,
  } = useNotesStore()

  const [newVaultName, setNewVaultName] = useState('')
  const [openRouterKey, setOpenRouterKeyState] = useState(getOpenRouterApiKey)
  const [openRouterModel, setOpenRouterModelState] = useState(getOpenRouterModel)
  const api = getAPI()

  const handleExport = () => {
    const dataStr = JSON.stringify(notes, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `noteszen-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    notify.success('Backup exported')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) {
          await importNotes(parsed, true)
        } else if (parsed.notes) {
          await importSyncData(text, true)
        }
        notify.success('Import complete')
      } catch (err) {
        notify.error('Import failed: ' + String(err))
      }
    }
    input.click()
  }

  const handleSyncExport = async () => {
    const data = await exportSyncData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `noteszen-sync-${activeVaultId}.json`
    link.click()
    URL.revokeObjectURL(url)
    notify.success('Vault sync data exported')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="no-drag flex max-h-[85vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Settings />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-6 mt-4 w-[calc(100%-3rem)]">
            <TabsTrigger value="general">
              <Palette data-icon="inline-start" />
              General
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database data-icon="inline-start" />
              Data
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles data-icon="inline-start" />
              AI
            </TabsTrigger>
            <TabsTrigger value="shortcuts">
              <Keyboard data-icon="inline-start" />
              Keys
            </TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="general" className="mt-0">
              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Theme</FieldTitle>
                    <FieldDescription>Switch between light and dark mode</FieldDescription>
                  </FieldContent>
                  <Button variant="outline" size="sm" onClick={toggleDarkMode}>
                    {isDarkMode ? 'Light' : 'Dark'}
                  </Button>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Editor font</FieldTitle>
                    <FieldDescription>Typeface used in the note editor</FieldDescription>
                  </FieldContent>
                  <Select value={editorFont} onValueChange={(v) => setEditorFont(v as 'sans' | 'serif' | 'mono')}>
                    <SelectTrigger size="sm" className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Inter Sans</SelectItem>
                      <SelectItem value="serif">Georgia Serif</SelectItem>
                      <SelectItem value="mono">System Mono</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Font size</FieldTitle>
                    <FieldDescription>14px to 128px</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    min={14}
                    max={128}
                    value={editorFontSize}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10)
                      if (!isNaN(parsed)) setEditorFontSize(Math.max(14, Math.min(128, parsed)))
                    }}
                    className="w-20 text-center"
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Spell check</FieldTitle>
                    <FieldDescription>Browser spellcheck language</FieldDescription>
                  </FieldContent>
                  <Select
                    value={appSettings.spellCheckLanguage}
                    onValueChange={(v) => setAppSettings({ spellCheckLanguage: v })}
                  >
                    <SelectTrigger size="sm" className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Trash auto-purge</FieldTitle>
                    <FieldDescription>Days before permanent delete (0 = off)</FieldDescription>
                  </FieldContent>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={appSettings.trashAutoPurgeDays}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10)
                      if (!isNaN(parsed)) setAppSettings({ trashAutoPurgeDays: parsed })
                    }}
                    className="w-20 text-center"
                  />
                </Field>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="data" className="mt-0">
              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Storage</FieldTitle>
                    <FieldDescription>Where your notes are saved</FieldDescription>
                  </FieldContent>
                  <Badge variant={api ? 'default' : 'outline'}>
                    {api ? 'SQLite' : 'Local'}
                  </Badge>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Export backup</FieldTitle>
                    <FieldDescription>Download a JSON copy of all notes</FieldDescription>
                  </FieldContent>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    Export
                  </Button>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Import backup</FieldTitle>
                    <FieldDescription>Restore or merge notes from JSON</FieldDescription>
                  </FieldContent>
                  <Button variant="outline" size="sm" onClick={handleImport}>
                    Import
                  </Button>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Sync export</FieldTitle>
                    <FieldDescription>Export vault for Syncthing or Dropbox</FieldDescription>
                  </FieldContent>
                  <Button variant="outline" size="sm" onClick={handleSyncExport}>
                    Export vault
                  </Button>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Active vault</FieldTitle>
                    <FieldDescription>Switch between workspaces</FieldDescription>
                  </FieldContent>
                  <Select value={activeVaultId} onValueChange={(v) => setActiveVault(v)}>
                    <SelectTrigger size="sm" className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vaults.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldContent>
                    <FieldTitle>New vault</FieldTitle>
                    <FieldDescription>Create an additional workspace</FieldDescription>
                  </FieldContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Vault name"
                      value={newVaultName}
                      onChange={(e) => setNewVaultName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (newVaultName.trim()) {
                          createVault(newVaultName.trim())
                          notify.success(`Vault "${newVaultName.trim()}" created`)
                          setNewVaultName('')
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="ai" className="mt-0">
              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>OpenRouter API key</FieldTitle>
                    <FieldDescription>Get a free key at openrouter.ai</FieldDescription>
                  </FieldContent>
                  <Input
                    type="password"
                    value={openRouterKey}
                    onChange={(e) => {
                      setOpenRouterKeyState(e.target.value)
                      setOpenRouterApiKey(e.target.value)
                    }}
                    placeholder="sk-or-v1-..."
                    className="w-[180px]"
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>AI model</FieldTitle>
                    <FieldDescription>Free models via OpenRouter</FieldDescription>
                  </FieldContent>
                  <Select
                    value={openRouterModel}
                    onValueChange={(v) => {
                      setOpenRouterModelState(v)
                      setOpenRouterModel(v)
                    }}
                  >
                    <SelectTrigger size="sm" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREE_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/50 p-4">
                  <Sparkles className="mt-0.5 shrink-0 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {hasOpenRouterApiKey()
                      ? 'AI workspace is connected. Use the right panel to chat about your notes.'
                      : 'Add your OpenRouter API key to enable live AI responses in the workspace panel.'}
                  </p>
                </div>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="shortcuts" className="mt-0">
              <div className="flex flex-col gap-1 rounded-2xl border border-border p-3">
                {SHORTCUTS.map((s) => (
                  <div key={s.action} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">{s.action}</span>
                    <kbd className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">{s.keys}</kbd>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-muted/50 p-4">
                <Info className="mt-0.5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Quick capture with <kbd className="rounded bg-muted px-1.5 font-mono text-xs">Ctrl+Shift+Space</kbd>.
                  Mobile view: type <kbd className="rounded bg-muted px-1.5 font-mono text-xs">#mobile</kbd> in search.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}