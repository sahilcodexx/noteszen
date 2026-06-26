import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { TauriAPI } from './types'

const isTauri =
  typeof window !== 'undefined' &&
  (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !== undefined

function createBridge(): TauriAPI {
  return {
    getNotes: (vaultId) => invoke('get_notes', { vaultId }),
    saveNote: (note, saveVersion) => invoke('save_note', { note, saveVersion }),
    deleteNote: (noteId) => invoke('delete_note', { noteId }),
    importNotes: (notes, merge) => invoke('import_notes_cmd', { notes, merge }),
    searchNotes: (query, vaultId) => invoke('search_notes', { query, vaultId }),
    getFolders: (vaultId) => invoke('get_folders_cmd', { vaultId }),
    saveFolder: (folder) => invoke('save_folder_cmd', { folder }),
    deleteFolder: (folderId) => invoke('delete_folder_cmd', { folderId }),
    getTemplates: () => invoke('get_templates_cmd'),
    saveTemplate: (template) => invoke('save_template_cmd', { template }),
    deleteTemplate: (templateId) => invoke('delete_template_cmd', { templateId }),
    getNoteVersions: (noteId) => invoke('get_note_versions_cmd', { noteId }),
    restoreVersion: (versionId) => invoke('restore_version_cmd', { versionId }),
    getVaults: () => invoke('get_vaults_cmd'),
    setActiveVault: (vaultId) => invoke('set_active_vault_cmd', { vaultId }),
    createVault: (vault) => invoke('create_vault_cmd', { vault }),
    getSetting: (key) => invoke('get_setting_cmd', { key }),
    saveSetting: (key, value) => invoke('save_setting_cmd', { key, value }),
    purgeOldTrash: (days) => invoke('purge_old_trash_cmd', { days }),
    exportSyncData: (vaultId) => invoke('export_sync_data_cmd', { vaultId }),
    importSyncData: (data, merge) => invoke('import_sync_data_cmd', { data, merge }),
    saveImage: (noteId, dataUrl) => invoke('save_image', { noteId, dataUrl }),
    minimize: () => { invoke('minimize_window') },
    maximize: () => { invoke('maximize_window') },
    close: () => { invoke('close_window') },
    closeQuickCapture: () => { invoke('close_quick_capture') },
    showMainWindow: () => { invoke('show_main_window') },
    log: (...args) => { invoke('log', { args }) },
    onNotesChanged: (callback) => {
      let unlisten: (() => void) | undefined
      listen('notes-changed', () => callback()).then((fn) => {
        unlisten = fn
      })
      return () => unlisten?.()
    },
  }
}

if (isTauri) {
  const bridge = createBridge()
  window.tauriAPI = bridge
  window.electronAPI = bridge
}

export function getAPI(): TauriAPI | undefined {
  return window.tauriAPI ?? window.electronAPI
}