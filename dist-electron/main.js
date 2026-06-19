import { createRequire as e } from "node:module";
import { BrowserWindow as t, app as n, globalShortcut as r, ipcMain as i } from "electron";
import a from "node:path";
import o from "node:fs";
import { fileURLToPath as s } from "node:url";
//#region \0rolldown/runtime.js
var c = Object.create, l = Object.defineProperty, u = Object.getOwnPropertyDescriptor, d = Object.getOwnPropertyNames, f = Object.getPrototypeOf, p = Object.prototype.hasOwnProperty, m = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), h = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = d(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !p.call(e, s) && s !== n && l(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = u(t, s)) || r.enumerable
	});
	return e;
}, g = (e, t, n) => (n = e == null ? {} : c(f(e)), h(t || !e || !e.__esModule ? l(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), _ = /* @__PURE__ */ e(import.meta.url), v = s(import.meta.url), y = a.dirname(v);
globalThis.__dirname = y, globalThis.__filename = v, global.__dirname = y, global.__filename = v;
var b = a.join(n.getPath("userData"), "noteszen.db"), x = null;
function S() {
	let e = [
		a.join(y, "../node_modules/sql.js/dist/sql-wasm.wasm"),
		a.join(n.getAppPath(), "node_modules/sql.js/dist/sql-wasm.wasm"),
		a.join(y, "sql-wasm.wasm")
	];
	for (let t of e) if (o.existsSync(t)) return t;
	let t = a.join(n.getAppPath(), "dist-electron", "sql-wasm.wasm");
	if (o.existsSync(t)) return t;
	let r = a.join(n.getAppPath(), "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm");
	return o.existsSync(r) ? r : e[0];
}
async function C() {
	try {
		let e = (await import("./sql-wasm-BhbcYolj.js").then((e) => /* @__PURE__ */ g(e.default, 1))).default, t = S(), n = await o.promises.readFile(t), r = await e({ wasmBinary: new Uint8Array(n).buffer });
		if (o.existsSync(b)) {
			let e = await o.promises.readFile(b);
			x = new r.Database(e);
		} else x = new r.Database(), x.run("\n        CREATE TABLE IF NOT EXISTS notes (\n          id TEXT PRIMARY KEY,\n          title TEXT,\n          content TEXT,\n          folder TEXT,\n          isPinned INTEGER DEFAULT 0,\n          isFavorite INTEGER DEFAULT 0,\n          isArchived INTEGER DEFAULT 0,\n          createdAt TEXT,\n          updatedAt TEXT\n        );\n        \n        CREATE TABLE IF NOT EXISTS tags (\n          noteId TEXT,\n          tag TEXT,\n          PRIMARY KEY (noteId, tag)\n        );\n\n        CREATE TABLE IF NOT EXISTS backlinks (\n          sourceId TEXT,\n          targetId TEXT,\n          PRIMARY KEY (sourceId, targetId)\n        );\n      "), await w();
		console.log("Database initialized successfully at:", b);
	} catch (e) {
		console.error("Failed to initialize sql.js database:", e);
		let t = (await import("./sql-wasm-BhbcYolj.js").then((e) => /* @__PURE__ */ g(e.default, 1))).default;
		x = new (await (t())).Database(), x.run("\n      CREATE TABLE IF NOT EXISTS notes (\n        id TEXT PRIMARY KEY,\n        title TEXT,\n        content TEXT,\n        folder TEXT,\n        isPinned INTEGER DEFAULT 0,\n        isFavorite INTEGER DEFAULT 0,\n        isArchived INTEGER DEFAULT 0,\n        createdAt TEXT,\n        updatedAt TEXT\n      );\n      CREATE TABLE IF NOT EXISTS tags (noteId TEXT, tag TEXT, PRIMARY KEY (noteId, tag));\n      CREATE TABLE IF NOT EXISTS backlinks (sourceId TEXT, targetId TEXT, PRIMARY KEY (sourceId, targetId));\n    ");
	}
}
async function w() {
	try {
		if (!x) return;
		let e = x.export(), t = Buffer.from(e);
		await o.promises.writeFile(b, t);
	} catch (e) {
		console.error("Error saving SQLite database file:", e);
	}
}
function T() {
	try {
		if (!x) return [];
		let e = x.prepare("\n      SELECT n.*, \n             (SELECT group_concat(t.tag) FROM tags t WHERE t.noteId = n.id) as tagList,\n             (SELECT group_concat(b.targetId) FROM backlinks b WHERE b.sourceId = n.id) as targetList\n      FROM notes n\n    "), t = [];
		for (; e.step();) {
			let n = e.getAsObject();
			t.push({
				id: n.id,
				title: n.title,
				content: n.content,
				folder: n.folder,
				isPinned: n.isPinned === 1,
				isFavorite: n.isFavorite === 1,
				isArchived: n.isArchived === 1,
				createdAt: n.createdAt,
				updatedAt: n.updatedAt,
				tags: n.tagList ? n.tagList.split(",") : [],
				backlinks: n.targetList ? n.targetList.split(",") : []
			});
		}
		return e.free(), t;
	} catch (e) {
		return console.error("Error querying SQLite notes:", e), [];
	}
}
async function E(e) {
	try {
		if (!x) return !1;
		if (x.run("\n      INSERT OR REPLACE INTO notes (id, title, content, folder, isPinned, isFavorite, isArchived, createdAt, updatedAt)\n      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\n    ", [
			e.id,
			e.title,
			e.content,
			e.folder,
			+!!e.isPinned,
			+!!e.isFavorite,
			+!!e.isArchived,
			e.createdAt,
			e.updatedAt
		]), x.run("DELETE FROM tags WHERE noteId = ?", [e.id]), e.tags && e.tags.length > 0) {
			let t = x.prepare("INSERT INTO tags (noteId, tag) VALUES (?, ?)");
			for (let n of e.tags) n.trim() && t.run([e.id, n.trim()]);
			t.free();
		}
		if (x.run("DELETE FROM backlinks WHERE sourceId = ?", [e.id]), e.backlinks && e.backlinks.length > 0) {
			let t = x.prepare("INSERT INTO backlinks (sourceId, targetId) VALUES (?, ?)");
			for (let n of e.backlinks) n.trim() && t.run([e.id, n.trim()]);
			t.free();
		}
		return await w(), !0;
	} catch (e) {
		return console.error("Error saving SQLite note:", e), !1;
	}
}
async function D(e) {
	try {
		return x ? (x.run("DELETE FROM notes WHERE id = ?", [e]), x.run("DELETE FROM tags WHERE noteId = ?", [e]), x.run("DELETE FROM backlinks WHERE sourceId = ? OR targetId = ?", [e, e]), await w(), !0) : !1;
	} catch (e) {
		return console.error("Error deleting SQLite note:", e), !1;
	}
}
//#endregion
//#region electron/main.ts
var O = s(import.meta.url), k = a.dirname(O);
process.env.DIST = a.join(k, "../dist"), process.env.VITE_PUBLIC = n.isPackaged ? process.env.DIST : a.join(process.env.DIST, "../public");
var A = null, j = null;
function M() {
	try {
		let e = a.join(k, "../node_modules/sql.js/dist/sql-wasm.wasm"), t = a.join(k, "sql-wasm.wasm");
		o.existsSync(e) && !o.existsSync(t) && (o.copyFileSync(e, t), console.log("Copied sql-wasm.wasm to build folder."));
	} catch (e) {
		console.error("Failed to copy sql-wasm.wasm:", e);
	}
}
function N() {
	A = new t({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 650,
		frame: !1,
		webPreferences: {
			preload: a.join(k, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	}), process.env.VITE_DEV_SERVER_URL ? A.loadURL(process.env.VITE_DEV_SERVER_URL) : A.loadFile(a.join(process.env.DIST, "index.html"));
}
function P() {
	j = new t({
		width: 500,
		height: 200,
		frame: !1,
		resizable: !1,
		show: !1,
		alwaysOnTop: !0,
		skipTaskbar: !0,
		webPreferences: {
			preload: a.join(k, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	}), process.env.VITE_DEV_SERVER_URL ? j.loadURL(`${process.env.VITE_DEV_SERVER_URL}#quick-capture`) : j.loadFile(a.join(process.env.DIST, "index.html"), { hash: "quick-capture" }), j.on("blur", () => {
		j?.hide();
	});
}
function F() {
	j || P(), j?.isVisible() ? j.hide() : (j?.show(), j?.center(), j?.focus());
}
n.on("window-all-closed", () => {
	process.platform !== "darwin" && (n.quit(), A = null, j = null);
}), n.on("activate", () => {
	t.getAllWindows().length === 0 && N();
}), n.whenReady().then(async () => {
	M(), await C(), N(), P(), r.register("CommandOrControl+Shift+Space", () => {
		F();
	}), i.handle("get-notes", async () => T()), i.handle("save-note", async (e, t) => E(t)), i.handle("delete-note", async (e, t) => D(t)), i.on("window-min", () => {
		A?.minimize();
	}), i.on("window-max", () => {
		A?.isMaximized() ? A.unmaximize() : A?.maximize();
	}), i.on("window-close", () => {
		A?.close();
	}), i.on("close-quick-capture", () => {
		j?.hide();
	}), i.on("log", (e, t) => {
		console.log("[FRONTEND LOG]", ...t);
	});
}), n.on("will-quit", () => {
	r.unregisterAll();
});
//#endregion
export { _ as n, m as t };
