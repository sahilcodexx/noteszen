import pathNpm from 'node:path'
import fs from 'node:fs'
import { app } from 'electron'
import { fileURLToPath } from 'node:url'

// Resolve __dirname since we are in ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = pathNpm.dirname(__filename)

// Bind to global scope so bundled CommonJS packages can resolve it in ES Module output
globalThis.__dirname = __dirname
globalThis.__filename = __filename
global.__dirname = __dirname
global.__filename = __filename

const DB_PATH = pathNpm.join(app.getPath('userData'), 'noteszen.db')

let db: import('sql.js').Database | null = null

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  backlinks: string[];
}

function getWasmPath() {
  const paths = [
    pathNpm.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm'),
    pathNpm.join(app.getAppPath(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
    pathNpm.join(__dirname, 'sql-wasm.wasm')
  ]
  for (const p of paths) {
    if (fs.existsSync(p)) return p
  }
  // Try mapping through app path if in packaged app
  const defaultPath = pathNpm.join(app.getAppPath(), 'dist-electron', 'sql-wasm.wasm')
  if (fs.existsSync(defaultPath)) return defaultPath
  
  // Fallback to searching node_modules relative to app path
  const fallbackPath = pathNpm.join(app.getAppPath(), '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  if (fs.existsSync(fallbackPath)) return fallbackPath
  
  return paths[0] // fallback to default
}

export async function initDatabase() {
  try {
    const initSqlJs = (await import('sql.js')).default
    const wasmPath = getWasmPath()
    const wasmBinary = await fs.promises.readFile(wasmPath)
    const SQL = await initSqlJs({ wasmBinary: new Uint8Array(wasmBinary).buffer })

    const dbExists = fs.existsSync(DB_PATH)
    if (dbExists) {
      const filebuffer = await fs.promises.readFile(DB_PATH)
      db = new SQL.Database(filebuffer)
    } else {
      db = new SQL.Database()
      db.run(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          title TEXT,
          content TEXT,
          folder TEXT,
          isPinned INTEGER DEFAULT 0,
          isFavorite INTEGER DEFAULT 0,
          isArchived INTEGER DEFAULT 0,
          createdAt TEXT,
          updatedAt TEXT
        );
        
        CREATE TABLE IF NOT EXISTS tags (
          noteId TEXT,
          tag TEXT,
          PRIMARY KEY (noteId, tag)
        );

        CREATE TABLE IF NOT EXISTS backlinks (
          sourceId TEXT,
          targetId TEXT,
          PRIMARY KEY (sourceId, targetId)
        );
      `)
      await saveDatabase()
    }
    console.log('Database initialized successfully at:', DB_PATH)
  } catch (e) {
    console.error('Failed to initialize sql.js database:', e)
    // Fallback to in-memory database if filesystem fails
    const initSqlJs = (await import('sql.js')).default
    const SQL = await initSqlJs()
    db = new SQL.Database()
    db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        folder TEXT,
        isPinned INTEGER DEFAULT 0,
        isFavorite INTEGER DEFAULT 0,
        isArchived INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      );
      CREATE TABLE IF NOT EXISTS tags (noteId TEXT, tag TEXT, PRIMARY KEY (noteId, tag));
      CREATE TABLE IF NOT EXISTS backlinks (sourceId TEXT, targetId TEXT, PRIMARY KEY (sourceId, targetId));
    `)
  }
}

async function saveDatabase() {
  try {
    if (!db) return
    const data = db.export()
    const buffer = Buffer.from(data)
    await fs.promises.writeFile(DB_PATH, buffer)
  } catch (e) {
    console.error('Error saving SQLite database file:', e)
  }
}

export function getSqlNotes(): Note[] {
  try {
    if (!db) return []
    const stmt = db.prepare(`
      SELECT n.*, 
             (SELECT group_concat(t.tag) FROM tags t WHERE t.noteId = n.id) as tagList,
             (SELECT group_concat(b.targetId) FROM backlinks b WHERE b.sourceId = n.id) as targetList
      FROM notes n
    `)
    
    const notes: Note[] = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      notes.push({
        id: row.id as string,
        title: row.title as string,
        content: row.content as string,
        folder: row.folder as string,
        isPinned: row.isPinned === 1,
        isFavorite: row.isFavorite === 1,
        isArchived: row.isArchived === 1,
        createdAt: row.createdAt as string,
        updatedAt: row.updatedAt as string,
        tags: row.tagList ? (row.tagList as string).split(',') : [],
        backlinks: row.targetList ? (row.targetList as string).split(',') : []
      })
    }
    stmt.free()
    return notes
  } catch (e) {
    console.error('Error querying SQLite notes:', e)
    return []
  }
}

export async function saveSqlNote(note: Note): Promise<boolean> {
  try {
    if (!db) return false
    // 1. Save note
    db.run(`
      INSERT OR REPLACE INTO notes (id, title, content, folder, isPinned, isFavorite, isArchived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      note.id,
      note.title,
      note.content,
      note.folder,
      note.isPinned ? 1 : 0,
      note.isFavorite ? 1 : 0,
      note.isArchived ? 1 : 0,
      note.createdAt,
      note.updatedAt
    ])

    // 2. Save tags
    db.run(`DELETE FROM tags WHERE noteId = ?`, [note.id])
    if (note.tags && note.tags.length > 0) {
      const stmt = db.prepare(`INSERT INTO tags (noteId, tag) VALUES (?, ?)`)
      for (const tag of note.tags) {
        if (tag.trim()) {
          stmt.run([note.id, tag.trim()])
        }
      }
      stmt.free()
    }

    // 3. Save backlinks
    db.run(`DELETE FROM backlinks WHERE sourceId = ?`, [note.id])
    if (note.backlinks && note.backlinks.length > 0) {
      const stmt = db.prepare(`INSERT INTO backlinks (sourceId, targetId) VALUES (?, ?)`)
      for (const targetId of note.backlinks) {
        if (targetId.trim()) {
          stmt.run([note.id, targetId.trim()])
        }
      }
      stmt.free()
    }

    await saveDatabase()
    return true
  } catch (e) {
    console.error('Error saving SQLite note:', e)
    return false
  }
}

export async function deleteSqlNote(id: string): Promise<boolean> {
  try {
    if (!db) return false
    db.run(`DELETE FROM notes WHERE id = ?`, [id])
    db.run(`DELETE FROM tags WHERE noteId = ?`, [id])
    db.run(`DELETE FROM backlinks WHERE sourceId = ? OR targetId = ?`, [id, id])
    await saveDatabase()
    return true
  } catch (e) {
    console.error('Error deleting SQLite note:', e)
    return false
  }
}

