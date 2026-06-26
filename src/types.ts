export interface Note {
  id: string
  title: string
  content: string
  folder: string
  tags: string[]
  backlinks: string[]
  isPinned: boolean
  isFavorite: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
  icon?: string | null
  cover?: string | null
  status?: string | null
  editorMode?: 'wysiwyg' | 'markdown'
  trashedAt?: string | null
  vaultId?: string
}

export interface Folder {
  id: string
  name: string
  color: string
  sortOrder: number
  vaultId: string
}

export interface Template {
  id: string
  name: string
  title: string
  content: string
  tags: string[]
}

export interface NoteVersion {
  id: string
  noteId: string
  title: string
  content: string
  createdAt: string
}

export interface Vault {
  id: string
  name: string
  path: string
  isActive: boolean
}

export interface SearchResult {
  note: Note
  snippet: string
}

export interface AppSettings {
  trashAutoPurgeDays: number
  spellCheckLanguage: string
  syncFolderPath: string
}

export interface TauriAPI {
  getNotes: (vaultId?: string) => Promise<Note[]>
  saveNote: (note: Note, saveVersion?: boolean) => Promise<boolean>
  deleteNote: (noteId: string) => Promise<boolean>
  importNotes: (notes: Note[], merge: boolean) => Promise<number>
  searchNotes: (query: string, vaultId?: string) => Promise<SearchResult[]>
  getFolders: (vaultId: string) => Promise<Folder[]>
  saveFolder: (folder: Folder) => Promise<boolean>
  deleteFolder: (folderId: string) => Promise<boolean>
  getTemplates: () => Promise<Template[]>
  saveTemplate: (template: Template) => Promise<boolean>
  deleteTemplate: (templateId: string) => Promise<boolean>
  getNoteVersions: (noteId: string) => Promise<NoteVersion[]>
  restoreVersion: (versionId: string) => Promise<Note | null>
  getVaults: () => Promise<Vault[]>
  setActiveVault: (vaultId: string) => Promise<boolean>
  createVault: (vault: Vault) => Promise<boolean>
  getSetting: (key: string) => Promise<string | null>
  saveSetting: (key: string, value: string) => Promise<boolean>
  purgeOldTrash: (days: number) => Promise<number>
  exportSyncData: (vaultId: string) => Promise<string>
  importSyncData: (data: string, merge: boolean) => Promise<number>
  saveImage: (noteId: string, dataUrl: string) => Promise<string>
  minimize: () => void
  maximize: () => void
  close: () => void
  closeQuickCapture: () => void
  showMainWindow: () => void
  log: (...args: unknown[]) => void
  onNotesChanged: (callback: () => void) => () => void
}

declare global {
  interface Window {
    tauriAPI?: TauriAPI
    electronAPI?: TauriAPI
  }
}