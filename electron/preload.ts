import { contextBridge, ipcRenderer } from 'electron'
import type { Note } from './db.js'

contextBridge.exposeInMainWorld('electronAPI', {
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNote: (note: Note) => ipcRenderer.invoke('save-note', note),
  deleteNote: (noteId: string) => ipcRenderer.invoke('delete-note', noteId),
  minimize: () => ipcRenderer.send('window-min'),
  maximize: () => ipcRenderer.send('window-max'),
  close: () => ipcRenderer.send('window-close'),
  closeQuickCapture: () => ipcRenderer.send('close-quick-capture'),
  log: (...args: unknown[]) => ipcRenderer.send('log', args),
})
