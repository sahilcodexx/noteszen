import { createRequire } from "node:module";
import { BrowserWindow, app, globalShortcut, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* @__PURE__ */ createRequire(import.meta.url);
//#endregion
//#region electron/db.ts
var __filename$1 = fileURLToPath(import.meta.url);
var __dirname$1 = path.dirname(__filename$1);
globalThis.__dirname = __dirname$1;
globalThis.__filename = __filename$1;
global.__dirname = __dirname$1;
global.__filename = __filename$1;
var DB_PATH = path.join(app.getPath("userData"), "noteszen.db");
var db = null;
function getWasmPath() {
	const paths = [
		path.join(__dirname$1, "../node_modules/sql.js/dist/sql-wasm.wasm"),
		path.join(app.getAppPath(), "node_modules/sql.js/dist/sql-wasm.wasm"),
		path.join(__dirname$1, "sql-wasm.wasm")
	];
	for (const p of paths) if (fs.existsSync(p)) return p;
	const defaultPath = path.join(app.getAppPath(), "dist-electron", "sql-wasm.wasm");
	if (fs.existsSync(defaultPath)) return defaultPath;
	const fallbackPath = path.join(app.getAppPath(), "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm");
	if (fs.existsSync(fallbackPath)) return fallbackPath;
	return paths[0];
}
async function initDatabase() {
	try {
		const initSqlJs = (await import("./sql-wasm-RRobC6sV.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1))).default;
		const wasmPath = getWasmPath();
		const wasmBinary = await fs.promises.readFile(wasmPath);
		const SQL = await initSqlJs({ wasmBinary: new Uint8Array(wasmBinary).buffer });
		if (fs.existsSync(DB_PATH)) {
			const filebuffer = await fs.promises.readFile(DB_PATH);
			db = new SQL.Database(filebuffer);
		} else {
			db = new SQL.Database();
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
      `);
			await saveDatabase();
		}
		console.log("Database initialized successfully at:", DB_PATH);
	} catch (e) {
		console.error("Failed to initialize sql.js database:", e);
		const initSqlJs = (await import("./sql-wasm-RRobC6sV.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1))).default;
		db = new (await (initSqlJs())).Database();
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
    `);
	}
}
async function saveDatabase() {
	try {
		if (!db) return;
		const data = db.export();
		const buffer = Buffer.from(data);
		await fs.promises.writeFile(DB_PATH, buffer);
	} catch (e) {
		console.error("Error saving SQLite database file:", e);
	}
}
function getSqlNotes() {
	try {
		if (!db) return [];
		const stmt = db.prepare(`
      SELECT n.*, 
             (SELECT group_concat(t.tag) FROM tags t WHERE t.noteId = n.id) as tagList,
             (SELECT group_concat(b.targetId) FROM backlinks b WHERE b.sourceId = n.id) as targetList
      FROM notes n
    `);
		const notes = [];
		while (stmt.step()) {
			const row = stmt.getAsObject();
			notes.push({
				id: row.id,
				title: row.title,
				content: row.content,
				folder: row.folder,
				isPinned: row.isPinned === 1,
				isFavorite: row.isFavorite === 1,
				isArchived: row.isArchived === 1,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
				tags: row.tagList ? row.tagList.split(",") : [],
				backlinks: row.targetList ? row.targetList.split(",") : []
			});
		}
		stmt.free();
		return notes;
	} catch (e) {
		console.error("Error querying SQLite notes:", e);
		return [];
	}
}
async function saveSqlNote(note) {
	try {
		if (!db) return false;
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
		]);
		db.run(`DELETE FROM tags WHERE noteId = ?`, [note.id]);
		if (note.tags && note.tags.length > 0) {
			const stmt = db.prepare(`INSERT INTO tags (noteId, tag) VALUES (?, ?)`);
			for (const tag of note.tags) if (tag.trim()) stmt.run([note.id, tag.trim()]);
			stmt.free();
		}
		db.run(`DELETE FROM backlinks WHERE sourceId = ?`, [note.id]);
		if (note.backlinks && note.backlinks.length > 0) {
			const stmt = db.prepare(`INSERT INTO backlinks (sourceId, targetId) VALUES (?, ?)`);
			for (const targetId of note.backlinks) if (targetId.trim()) stmt.run([note.id, targetId.trim()]);
			stmt.free();
		}
		await saveDatabase();
		return true;
	} catch (e) {
		console.error("Error saving SQLite note:", e);
		return false;
	}
}
async function deleteSqlNote(id) {
	try {
		if (!db) return false;
		db.run(`DELETE FROM notes WHERE id = ?`, [id]);
		db.run(`DELETE FROM tags WHERE noteId = ?`, [id]);
		db.run(`DELETE FROM backlinks WHERE sourceId = ? OR targetId = ?`, [id, id]);
		await saveDatabase();
		return true;
	} catch (e) {
		console.error("Error deleting SQLite note:", e);
		return false;
	}
}
//#endregion
//#region electron/main.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
var win = null;
var quickCaptureWin = null;
function ensureWasmFile() {
	try {
		const srcWasm = path.join(__dirname, "../node_modules/sql.js/dist/sql-wasm.wasm");
		const destWasm = path.join(__dirname, "sql-wasm.wasm");
		if (fs.existsSync(srcWasm) && !fs.existsSync(destWasm)) {
			fs.copyFileSync(srcWasm, destWasm);
			console.log("Copied sql-wasm.wasm to build folder.");
		}
	} catch (e) {
		console.error("Failed to copy sql-wasm.wasm:", e);
	}
}
function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 650,
		frame: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			nodeIntegration: false,
			contextIsolation: true
		}
	});
	if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
	else win.loadFile(path.join(process.env.DIST, "index.html"));
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
			preload: path.join(__dirname, "preload.mjs"),
			nodeIntegration: false,
			contextIsolation: true
		}
	});
	if (process.env.VITE_DEV_SERVER_URL) quickCaptureWin.loadURL(`${process.env.VITE_DEV_SERVER_URL}#quick-capture`);
	else quickCaptureWin.loadFile(path.join(process.env.DIST, "index.html"), { hash: "quick-capture" });
	quickCaptureWin.on("blur", () => {
		quickCaptureWin?.hide();
	});
}
function toggleQuickCapture() {
	if (!quickCaptureWin) createQuickCaptureWindow();
	if (quickCaptureWin?.isVisible()) quickCaptureWin.hide();
	else {
		quickCaptureWin?.show();
		quickCaptureWin?.center();
		quickCaptureWin?.focus();
	}
}
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
		quickCaptureWin = null;
	}
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.whenReady().then(async () => {
	ensureWasmFile();
	await initDatabase();
	createWindow();
	createQuickCaptureWindow();
	globalShortcut.register("CommandOrControl+Shift+Space", () => {
		toggleQuickCapture();
	});
	ipcMain.handle("get-notes", async () => {
		return getSqlNotes();
	});
	ipcMain.handle("save-note", async (_, note) => {
		return saveSqlNote(note);
	});
	ipcMain.handle("delete-note", async (_, noteId) => {
		return deleteSqlNote(noteId);
	});
	ipcMain.on("window-min", () => {
		win?.minimize();
	});
	ipcMain.on("window-max", () => {
		if (win?.isMaximized()) win.unmaximize();
		else win?.maximize();
	});
	ipcMain.on("window-close", () => {
		win?.close();
	});
	ipcMain.on("close-quick-capture", () => {
		quickCaptureWin?.hide();
	});
	ipcMain.on("log", (_, args) => {
		console.log("[FRONTEND LOG]", ...args);
	});
});
app.on("will-quit", () => {
	globalShortcut.unregisterAll();
});
//#endregion
export { __require as n, __commonJSMin as t };
