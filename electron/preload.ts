import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNote: (note: any) => ipcRenderer.invoke('save-note', note),
  deleteNote: (noteId: string) => ipcRenderer.invoke('delete-note', noteId),
  minimize: () => ipcRenderer.send('window-min'),
  maximize: () => ipcRenderer.send('window-max'),
  close: () => ipcRenderer.send('window-close'),
})
