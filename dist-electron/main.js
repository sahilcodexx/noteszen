import { BrowserWindow as e, app as t, ipcMain as n } from "electron";
import r from "node:path";
import i from "node:fs";
import { fileURLToPath as a } from "node:url";
//#region electron/main.ts
var o = a(import.meta.url), s = r.dirname(o);
process.env.DIST = r.join(s, "../dist"), process.env.VITE_PUBLIC = t.isPackaged ? process.env.DIST : r.join(process.env.DIST, "../public");
var c = null, l = r.join(t.getPath("userData"), "noteszen-data");
i.existsSync(l) || i.mkdirSync(l, { recursive: !0 });
function u() {
	c = new e({
		width: 1150,
		height: 780,
		minWidth: 850,
		minHeight: 600,
		frame: !1,
		webPreferences: {
			preload: r.join(s, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	}), process.env.VITE_DEV_SERVER_URL ? c.loadURL(process.env.VITE_DEV_SERVER_URL) : c.loadFile(r.join(process.env.DIST, "index.html"));
}
t.on("window-all-closed", () => {
	process.platform !== "darwin" && (t.quit(), c = null);
}), t.on("activate", () => {
	e.getAllWindows().length === 0 && u();
}), t.whenReady().then(() => {
	u(), n.handle("get-notes", async () => {
		try {
			return i.readdirSync(l).filter((e) => e.endsWith(".json")).map((e) => {
				let t = i.readFileSync(r.join(l, e), "utf-8");
				return JSON.parse(t);
			}).sort((e, t) => new Date(t.updatedAt).getTime() - new Date(e.updatedAt).getTime());
		} catch (e) {
			return console.error("Error reading notes:", e), [];
		}
	}), n.handle("save-note", async (e, t) => {
		try {
			let e = r.join(l, `${t.id}.json`);
			return i.writeFileSync(e, JSON.stringify(t, null, 2), "utf-8"), !0;
		} catch (e) {
			return console.error("Error saving note:", e), !1;
		}
	}), n.handle("delete-note", async (e, t) => {
		try {
			let e = r.join(l, `${t}.json`);
			return i.existsSync(e) && i.unlinkSync(e), !0;
		} catch (e) {
			return console.error("Error deleting note:", e), !1;
		}
	}), n.on("window-min", () => {
		c?.minimize();
	}), n.on("window-max", () => {
		c?.isMaximized() ? c.unmaximize() : c?.maximize();
	}), n.on("window-close", () => {
		c?.close();
	});
});
//#endregion
export {};
