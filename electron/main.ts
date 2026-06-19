import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { initDatabase, getSqlNotes, saveSqlNote, deleteSqlNote } from './db.js'

// Resolve dirname since we are in ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null = null
let quickCaptureWin: BrowserWindow | null = null

// Copy sql-wasm.wasm to dist-electron if it exists in node_modules
function ensureWasmFile() {
  try {
    const srcWasm = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm')
    const destWasm = path.join(__dirname, 'sql-wasm.wasm')
    if (fs.existsSync(srcWasm) && !fs.existsSync(destWasm)) {
      fs.copyFileSync(srcWasm, destWasm)
      console.log('Copied sql-wasm.wasm to build folder.')
    }
  } catch (e) {
    console.error('Failed to copy sql-wasm.wasm:', e)
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    frame: false, // Frameless layout
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    // win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

function createQuickCaptureWindow() {
  quickCaptureWin = new BrowserWindow({
    width: 500,
    height: 200,
    frame: false,
    resizable: false,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    quickCaptureWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}#quick-capture`)
  } else {
    quickCaptureWin.loadFile(path.join(process.env.DIST!, 'index.html'), { hash: 'quick-capture' })
  }

  quickCaptureWin.on('blur', () => {
    quickCaptureWin?.hide()
  })
}

function toggleQuickCapture() {
  if (!quickCaptureWin) {
    createQuickCaptureWindow()
  }

  if (quickCaptureWin?.isVisible()) {
    quickCaptureWin.hide()
  } else {
    quickCaptureWin?.show()
    quickCaptureWin?.center()
    quickCaptureWin?.focus()
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
    quickCaptureWin = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  ensureWasmFile()
  await initDatabase()
  createWindow()
  createQuickCaptureWindow()

  // Register Global shortcut for Quick Capture (Ctrl+Shift+Space)
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    toggleQuickCapture()
  })

  // IPC handlers for notes persistence (linked to SQLite db)
  ipcMain.handle('get-notes', async () => {
    return getSqlNotes()
  })

  ipcMain.handle('save-note', async (_, note) => {
    return saveSqlNote(note)
  })

  ipcMain.handle('delete-note', async (_, noteId) => {
    return deleteSqlNote(noteId)
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

  ipcMain.on('close-quick-capture', () => {
    quickCaptureWin?.hide()
  })

  ipcMain.on('log', (_, args) => {
    console.log('[FRONTEND LOG]', ...args)
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
