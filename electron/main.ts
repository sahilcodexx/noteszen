import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// Resolve dirname since we are in ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null = null

// Path for storing notes on disk (JSON format)
const NOTES_DIR = path.join(app.getPath('userData'), 'noteszen-data')

if (!fs.existsSync(NOTES_DIR)) {
  fs.mkdirSync(NOTES_DIR, { recursive: true })
}

function createWindow() {
  win = new BrowserWindow({
    width: 1150,
    height: 780,
    minWidth: 850,
    minHeight: 600,
    frame: false, // Frameless for custom macOS window traffic lights
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'), // compiled by vite-plugin-electron
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    // win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()

  // IPC handlers for notes persistence
  ipcMain.handle('get-notes', async () => {
    try {
      const files = fs.readdirSync(NOTES_DIR)
      const notes = files
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const content = fs.readFileSync(path.join(NOTES_DIR, f), 'utf-8')
          return JSON.parse(content)
        })
      // Return notes sorted by updatedAt descending
      return notes.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (e) {
      console.error('Error reading notes:', e)
      return []
    }
  })

  ipcMain.handle('save-note', async (_, note) => {
    try {
      const filePath = path.join(NOTES_DIR, `${note.id}.json`)
      fs.writeFileSync(filePath, JSON.stringify(note, null, 2), 'utf-8')
      return true
    } catch (e) {
      console.error('Error saving note:', e)
      return false
    }
  })

  ipcMain.handle('delete-note', async (_, noteId) => {
    try {
      const filePath = path.join(NOTES_DIR, `${noteId}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return true
    } catch (e) {
      console.error('Error deleting note:', e)
      return false
    }
  })

  // Window control IPCs
  ipcMain.on('window-min', () => {
    win?.minimize()
  })

  ipcMain.on('window-max', () => {
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    win?.close()
  })
})
