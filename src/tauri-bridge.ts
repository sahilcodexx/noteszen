import { invoke } from '@tauri-apps/api/core'
import type { TauriAPI } from './types'

// Check if we are running inside the Tauri environment
const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

if (isTauri) {
  const bridge: TauriAPI = {
    getNotes: () => invoke('get_notes'),
    saveNote: (note) => invoke('save_note', { note }),
    deleteNote: (noteId) => invoke('delete_note', { noteId }),
    minimize: () => invoke('minimize_window'),
    maximize: () => invoke('maximize_window'),
    close: () => invoke('close_window'),
    closeQuickCapture: () => invoke('close_quick_capture'),
    log: (...args) => invoke('log', { args }),
  };
  
  window.electronAPI = bridge;
}
