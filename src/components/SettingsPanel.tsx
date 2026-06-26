import { useState, type ReactNode } from 'react'
import { useNotesStore } from '../store/useNotesStore'
import { getAPI } from '../tauri-bridge'
import { Settings, Info, Keyboard, Database, LayoutTemplate, Palette, Sparkles } from 'lucide-react'
import {
  getOpenRouterApiKey,
  setOpenRouterApiKey,
  getOpenRouterModel,
  setOpenRouterModel,
  FREE_MODELS,
  hasOpenRouterApiKey,
} from '../lib/ai-settings'
import { notify } from '../lib/toast'
import TemplateGallery from './TemplateGallery'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
    colorTheme,
    setColorTheme,
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
      <DialogContent className="max-w-[520px] border shadow-2xl flex flex-col no-drag max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <Settings className="size-5 text-primary" />
            NotesZen Preferences
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="text-xs">
              <Palette data-icon="inline-start" />
              General
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs">
              <Database data-icon="inline-start" />
              Data
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs">
              <LayoutTemplate data-icon="inline-start" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Sparkles data-icon="inline-start" />
              AI
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="text-xs">
              <Keyboard data-icon="inline-start" />
              Keys
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto flex-1 py-3 select-none">
            <TabsContent value="general" className="flex flex-col gap-4 mt-0">
              <SettingRow label="Interface Theme" hint="Toggle light or dark modes">
                <Button variant="outline" size="sm" onClick={toggleDarkMode}>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Button>
              </SettingRow>
              <SettingRow label="Color Theme" hint="Choose accent color scheme">
                <Select value={colorTheme} onValueChange={setColorTheme}>
                  <SelectTrigger size="sm" className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['default', 'ocean', 'sunset', 'forest', 'lavender', 'rose'].map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Editor Font" hint="Select note writing typeface">
                <Select value={editorFont} onValueChange={(v) => setEditorFont(v as 'sans' | 'serif' | 'mono')}>
                  <SelectTrigger size="sm" className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Geist Sans</SelectItem>
                    <SelectItem value="serif">Georgia Serif</SelectItem>
                    <SelectItem value="mono">Geist Mono</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Font Size" hint="14px to 128px">
                <input
                  type="number"
                  min={14}
                  max={128}
                  value={editorFontSize}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10)
                    if (!isNaN(parsed)) setEditorFontSize(Math.max(14, Math.min(128, parsed)))
                  }}
                  className="text-xs border border-border/80 rounded px-2.5 py-1 bg-card w-20 text-center"
                />
              </SettingRow>
              <SettingRow label="Spell Check" hint="Browser spellcheck language">
                <Select value={appSettings.spellCheckLanguage} onValueChange={(v) => setAppSettings({ spellCheckLanguage: v })}>
                  <SelectTrigger size="sm" className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Trash Auto-Purge" hint="Days before permanent delete (0 = off)">
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={appSettings.trashAutoPurgeDays}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10)
                    if (!isNaN(parsed)) setAppSettings({ trashAutoPurgeDays: parsed })
                  }}
                  className="text-xs border border-border/80 rounded px-2.5 py-1 bg-card w-20 text-center"
                />
              </SettingRow>
            </TabsContent>

            <TabsContent value="data" className="flex flex-col gap-4 mt-0">
              <SettingRow label="Storage" hint={api ? 'SQLite + FTS5' : 'Web localStorage'}>
                <Badge variant={api ? 'default' : 'outline'} className="text-[9px] font-bold">
                  {api ? 'TAURI + SQLITE' : 'WEB FALLBACK'}
                </Badge>
              </SettingRow>
              <SettingRow label="Export Backup" hint="Download JSON copy of all notes">
                <Button variant="outline" size="sm" onClick={handleExport}>Export JSON</Button>
              </SettingRow>
              <SettingRow label="Import Backup" hint="Restore or merge notes from JSON">
                <Button variant="outline" size="sm" onClick={handleImport}>Import JSON</Button>
              </SettingRow>
              <SettingRow label="Sync Export" hint="Export vault for Syncthing/Dropbox">
                <Button variant="outline" size="sm" onClick={handleSyncExport}>Export Vault</Button>
              </SettingRow>
              <SettingRow label="Active Vault" hint="Switch workspaces">
                <Select value={activeVaultId} onValueChange={(v) => setActiveVault(v)}>
                  <SelectTrigger size="sm" className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {vaults.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New vault name"
                  value={newVaultName}
                  onChange={(e) => setNewVaultName(e.target.value)}
                  className="text-xs border border-border rounded px-2 py-1 bg-card flex-1"
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
                  Add Vault
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-0">
              <TemplateGallery />
            </TabsContent>

            <TabsContent value="ai" className="flex flex-col gap-4 mt-0">
              <SettingRow label="OpenRouter API Key" hint="Get a free key at openrouter.ai">
                <input
                  type="password"
                  value={openRouterKey}
                  onChange={(e) => {
                    setOpenRouterKeyState(e.target.value)
                    setOpenRouterApiKey(e.target.value)
                  }}
                  placeholder="sk-or-v1-..."
                  className="text-xs border border-border/80 rounded px-2.5 py-1 bg-card w-[180px]"
                />
              </SettingRow>
              <SettingRow label="AI Model" hint="Free models via OpenRouter">
                <Select
                  value={openRouterModel}
                  onValueChange={(v) => {
                    setOpenRouterModelState(v)
                    setOpenRouterModel(v)
                  }}
                >
                  <SelectTrigger size="sm" className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREE_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted border border-border">
                <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-normal">
                  {hasOpenRouterApiKey()
                    ? 'AI Workspace is connected. Use the right panel to chat about your notes.'
                    : 'Add your OpenRouter API key to enable live AI responses in the workspace panel.'}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="shortcuts" className="mt-0">
              <div className="border rounded-lg p-3 flex flex-col gap-1.5">
                {SHORTCUTS.map((s) => (
                  <div key={s.action} className="flex justify-between text-[10px] py-0.5">
                    <span className="text-muted-foreground">{s.action}</span>
                    <kbd className="font-mono bg-muted px-1.5 rounded text-[9px]">{s.keys}</kbd>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted border border-border mt-3">
                <Info className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Quick Capture: <kbd className="font-mono bg-muted-foreground/20 px-1 rounded">Ctrl+Shift+Space</kbd>.
                  Mobile view: <kbd className="font-mono bg-muted-foreground/20 px-1 rounded">#mobile</kbd>.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <Button onClick={() => onOpenChange(false)} className="mt-2 w-full">Done</Button>
      </DialogContent>
    </Dialog>
  )
}

function SettingRow({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b pb-3 border-border">
      <div>
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  )
}